import { assign } from 'lodash';

import { Component, ReactElement } from 'react';
import VisualManager from './core/base/visualManager';
import Prototype from './core/bundle/prototype';
import Env from './core/env';
import Prop from './core/pages/prop';

let contextInstance: VisualEngineContext = null;

export type SetterProvider = (prop: Prop, componentPrototype: Prototype) => Component | ReactElement<any>;

export default class VisualEngineContext {
  private managerMap: { [name: string]: VisualManager } = {};
  private moduleMap: { [name: string]: any } = {};
  private pluginsMap: { [name: string]: any } = {};

  constructor() {
    // singleton
    if (!contextInstance) {
      contextInstance = this;
    } else {
      return contextInstance;
    }
  }

  public use(pluginName: string, plugin: any) {
    this.pluginsMap[pluginName || 'unknown'] = plugin;
  }

  public getPlugin(name?: string) {
    if (this.pluginsMap[name]) {
      return this.pluginsMap[name];
    } else if (this.moduleMap[name]) {
      return this.moduleMap[name];
    }
    return this.getManager(name);
  }

  public registerManager(managerMap?: { [name: string]: VisualManager }): this;
  public registerManager(name: string, manager: VisualManager): this;
  public registerManager(name?: any, manager?: VisualManager): this {
    if (name && typeof name === 'object') {
      this.managerMap = assign(this.managerMap, name);
    } else {
      this.managerMap[name] = manager;
    }
    return this;
  }

  public registerModule(moduleMap: { [name: string]: any }): this;
  public registerModule(name: string, module: any): this;
  public registerModule(name?: any, module?: any): this {
    if (typeof name === 'object') {
      this.moduleMap = Object.assign({}, this.moduleMap, name);
    } else {
      this.moduleMap[name] = module;
    }
    return this;
  }

  public getManager(name: string): VisualManager {
    return this.managerMap[name];
  }

  public getModule(name: string): any {
    return this.moduleMap[name];
  }

  public getDesignerLocale(): string {
    return Env.getLocale();
  }

  /**
   * Builtin APIs
   */

  /**
   * support dynamic setter replacement
   */
  public registerDynamicSetterProvider(setterProvider: SetterProvider) {
    if (!setterProvider) {
      console.error('ERROR: ', 'please set provider function.');
      return;
    }
    this.use('ve.plugin.setterProvider', setterProvider);
  }

  /**
   * support add treePane on the setting pane
   * @param treePane see @ali/ve-tree-pane
   * @param treeCore see @ali/ve-tree-pane
   */
  public registerTreePane(TreePane: Component, TreeCore: Component) {
    if (TreePane && TreeCore) {
      this.registerModule('TreePane', TreePane);
      this.registerModule('TreeCore', TreeCore);
    }
  }

  // TODO: export global event map
  public getGlobalEventMap() {

  }
}
