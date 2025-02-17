import {join} from "path";
import {FastifyError, FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {createReadStream} from "fs";
import {addSharedSchemas, handleChainApiRedirect} from "./helpers/functions";
import autoLoad from 'fastify-autoload';
import got from "got";
import { FeatureFlagClient } from "./shared/featureFlag/FeatureFlagClient";

function addRedirect(server: FastifyInstance, url: string, redirectTo: string) {
    server.route({
        url,
        method: 'GET',
        schema: {
            hide: true
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            reply.redirect(redirectTo);
        }
    });
}

function addRoute(server: FastifyInstance, handlersPath: string, prefix: string, featureFlagClient?: FeatureFlagClient) {
    server.register(autoLoad, {
        dir: join(__dirname, 'routes', handlersPath),
        ignorePattern: /.*(handler|schema).js/,
        dirNameRoutePrefix: false,
        options: {
            prefix,
            featureFlagClient,
        }
    });
}

export function registerRoutes(server: FastifyInstance, featureFlagClient?: FeatureFlagClient) {

    // build internal map of routes
    const routeSet = new Set<string>();
    server.decorate('routeSet', routeSet);
    const ignoreList = [
        '/v2',
        '/v2/history',
        '/v2/state',
        '/v1/chain/*',
        '/v1/chain'
    ];
    server.addHook('onRoute', opts => {
        if (!ignoreList.includes(opts.url)) {
            if (opts.url.startsWith('/v')) {
                routeSet.add(opts.url);
            }
        }
    });

    // Register fastify api routes
    addRoute(server, 'v2', '/v2');
    addRoute(server, 'v2-history', '/v2/history');
    addRoute(server, 'v2-state', '/v2/state', featureFlagClient);
    addRoute(server, 'v2-stats', '/v2/stats');

    // legacy routes
    addRoute(server, 'v1-trace', '/v1/trace_api', featureFlagClient);

    addSharedSchemas(server);

	  // other v1 requests
    server.route({
        url: '/v1/chain/*',
        method: ["GET", "POST"],
        schema: {
            summary: "Wildcard chain api handler",
            tags: ["chain"]
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {

            console.log(request.url);

            // restrict access to only the api endpoints the frontend is using
            const allowedRoutes = ['/v1/chain/get_info', '/v1/chain/get_table_by_scope']
            if (allowedRoutes.includes(request.url)) {
               await handleChainApiRedirect(request, reply, server);
            } else {
                reply.code(404).send({ error: 'Not found' });
            }
        }
    });

    server.addHook('onError', (request: FastifyRequest, reply: FastifyReply, error: FastifyError, done) => {
        console.log(`[${request.headers['x-real-ip'] || request.ip}] ${request.method} ${request.url} failed >> ${error.message}`);
        done();
    });

    if (server.manager.config.features.streaming) {
        // steam client lib
        server.get(
            '/stream-client.js',
            {schema: {tags: ['internal']}},
            (request: FastifyRequest, reply: FastifyReply) => {
                const stream = createReadStream('./hyperion-stream-client.js');
                reply.type('application/javascript').send(stream);
            });
    }

    // Redirect routes to documentation
    addRedirect(server, '/v2', '/v2/docs');
    addRedirect(server, '/v2/history', '/v2/docs/static/index.html#/history');
    addRedirect(server, '/v2/state', '/v2/docs/static/index.html#/state');
    addRedirect(server, '/v1/chain', '/v2/docs/static/index.html#/chain');
    addRedirect(server, '/explorer', '/v2/explore');
    addRedirect(server, '/explore', '/v2/explore');
    addRedirect(server, '/', '/v2/explore')
}
