import {HyperionWorker} from "./hyperionWorker";
import {AsyncCargo, cargo} from "async";

const {routes} = require("../helpers/elastic-routes");

import * as pm2io from '@pm2/io';

export default class IndexerWorker extends HyperionWorker {
    private ch_ready = false;
    private indexQueue: AsyncCargo;
    private temp_indexed_count = 0;

    constructor() {
        super();
        this.indexQueue = cargo((payload: any[], callback) => {
            if (this.ch_ready && payload) {
                routes[process.env.type](payload, this.ch, (indexed_size) => {
                    if (indexed_size) {
                        this.temp_indexed_count += indexed_size;
                    }
                    callback();
                });
            }
        })
    }

    assertQueues(): void {
        try {
            if (this.ch) {
                this.ch_ready = true;
                this.ch.on('close', () => {
                    this.indexQueue.pause();
                    this.ch_ready = false;
                });
                this.ch.assertQueue(process.env.queue, {durable: true});
                this.ch.prefetch(this.conf.prefetch.index);
                this.ch.consume(process.env.queue, this.indexQueue.push);
                console.log(`indexer listening on ${process.env['queue']}`);
            }
        } catch (e) {
            console.error('rabbitmq error!');
            console.log(e);
            process.exit(1);
        }
    }

    startMonitoring() {
        setInterval(() => {
            if (this.temp_indexed_count > 0) {
                process.send({event: 'add_index', size: this.temp_indexed_count});
            }
            this.temp_indexed_count = 0;
        }, 1000);
    }

    onIpcMessage(msg: any): void {
        console.log(msg);
    }

    async run(): Promise<void> {
        this.startMonitoring();
        pm2io.action('stop', (reply) => {
            this.ch.close(() => {
                reply({
                    event: 'index_channel_closed'
                });
            });
        });
    }
}
