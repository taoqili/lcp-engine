import logger from '@ali/vu-logger';
import EventEmitter = require('events');

let busInstance: Bus;

/**
 * Bus class as an EventEmitter
 *
 * @class Bus
 */
class Bus {

  /**
   * Instance of Node EventEmitter as 'events'
   *
   * @private
   * @type {EventEmitter}
   * @memberof Bus
   */
  private emitter: EventEmitter;

  constructor() {
    if (busInstance) {
      return busInstance;
    }
    busInstance = this;
    this.emitter = new EventEmitter();
  }

  public getEmitter() {
    return this.emitter;
  }

  // alias to sub
  public on(event: string | symbol, func: (...args: any[]) => any): any {
    return this.sub(event, func);
  }

  // alias to unsub
  public off(event: string, func: (...args: any[]) => any) {
    this.unsub(event, func);
  }

  // alias to pub
  public emit(event: string, ...args: any[]): boolean {
    return this.pub(event, ...args);
  }

  public sub(event: string | symbol, func: (...args: any[]) => any) {
    this.emitter.on(event, func);
    return () => {
      this.emitter.removeListener(event, func);
    };
  }

  public once(event: string, func: (...args: any[]) => any) {
    this.emitter.once(event, func);
    return () => {
      this.emitter.removeListener(event, func);
    };
  }

  public unsub(event: string, func: (...args: any[]) => any) {
    if (func) {
      this.emitter.removeListener(event, func);
    } else {
      this.emitter.removeAllListeners(event);
    }
  }

  /**
   * Release & Publish Events
   *
   * @param {string} event 事件名称
   * @param {...any[]} args 事件参数
   * @memberof Bus
   */
  public pub(event: string, ...args: any[]): boolean {
    logger.info('INFO:', 'eventData:', event, ...args);
    return this.emitter.emit(event, ...args);
  }

  public removeListener(eventName: string | symbol, callback: () => any) {
    return this.emitter.removeListener(eventName, callback);
  }
}

export default Bus;
