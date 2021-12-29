import * as EventEmitter from 'events';
import { Node } from './node';
import { IVariableSettable } from './prop';
import { releaseItems } from './props';

const { uniqueId } = require('@ali/ve-utils');

export default class Group implements IVariableSettable {

  public inGroup: boolean;
  public id: string;
  public node: Node;
  public config: any;
  public name: string;
  public expanded: boolean;
  public items: any[];
  public emitter: EventEmitter;

  public useVariable: boolean;
  public variableValue: string;

  constructor(target: any, config: any, dataGetter: any) {
    this.id = uniqueId(null, 'group', 'engine-group');
    this.node = target.getNode();
    this.config = config || {};
    this.name = this.config.name || this.id;
    if (target.getName) {
      this.name = `${target.getName()}.${this.name}`;
    }
    this.expanded = !(this.config.collapsed || this.config.fieldCollapsed);
    this.items = releaseItems(this.config.items, target, dataGetter, true);
    this.emitter = new EventEmitter();
  }

  public getId() {
    return this.id;
  }

  public getNode() {
    return this.node;
  }

  public getProps() {
    return this.getNode().getProps();
  }

  public getTip() {
    return this.config.tip;
  }

  public getName() {
    return this.name;
  }

  public getTitle() {
    return this.config.title;
  }

  public getDisplay() {
    return this.config.display || 'tab';
  }

  public getConfig() {
    return '';
  }

  public isGroup() {
    return true;
  }

  public isTab() {
    return this.getDisplay() === 'tab';
  }

  public isIgnore() {
    return true;
  }

  public isHidden() {
    if (this.getDisplay() === 'none' || this.isDisabled() || this.getVisibleItems().length < 1) {
      return true;
    }

    let hidden = this.config.hidden;
    if (typeof hidden === 'function') {
      hidden = hidden.call(this);
    }
    return hidden === true;
  }

  public isDisabled() {
    let disabled = this.config.disabled;
    if (typeof disabled === 'function') {
      disabled = disabled.call(this);
    }
    return disabled === true;
  }

  public getItems(filter: (item: any) => boolean) {
    if (filter) {
      return this.items.filter(filter);
    }
    return this.items;
  }

  public getVisibleItems() {
    return this.getItems((item) => !item.isHidden());
  }

  public isExpand() {
    return this.expanded;
  }

  public getVariableValue() {
    return '';
  }

  public isUseVariable() {
    return false;
  }

  public isSupportVariable() {
    return false;
  }

  public setUseVariable() {
    this.useVariable = false;
  }

  public setVariableValue() {
    this.variableValue = '';
  }

  public onUseVariableChange() {
    this.useVariable = false;
  }

  public toggleExpand() {
    if (this.expanded) {
      this.expanded = false;
    } else {
      this.expanded = true;
    }
    this.emitter.emit('expandchange', this.expanded);
  }

  public onExpandChange(func: () => any) {
    this.emitter.on('expandchange', func);
    return () => {
      this.emitter.removeListener('expandchange', func);
    };
  }
}
