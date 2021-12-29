import * as EventEmitter from 'events';
import * as React from 'react';

const { testType, uniqueId } = require('@ali/ve-utils');

export interface IPaneConfig {
  id: string;
  init?: () => any;
  destroy?: () => any;
  content?: JSX.Element;
  props?: any;
  title?: string;
  name?: string;
  tip?: string | {
    url?: string;
    content?: string | JSX.Element;
  };
  description?: string;
}

class Pane {

  public id: string;
  public config: IPaneConfig;
  public emitter: EventEmitter;
  public hidden: boolean;
  public content: any;

  constructor(config: IPaneConfig) {
    this.config = config;
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(0);
    this.id = config.id || uniqueId(null, 'pane', 'engine-pane');
    if (config.init) {
      config.init.call(this);
    }
    this.hidden = false;
    this.content = this.initContent(config.content);
  }

  public isHidden() {
    return this.hidden;
  }

  public getProps() {
    return {
      pane: this,
      ...this.config.props,
    };
  }

  public initContent(content: any) {
    const type = testType(content);
    const props = this.getProps();

    if (type === 'ReactElement' && props) {
      return React.cloneElement(content, props);
    }
    if (type === 'ReactClass') {
      return React.createElement(content, props);
    }
    if (type === 'function') {
      return content(props);
    }
    return content;
  }

  public show() {
    this.hidden = false;
  }

  public hide() {
    this.hidden = true;
  }

  public getId() {
    return this.id;
  }

  public getTitle() {
    return this.config.title || this.getName();
  }

  public getName() {
    return this.config.name || this.getId();
  }

  public getContent() {
    return this.content || '';
  }

  // 获得该 Pane 下的帮助信息
  public getTip() {
    return this.config.tip;
  }

  public destroy() {
    if (this.config.destroy) {
      this.config.destroy.call(this);
    }
  }
}

export default Pane;
