import lg from '@ali/vu-logger';
import { Map } from 'immutable';

export default class Session {

  public static TIME_GAP_TO_LOG = 1000;

  public data: Map<string, any>;
  public cursor: number;
  public title: string;

  public activedTimer: number;

  constructor(cursor: number, title: string, data: any) {
    this.cursor = cursor;
    this.title = title;
    if (lg.getEnv() !== 'production') {
      /* tslint:disable no-console */
      console.groupCollapsed(`History(${cursor}) ${title}`);
    }
    this.setTimer();
    this.log(title, data);
  }

  public getCursor() {
    return this.cursor;
  }

  public getTitle() {
    return this.title;
  }

  public getData() {
    return this.data;
  }

  public setTimer() {
    this.clearTimer();
    this.activedTimer = window.setTimeout(() => this.end(), Session.TIME_GAP_TO_LOG);
  }

  public clearTimer() {
    if (this.activedTimer) {
      clearTimeout(this.activedTimer);
    }
    this.activedTimer = null;
  }

  public log(title: string, data: any) {
    if (!this.isActive()) { return; }
    this.data = data;
    if (lg.getEnv() !== 'production') {
      console.log(`%c ${title}`, 'color:#03A9F4;font-weight:bold;line-height:19px', data.toJS && data.toJS());
    }
    this.setTimer();
  }

  public isActive() {
    return this.activedTimer != null;
  }

  public end() {
    this.clearTimer();
    if (lg.getEnv() !== 'production') {
      try {
        console.groupEnd();
      } catch (e) {
        console.log('—— log end ——');
      }
    }
  }
}
