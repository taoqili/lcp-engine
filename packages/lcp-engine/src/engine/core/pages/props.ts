import * as EventEmitter from 'events';
import { Map as IMMap } from 'immutable';

import { DISPLAY_TYPE, IPropConfig } from '../bundle/prototype';
import Stages, { Stage } from '../panes/stages';
import CompositeProp from './compositeProp';
import { Node } from './node';
import Prop from './prop';
import Group from './propsGroup';
import SettingStage from './settingStage';

// 1: chain -1: start 0: discard
// design for performance to avoid refresh UI elements duration iterations
export const CHAIN_START = -1;
export const CHAIN_REACH = 1;
export const CHAIN_HAS_REACH = 0;

export function releaseItems(items: IPropConfig[], target: any, dataGetter: any, inGroup?: boolean) {
  return (items || []).map((config) => {
    let item;
    if (config.type === 'composite') {
      item = new CompositeProp(target, config, dataGetter(config.name));
    } else if (config.type === 'group') {
      item = new Group(target, config, dataGetter);
    } else {
      item = new Prop(target, config, dataGetter(config.name));
    }
    if (inGroup) {
      item.inGroup = true;
    }
    return target.registerItem(item);
  });
}

export class Props {

  public static Root: any;
  public static Prop: Prop;

  public emitter: EventEmitter;
  public node: Node;
  public stage: Stage;

  public inited: boolean;

  public hotData: IMMap<string, any>;
  public hotProps: IMMap<string, any>;
  public extraProps: IMMap<string, any>;

  public items: Prop[];
  public itemsMap: { [key: string]: Prop };

  public disableChain: boolean;
  public setChain: Prop[];
  public syncChain: Prop[];

  constructor(node: Node, configure: any, data: any) {
    this.emitter = new EventEmitter();
    this.node = node;

    const isHot = IMMap.isMap(data);

    let props: any;

    if (!isHot) {
      props = data || {};
    } else {
      this.hotData = data;
      this.hotProps = data.get('hotProps');
      if (!IMMap.isMap(this.hotProps)) {
        this.hotProps = IMMap({});
      }
      this.extraProps = data.get('extraProps');
    }

    const dataGetter = isHot
      ? (key: string) => this.hotProps.get(key)
      : (key: string) => props[key];

    this.items = [];
    this.itemsMap = {};

    releaseItems(configure, this, dataGetter);

    this.stage = new SettingStage(this);

    if (!isHot) {
      let extraProps: { [key: string]: any } = {};
      Object.keys(props).forEach((prop) => {
        if (!(prop in this.itemsMap)) {
          if (!extraProps) {
            extraProps = {};
          }
          extraProps[prop] = props[prop];
        }
      });
      if (extraProps) {
        this.extraProps = IMMap(extraProps);
      }
    }
  }

  public registerItem(item: Prop) {
    this.items.push(item);
    this.itemsMap[item.getName()] = item;
    return item;
  }

  public stagePush(name: string) {
    let stage = Stages.getStage(name);
    if (!stage) {
      const prop = this.getProp(name);
      if (!prop || prop.isHidden()) { return; }
      stage = new SettingStage(prop);
    }

    stage.setPrevious(this.stage);
    stage.setReferLeft(this.stage);

    this.stage = stage;
    this.emitter.emit('stagechange');
  }

  public stageBack() {
    const stage = this.stage.getPrevious();
    if (!stage) { return; }
    stage.setReferRight(this.stage);
    this.stage = stage;
    this.emitter.emit('stagechange');
  }

  public getCurrentStage() {
    return this.stage;
  }

  public isProps() {
    return true;
  }

  public chainReach(prop: Prop) {
    if (this.disableChain) {
      return CHAIN_HAS_REACH;
    }
    if (!this.setChain) {
      this.setChain = [prop];
      return CHAIN_START;
    } else if (this.setChain.indexOf(prop) > -1) {
      return CHAIN_HAS_REACH;
    }

    this.setChain.push(prop);
    return CHAIN_REACH;
  }

  public hasReach(prop: Prop) {
    return this.setChain.indexOf(prop) > -1;
  }

  public endChain() {
    this.setChain = null;
  }

  public syncPass(prop: Prop) {
    if (this.disableChain) { return; }
    const isEnd = !this.syncChain;
    if (!this.syncChain) {
      this.syncChain = [];
    } else if (this.syncChain.indexOf(prop) > -1) {
      return;
    }
    this.syncChain.push(prop);
    this.items.forEach((item) => item !== prop && item instanceof Prop && item.sync());

    if (isEnd) {
      this.syncChain = null;
      this.emitter.emit('propschange');
    }
  }

  public init() {
    if (this.inited) { return; }

    const hotPropsMap: {[key: string]: any} = {};
    this.getRealItems().forEach((prop: Prop) => {
      prop.init();
      hotPropsMap[prop.getName()] = prop.getHotData();
    });

    if (!this.hotData) {
      this.hotProps = IMMap(hotPropsMap);
      this.hotData = IMMap({
        extrasProps: this.extraProps || null,
        hotProps: this.hotProps,
      });
    }

    this.inited = true;
  }

  public isInited() {
    return this.inited;
  }

  public modify(name?: boolean | string) {
    const hotPropsMap: any = {};
    this.getRealItems().forEach((prop) => {
      hotPropsMap[prop.getName()] = prop.getHotData();
    });
    this.hotProps = this.hotProps.merge(hotPropsMap);

    const hotData = this.hotData.merge({
      extrasProps: this.extraProps || null,
      hotProps: this.hotProps,
    });

    if (hotData.equals(this.hotData)) {
      return;
    }
    this.hotData = hotData;
    this.node.addRecord(`Modify prop ${name ? `:${name}` : 's'}`);
  }

  public getNode() {
    return this.node;
  }

  public getProp(name: string, createNew?: boolean) {
    const ns = name.split('.')[0];
    let prop = this.itemsMap[ns];

    if (!prop && createNew) {
      prop = new Prop(this, { name, display: DISPLAY_TYPE.NONE });
      this.registerItem(prop);
      prop.init();
      return prop;
    }

    if (ns === name) {
      return prop;
    }

    if (prop instanceof CompositeProp) {
      return prop.getProp(name);
    }

    return prop;
  }

  public getPropValue(name: string) {
    const prop = this.getProp(name);
    if (prop) {
      return prop.getValue();
    }
    return null;
  }

  public setPropValue(name: string, value: any) {
    const prop = this.getProp(name);
    if (prop) {
      prop.setValue(value);
    }
  }

  public getItems(filter: (item: Prop) => boolean) {
    if (filter) {
      return this.items.filter(filter);
    }
    return this.items;
  }

  public getVisibleItems() {
    this.getItems((item) => !item.isHidden());
  }

  public getRealItems() {
    return this.items.filter((item) => item instanceof Prop);
  }

  public getHotData() {
    return this.hotData;
  }

  public setHotData(hotData: any, options?: {
    disableMutator: boolean;
  }) {
    if (!IMMap.isMap(hotData)) {
      return;
    }
    this.hotData = hotData;
    this.extraProps = hotData.get('extraProps');
    const props = hotData.get('hotProps');
    this.hotProps = IMMap.isMap(props) ? props : IMMap({});
    this.disableChain = true;
    this.getRealItems().forEach((prop) => {
      prop.setHotData(this.hotProps.get(prop.getName()), options);
    });
    this.emitter.emit('propschange');
    this.disableChain = false;
  }

  /**
   * 导出属性数据
   *
   * @returns {Object}
   */
  public toData() {
    const props = IMMap.isMap(this.extraProps)
      ? this.extraProps.toJS()
      : (this.extraProps || {});

    this.getRealItems().forEach((prop) => {
      if (!prop.isIgnore()) {
        props[prop.getName()] = prop.toData();
      }
    });

    return props;
  }

  /**
   * Export props value
   *
   * @returns {Object}
   */
  public toProps() {
    const props: any = {};
    this.getRealItems().forEach((prop: Prop) => {
      props[prop.getName()] = prop.getValue(false, { disableAccessor: true });
    });
    return props;
  }

  public destroy() {
    this.getRealItems().forEach((prop) => prop.destroy());
  }

  public onPropsChange(func: () => any) {
    this.emitter.on('propschange', func);
    return () => {
      this.emitter.removeListener('propschange', func);
    };
  }

  public onStageChange(func: () => any) {
    this.emitter.on('stagechange', func);
    return () => {
      this.emitter.removeListener('stagechange', func);
    };
  }
}
