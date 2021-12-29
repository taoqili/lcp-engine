import { EventEmitter } from 'events';
import { get } from 'lodash';

import Exchange from '../exchange';
import DOMObserver from './domobserver';
import Watcher from './watcher';

class OutlineSync {

  public domObserver: DOMObserver;
  public emitter: EventEmitter;
  public currentNode: any;
  public mountOff: () => any;
  public watchOff: () => any;

  constructor(name: string) {
    this.emitter = new EventEmitter();

    get(Exchange, `on${name}Change`).bind(Exchange)((node: any) => {
      if (node) {
        this.observe(node);
      } else {
        this.stop();
      }
      this.emitter.emit('sync');
    });

    const currentNode = get(Exchange, `get${name}`).bind(Exchange)();
    if (currentNode) {
      this.observe(currentNode);
    }
  }

  public observe(node: any) {
    if (node === this.currentNode) { return; }

    const sync = () => this.emitter.emit('sync');

    if (!this.domObserver) {
      this.domObserver = new DOMObserver(sync);
    }
    this.domObserver.observe(node);

    if (this.mountOff) {
      this.mountOff();
      this.mountOff = null;
    }

    this.mountOff = node.onMountChange(() => {
      this.domObserver.observe(node);
      sync();
    });

    if (!this.watchOff) {
      this.watchOff = Watcher.addSync(sync);
    }
    this.currentNode = node;
  }

  public stop() {
    this.currentNode = null;
    if (this.domObserver) {
      this.domObserver.stop();
    }
    if (this.mountOff) {
      this.mountOff();
      this.mountOff = null;
    }
    if (this.watchOff) {
      this.watchOff();
      this.watchOff = null;
    }
  }

  public hasOutline() {
    return this.currentNode && this.currentNode.isMount();
  }

  public getCurrentNode() {
    return this.currentNode;
  }

  public onSync(func: () => any) {
    this.emitter.on('sync', func);
    return () => {
      this.emitter.removeListener('sync', func);
    };
  }
}

export default OutlineSync;
