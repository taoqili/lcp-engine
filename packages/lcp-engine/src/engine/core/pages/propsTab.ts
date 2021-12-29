const { uniqueId } = require('@ali/ve-utils');

import { IVariableSettable } from './prop';

export default class Tab implements IVariableSettable {
  public config: any;
  public id: string;
  public items: any[];
  public useVariable: boolean;
  public variableValue: string;

  constructor(config: any) {
    this.config = config || {};
    this.id = uniqueId(this.config.id, 'tab', 'engine-tab');
    this.items = this.config.items || [];
  }

  public isTab() {
    return true;
  }

  public isHidden() {
    return this.getVisibleItems().length < 1;
  }

  public getTip() {
    return '';
  }

  public getId() {
    return this.id;
  }

  public getTitle() {
    return this.config.title;
  }

  public getItems(filter: (item: any) => boolean) {
    if (filter) {
      return this.items.filter(filter);
    }
    return this.items;
  }

  public getConfig() {
    return '';
  }

  public getVisibleItems() {
    return this.getItems((item) => !item.isHidden());
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
}
