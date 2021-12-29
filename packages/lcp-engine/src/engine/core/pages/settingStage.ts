import { EventEmitter } from 'events';
import Stages from '../panes/stages';
import { Node } from './node';
import Group from './propsGroup';
import Tab from './propsTab';

export default class SettingStage extends Stages.Stage {

  public node: Node;
  public tabs: Tab[];
  public statTabs: Tab[];
  public currentTab: Tab;

  public emitter: EventEmitter;

  constructor(target: any) {
    const isRoot = !!target.isProps;
    const node = target.getNode();

    super({
      isRoot,
      title: target.getTitle ? target.getTitle() : '',
      tip: target.getTip ? target.getTip() : '',
      id: isRoot ? node.getId() : target.getId(),
    });

    this.node = node;

    if (target.getItems) {
      this.tabs = target.getItems((item: Tab) => item.isTab()) || [];
      const items = target instanceof Group
        ? target.getItems((item: Tab) => !item.isTab())
        : target.getItems((item: Group) => !item.isTab() && !item.inGroup);
      if (items.length > 0) {
        this.tabs.push(new Tab({
          id: this.id,
          items,
          title: '其它',
        }));
      }
    } else {
      this.tabs = [target];
    }

    this.emitter = new EventEmitter();
  }

  public getNode() {
    return this.node;
  }

  public stat() {
    this.statTabs = this.tabs.filter((tab) => !tab.isHidden());

    if (this.statTabs.length < 1) {
      this.currentTab = null;
    }

    if (this.currentTab && this.statTabs.indexOf(this.currentTab) < 0) {
      this.currentTab = null;
    }

    if (!this.currentTab) {
      this.currentTab = this.statTabs[0];
    }
  }

  public hasTabs() {
    return this.statTabs.length > 1;
  }

  public getTabs() {
    return this.statTabs;
  }

  public getCurrentTab() {
    return this.currentTab;
  }

  public setCurrentTab(tab: Tab) {
    if (this.currentTab !== tab) {
      this.currentTab = tab;
      this.emitter.emit('currenttabchange');
    }
  }

  public onCurrentTabChange(func: (tab: Tab) => any) {
    this.emitter.on('currenttabchange', func);
    return () => {
      this.emitter.removeListener('currenttabchange', func);
    };
  }
}
