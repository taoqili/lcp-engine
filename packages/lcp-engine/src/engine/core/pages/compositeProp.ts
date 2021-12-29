import * as EventEmitter from 'events';
import { fromJS, Map as IMMap } from 'immutable';

import Prop from './prop';
import { CHAIN_HAS_REACH, CHAIN_START, releaseItems } from './props';

export default class CompositeProp extends Prop {

  public hotData: IMMap<string, any>;
  public level: number;
  public itemsMap: { [key: string]: any };
  public items: any[];

  public beforeInit() {
    const isHot = IMMap.isMap(this.initialData);
    let dataGetter;
    if (isHot) {
      this.hotData = this.initialData;
      let hotMap = this.hotData;
      if (this.hotData.get('type') === 'variable') {
        hotMap = this.hotData.get('maps') || new Map();
        this.variableValue = this.hotData.get('variable');
        this.useVariable = this.isSupportVariable();
      }

      dataGetter = (key: string) => hotMap.get(key);
    } else {
      let data = this.initialData || {};
      if (data.type === 'variable') {
        this.useVariable = this.isSupportVariable();
        this.variableValue = data.variable;
        data = data.maps || {};
      }

      dataGetter = (key: string) => data[key];
    }

    let defaultValue = null;
    if (this.config.defaultValue !== undefined) {
      defaultValue = this.config.defaultValue;
    } else if (typeof this.config.initialValue !== 'function') {
      defaultValue = this.config.initialValue;
    }
    this.defaultValue = defaultValue;

    this.level = (this.parent && this.parent.level || 0) + 1; // eslint-disable-line

    this.itemsMap = {};
    this.items = [];

    releaseItems(this.config.items, this, dataGetter);
  }

  public registerItem(item: any) {
    this.items.push(item);
    this.itemsMap[item.getName()] = item;
    return item;
  }

  public init(defaultValue: any) {
    if (this.inited) { return; }

    defaultValue = this.defaultValue || defaultValue || {};

    const hotMap: any = {};
    this.getRealItems().forEach((prop) => {
      const key = prop.getKey();
      prop.init(defaultValue[key]);
      hotMap[key] = prop.getHotData();
    });

    if (!this.hotData) {
      this.hotData = fromJS(this.getMixValue(hotMap));
    }

    this.inited = true;
  }

  public getMixValue(value: any) {
    if (value == null) {
      value = this.getValue();
    }
    if (this.isUseVariable()) {
      return {
        maps: value,
        type: 'variable',
        variable: this.getVariableValue(),
      };
    }
    return value;
  }

  /**
   * 获得属性值
   *
   * @returns {*}
   */
  public getValue() {
    let props: any = {};
    this.getRealItems().forEach((prop) => {
      props[prop.getKey()] = prop.getValue();
    });
    const accessor = this.config.accessor;
    if (accessor) {
      props = accessor.call(this, props);
    }
    return props;
  }

  public toData() {
    const props: any = {};
    this.getRealItems().forEach((prop) => {
      if (!prop.isIgnore()) {
        props[prop.getKey()] = prop.toData();
      }
    });
    return this.getMixValue(props);
  }

  public getHotValue() {
    const props: any = {};
    this.getRealItems().forEach((prop) => {
      props[prop.getKey()] = prop.getHotValue();
    });
    return props;
  }

  /**
   * 设置属性值
   *
   * @param {*} value
   */
  public setValue(value: any, isHotValue?: boolean) {
    const state = this.props.chainReach(this);
    if (state === CHAIN_HAS_REACH) {
      return;
    }

    this.loopLock = true;
    const props = value || {};
    if (isHotValue) {
      this.getRealItems().forEach((prop) => {
        prop.setHotValue(props[prop.getKey()]);
      });
    } else {
      this.getRealItems().forEach((prop) => {
        prop.setValue(props[prop.getKey()]);
      });
    }
    this.loopLock = null;

    const mutator = this.config.mutator;

    if (this.modify()) {
      if (mutator) {
        mutator.call(this, this.getValue(), this.getHotValue());
      }
      this.valueChange();
      this.props.syncPass(this);
    }

    if (state === CHAIN_START) {
      this.props.endChain();
    }
  }

  public modify(name?: boolean | string): boolean {
    if (this.loopLock) { return false; }

    const hotMap: any = {};
    this.getRealItems().forEach((prop) => {
      hotMap[prop.getKey()] = prop.getHotData();
    });

    const hotData = fromJS(this.getMixValue(hotMap));

    if (hotData.equals(this.hotData)) {
      return false;
    }

    this.hotData = hotData;

    (this.parent || this.props).modify(name || this.getName());

    return true;
  }

  public setHotData(hotData: any, options?: { disableMutator?: boolean }) {
    if (!IMMap.isMap(hotData)) {
      return;
    }
    this.hotData = hotData;

    this.loopLock = true;

    let hotMap = hotData;
    if (hotData.get('type') === 'variable') {
      hotMap = hotData.get('maps') || new Map();
      this.useVariable = this.isSupportVariable();
      this.variableValue = hotData.get('variable');
    } else {
      this.useVariable = false;
    }

    this.getRealItems().forEach((prop) => {
      prop.setHotData(hotMap.get(prop.getKey()));
    });

    this.loopLock = null;

    const mutator = this.config.mutator;
    if (mutator && !options.disableMutator) {
      mutator.call(this, this.getValue(), this.getHotValue());
    }

    this.valueChange();
  }

  public getProp(name?: string): Prop {
    const ns = name.split('.').slice(0, this.level + 1).join('.');
    const prop = this.itemsMap[ns];
    if (ns === name) {
      return prop;
    }
    if (prop instanceof CompositeProp) {
      return prop.getProp(name);
    }
    return prop;
  }

  public isHidden() {
    return super.isHidden() || this.getVisibleItems().length < 1;
  }

  public isGroup() {
    return true;
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

  public getRealItems() {
    return this.getItems((item) => item instanceof Prop);
  }
}
