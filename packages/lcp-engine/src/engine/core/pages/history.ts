import lg from '@ali/vu-logger';
import * as EventEmitter from 'events';
import { Map } from 'immutable';
import Bus from '../bus';
import Overlay from '../overlay';
import Session from './session';

export default class History {

  public logger: (hotData: Map<string, any>) => any;
  public redoer: (hotData: Map<string, any>) => any;
  public session: Session;
  public records: Session[];
  public point: number;
  public bus: Bus;
  public emitter: EventEmitter;

  constructor(logger: (hotData?: Map<string, any>) => any, redoer: (hotData: Map<string, any>) => any) {
    this.logger = logger;
    this.redoer = redoer;
    this.session = new Session(0, 'Open', logger());
    this.records = [this.session];
    this.session.end();
    this.point = 0;
    this.bus = new Bus();
    this.emitter = new EventEmitter();
  }

  public getRecords() {
    return this.records;
  }

  public getCurrentCursor() {
    return this.session.getCursor();
  }

  public getHotData() {
    return this.session.getData();
  }

  public isModified() {
    return this.point !== this.session.getCursor();
  }

  public log(title: string) {
    if (!this.session) { return; }
    const currentHotData = this.session.getData();
    const hotData = this.logger(currentHotData);
    if (hotData.equals(currentHotData)) {
      return;
    }

    if (this.session.isActive()) {
      this.session.log(title, hotData);
    } else {
      this.session.end();
      const cursor = this.session.getCursor() + 1;
      const session = new Session(cursor, title, hotData);
      this.session = session;
      this.records.splice(cursor, this.records.length - cursor, session);
    }

    Overlay.touch(true);
    this.emitter.emit('statechange', this.getState());
  }

  public go(cursor: number) {
    if (!this.session) { return; }
    this.session.end();

    const currentCursor = this.session.getCursor();
    cursor = +cursor;
    if (cursor < 0) {
      cursor = 0;
    } else if (cursor >= this.records.length) {
      cursor = this.records.length - 1;
    }
    if (cursor === currentCursor) { return; }

    const session = this.records[cursor];
    const hotData = session.getData();

    this.session = null;
    try {
      this.redoer(hotData);
      this.emitter.emit('cursor', hotData);
    } catch (e) {
      lg.error('ERROR: redo action ', e);
    }

    this.session = session;
    if (lg.getEnv() !== 'production') {
      console.groupCollapsed(`Cursor(${cursor}) ${session.getTitle()}`);
      console.log(`%c ${session.getTitle()}`,
        'color:#9E9E9E;font-weight:bold;line-height:19px', hotData.toJS());
      console.groupEnd();
    }

    Overlay.touch(true);
    this.emitter.emit('statechange', this.getState());
  }

  public back() {
    if (!this.session) { return; }
    const cursor = this.getCurrentCursor() - 1;
    this.bus.emit('ve.history.back', cursor);
    this.go(cursor);
  }

  public forward() {
    if (!this.session) { return; }
    const cursor = this.getCurrentCursor() + 1;
    this.bus.emit('ve.history.forward', cursor);
    this.go(cursor);
  }

  public savePoint() {
    if (!this.session) { return; }
    this.session.end();
    this.point = this.session.getCursor();
    this.emitter.emit('statechange', this.getState());
  }

  /**
   *  |    1     |     1    |    1     |
   *  | -------- | -------- | -------- |
   *  | modified | redoable | undoable |
   *
   * @returns {number}
   */
  public getState() {
    const cursor = this.session.getCursor();
    let state = 7;
    // undoable ?
    if (cursor <= 0) {
      state -= 1;
    }
    // redoable ?
    if (cursor >= this.records.length - 1) {
      state -= 2;
    }
    // modified ?
    if (this.point === cursor) {
      state -= 4;
    }
    return state;
  }

  public onStateChange(func: () => any) {
    this.emitter.on('statechange', func);
    return () => {
      this.emitter.removeListener('statechange', func);
    };
  }

  public onCursor(func: () => any) {
    this.emitter.on('cursor', func);
    return () => {
      this.emitter.removeListener('cursor', func);
    };
  }

  public destroy() {
    this.emitter.removeAllListeners();
    this.records = [];
  }
}
