import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import got from "got";
import {timedQuery} from "../../../helpers/functions";
import { FeatureFlagClient } from "../../../shared/featureFlag/FeatureFlagClient";
import { FeatureFlagName } from "../../../featureFlags";
import { hLog } from "../../../../helpers/common_functions";


async function getAccount(fastify: FastifyInstance, request: FastifyRequest) {


    const query: any = request.query;

    const response = {
        account: null,
        actions: null,
        total_actions: 0,
        tokens: null,
        links: null
    };

    const account = query.account;
    const reqQueue = [];

    try {
        hLog('attempting to get account')
        response.account = await fastify.eosjs.rpc.get_account(account);
    } catch (e) {
        hLog(`Failed to fetch account: ${e}`)
        throw new Error("Account not found!");
    }

    const localApi = `http://${fastify.manager.config.api.server_addr}:${fastify.manager.config.api.server_port}/v2`;
    const getTokensApi = localApi + '/state/get_tokens';
    const getActionsApi = localApi + '/history/get_actions';
    const getLinksApi = localApi + '/state/get_links';

    // fetch recent actions
    reqQueue.push(got.get(`${getActionsApi}?account=${account}&limit=20&noBinary=true&track=true`).json());

    // fetch account tokens
    reqQueue.push(got.get(`${getTokensApi}?account=${account}`).json());

    // fetch account permission links
    reqQueue.push(got.get(`${getLinksApi}?account=${account}`).json());

    const results = await Promise.all(reqQueue);
    response.actions = results[0].actions;
    response.total_actions = results[0].total.value;
    response.tokens = results[1].tokens;
    response.links = results[2].links;
    return response;
}

export function getAccountHandler(fastify: FastifyInstance, route: string, featureFlagClient: FeatureFlagClient) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const systemAccountsFfValue = await featureFlagClient.variation(FeatureFlagName.VoiceSystemAccounts) as string;
        const systemAccounts = JSON.parse(systemAccountsFfValue ?? '[]');

        const account = (request.query as any)?.account?.toLowerCase() ?? '';
        if (account.length > 0 && systemAccounts.includes(account)) {
          hLog(`failed in account handler. Account: ${account} sys account ff value ${systemAccountsFfValue}`)
          reply.status(403).send('forbidden');
        } else {
          hLog('sending the account response')
          try{
            reply.send(await timedQuery(getAccount, fastify, request, route));
          } catch(error){
              hLog(`Error sending the response. Error: ${error}`)
          }
        }
    }
}
