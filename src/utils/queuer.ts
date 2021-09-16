/* eslint-disable @typescript-eslint/ban-types */

import { sleep } from './functions.js';

type queue_item = {
  function: Function;
  promise: {
    resolve: Function;
    reject: Function;
  };
};

export default class Queuer {
  private timeout: number;
  private running = false;
  private queued = [] as queue_item[];

  constructor(timeout = 0) {
    this.timeout = timeout;
  }

  private async run(): Promise<void> {
    this.running = true;

    while (this.queued.length > 0) {
      const this_queue = this.queued.shift();

      try {
        const promise = await Promise.race([this_queue?.function()]);
        this_queue?.promise.resolve(promise);
      } catch (error) {
        this_queue?.promise.reject(error);
      } finally {
        if (this.timeout > 0) await sleep(this.timeout);
      }
    }

    this.running = false;
  }

  queue<T>(func: Function): Promise<T> {
    const this_queue = { function: func } as queue_item;
    const promise = new Promise<T>((res, rej) => {
      this_queue.promise = {
        resolve: res,
        reject: rej,
      };
    });

    this.queued.push(this_queue);

    if (!this.running) {
      this.run();
    }

    return promise;
  }
}
