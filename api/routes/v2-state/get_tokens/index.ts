import {FastifyInstance} from "fastify";
import {addFeatureFlaggedApiRoute, extendQueryStringSchema, getRouteName} from "../../../helpers/functions";
import {getTokensHandler} from "./get_tokens";

export default function (fastify: FastifyInstance, opts: any, next) {
    const schema = {
        description: 'get tokens from an account',
        summary: 'get all tokens',
        tags: ['accounts'],
        querystring: extendQueryStringSchema({
            "account": {
                description: 'account name',
                type: 'string',
                minLength: 1,
                maxLength: 12
            }
        }, ["account"])
    };
    addFeatureFlaggedApiRoute(
        fastify,
        'GET',
        getRouteName(__filename),
        opts.featureFlagClient,
        getTokensHandler,
        schema
    );
    next();
}
