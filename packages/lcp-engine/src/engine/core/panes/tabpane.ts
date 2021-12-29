import * as EventEmitter from 'events';
import Pane, { IPaneConfig } from './pane';
import TabCore, { ITabPaneConfig } from './tabCore';
import flags from '../flags';

class TabPane {
  public tabs: TabCore[];
  public emitter: EventEmitter;
  public activedTab: TabCore;
  public visible: boolean = false;

  constructor() {
    this.tabs = [];
    this.emitter = new EventEmitter();
    this.activedTab = null;
  }

  /**
   *
   * @param tabConfig
   * @param  index
   */
  public addTab(tabConfig: ITabPaneConfig, index?: number) {
    const tab = new TabCore(tabConfig);
    if (index == null) {
      index = this.tabs.length;
    }
    this.tabs.splice(index, 0, tab);
    if (!this.activedTab) {
      this.activeTab(tab);
    }
    this.emitter.emit('tabschange', this.tabs);
  }

  /**
   * 移除一个标签项
   * @param tab
   */
  public removeTab(tab: TabPane | string): void;
  public removeTab(tab: any): void {
    if (typeof tab === 'string') {
      tab = this.tabs.find((item) => item.getName() === tab);
    }
    const i = this.tabs.indexOf(tab);
    if (i > -1) {
      tab.destroy();
      this.tabs.splice(i, 1);
      if (this.activedTab === tab) {
        this.activeTab(this.tabs[0]);
      }
      this.emitter.emit('tabschange', this.tabs);
    }
  }

  /**
   * 获得所有标签项
   *
   * @returns {Tabs[]}
   */
  public getTabs() {
    return this.tabs;
  }

  /**
   * 获得当前激活的标签项
   *
   * @returns {null|TabCore}
   */
  public getActivedTab() {
    return this.activedTab;
  }

  /**
   *
   * @param {string|TabCore} tab
   */
  public activeTab(tab: TabCore | string): void;
  public activeTab(tab: any): void {
    if (typeof tab === 'string') {
      tab = this.tabs.find((item) => item.getName() === tab);
    }

    if (this.activedTab === tab) {
      return;
    }

    if (this.activedTab) {
      this.activedTab.setActive(false);
    }

    if (tab) {
      tab.setActive(true);
    }

    this.activedTab = tab;
  }

  public onTabsChange(func: (tabs: TabCore[]) => any) {
    this.emitter.on('tabschange', func);
    return () => {
      this.emitter.removeListener('tabschange', func);
    };
  }

  public setFloat(flag: boolean) {
    if (flag) {
      flags.add('tabpane-float');
      this.visible = false;
    } else {
      flags.remove('tabpane-float');
    }
    this.emitter.emit('tabschange', this.tabs);
  }

  public toggleNavigator(flag: boolean) {
    if (flag) {
      flags.remove('hide-navigator');
      this.visible = false;
    } else {
      flags.add('hide-navigator');
    }
  }

  public show() {
    this.visible = true;
    this.emitter.emit('tabschange', this.tabs);
  }

  public hide() {
    this.visible = false;
    this.emitter.emit('tabschange', this.tabs);
  }
}

export default TabPane;
