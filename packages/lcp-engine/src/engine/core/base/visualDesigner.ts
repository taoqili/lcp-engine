import EventEmitter = require('events');
import { assign, find, get } from 'lodash';
import { Component } from 'react';

import Bus from '../bus';
import {
  BaseManager,

  connectGeneralManager,
  connectGeneralManagerList,

  IDesignerController,
  IEmitter,
  IEventNameMap,
  IManagerController,
  INameable,
  IObservable,
} from './base';
import VisualManager from './visualManager';

interface IDesignerProps {
  name?: string;
  visualManagers?: VisualManager[];
  emitter?: IEmitter;
}

export default class VisualDesigner extends Component
  implements IManagerController, IObservable, INameable {

  public static NAME: string = 'VisualDesigner';
  public static EVENTS: IEventNameMap = {};
  public readonly props: IDesignerProps;
  public defaultProps: IDesignerProps = {
    name: 'defaultDesigner',
    visualManagers: [],
  };

  private visualManagerList: VisualManager[];
  private name: string;
  private id: string;
  private emitter: IEmitter;

  constructor(props: IDesignerProps) {
    super(props);
    this.setName(props.name || get(this, 'constructor', 'NAME'));
    this.connectManagerList(this.props.visualManagers);

    if (props.emitter) {
      // 使用自定义的满足 EventEmitter 接口要求的自定义事件对象
      this.emitter = props.emitter;
    } else {
      this.emitter = new Bus();
    }
  }

  public getId(): string {
    return this.id;
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public getName() {
    return this.name;
  }

  public getManager(): VisualManager {
    return this.visualManagerList[0];
  }

  public getManagerByName(name?: string): VisualManager[] {
    return this.visualManagerList.filter((m) => m.getName() === name);
  }

  public getManagerById(id: string): VisualManager {
    return find(this.visualManagerList, (m) => m.getId() === id);
  }

  public getManagerList(): VisualManager[] {
    return this.visualManagerList;
  }

  public connectManager(manager: VisualManager) {
    connectGeneralManager.call(this, manager, this.visualManagerList);
    return this;
  }

  public connectManagerList(managerList: VisualManager[]): this {
    this.visualManagerList =
      connectGeneralManagerList.call(this, managerList, this.visualManagerList);
    return this;
  }

  public getEventMap() {
    /**
     * Hack for get current constructor
     * because if we write this.constructor.EVENTS
     * ts compiler will show compiled error
     */
    return get(this, 'constructor', BaseManager.EVENTS);
  }

  public notifyAllManagers(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.visualManagerList.map((m) => m.emit(eventName, eventData)).every((r) => r);
  }

  public on(eventName: string | symbol, callback: () => any) {
    this.emitter.on(eventName, callback);
    return () => this.emitter.removeListener(eventName, callback);
  }

  public emit(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.emitter.emit.call(this.emitter, eventName, ...eventData);
  }
}
