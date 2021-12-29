import lg from '@ali/vu-logger';
import EventEmitter = require('events');
import { find, set } from 'lodash';
import { ComponentClass, ReactElement, ComponentType } from 'react';

import { isFunction } from 'util';
import Bundle, { registerSetter, getSetter } from './bundle/bundle';
import Prototype, { setPackages } from './bundle/prototype';
import Bus from './bus';
import Env from './env';

export declare interface IComponentInfo {
  image?: string;
  description?: string;
  componentDetail?: string;
  newVersion?: string;
}

export declare interface IComponentLoader {
  load: (packageName: string, packageVersion: string, filePath?: string) => Promise<IComponentBundle>;
}

export declare interface IComponentPrototypeMocker {
  mockPrototype: (bundle: ComponentClass) => Prototype;
}

export declare interface IComponentBundle {
  // @ali/vc-xxx
  name: string;
  // alias to property name
  componentName?: string;
  category?: string;
  module: ComponentClass;
}

interface IComponentBundleLoadingConfig {
  isDIYComponent?: boolean;
  // need to emit 'trunk_change' event
  isSilence?: boolean;
  isNpmComponent?: boolean;
}

interface IComponentBundleConfigListItem {
  name: string;
  version: string;
  path?: string;
  // ac component in LeGao
  // FIXME: remove this logic out of Trunk in the future
  isDIYComponent?: boolean;
  // install comp directly from npm
  isNpmComponent?: boolean;
}

interface IBeforeLoad extends IComponentBundleLoadingConfig {
  name: string;
  version: string;
  path: string;
}

type beforeLoadFn = (loadingConfig: IBeforeLoad) => IBeforeLoad;
type afterLoadFn = (bundle: IComponentBundle, loadingConfig: IBeforeLoad) => IComponentBundle;

let singletonTrunk: Trunk = null;

class Trunk {
  private bus: Bus;
  private trunk: any[];
  private list: any[];
  private emitter: EventEmitter;
  private componentBundleLoader: IComponentLoader;
  private componentPrototypeMocker: IComponentPrototypeMocker;

  private beforeLoad: beforeLoadFn;
  private afterLoad: afterLoadFn;

  constructor() {
    this.trunk = [];
    this.bus = new Bus();
    this.emitter = new EventEmitter();
    this.componentBundleLoader = null;

    if (!singletonTrunk) {
      singletonTrunk = this;
    }

    return singletonTrunk;
  }

  public isReady() {
    return this.getList().length > 0;
  }

  public addBundle(bundle: Bundle, bundleOptions: {
    before?: (bundle: Bundle) => Promise<Bundle>;
    after?: (bundle: Bundle) => any;
  } = {}) {
    // filter exsits
    bundle.filter((item) => {
      const componentName = item.getComponentName();
      if (componentName && this.getPrototype(componentName)) {
        return false;
      }
      return true;
    });
    if (bundleOptions.before) {
      bundleOptions.before.call(this, bundle).then((processedBundle: Bundle) => {
        this.trunk.push(processedBundle);
        this.emitter.emit('trunkchange');
      });
    } else {
      this.trunk.push(bundle);
      this.emitter.emit('trunkchange');
    }
    if (bundleOptions.after) {
      bundleOptions.after.call(this, bundle);
    }
  }

  /**
   * 注册组件信息加载器
   * @param loader
   */
  public registerComponentBundleLoader(loader: IComponentLoader) {
    this.componentBundleLoader = loader;
  }

  public registerComponentPrototypeMocker(mocker: IComponentPrototypeMocker) {
    this.componentPrototypeMocker = mocker;
  }

  /**
   * ["componentName", {componentName, title, icon, category, defaultProps, ..}]
   *
   * @param {Array} list
   */
  public setList(list: any) {
    this.list = this.parseList(list);
    this.emitter.emit('trunkchange');
  }

  public addList(list: any) {
    this.list = (this.getList()).concat(this.parseList(list));
    this.emitter.emit('trunkchange');
  }

  public getBundle(nameSpace?: string): Bundle {
    if (!nameSpace) {
      return this.trunk[0];
    }
    return find(this.trunk, (b: any) => b.getNamespace() === nameSpace);
  }

  public getList(): any[] {
    return this.list || this.trunk.reduceRight((prev, cur) => prev.concat(cur.getList()), []);
  }

  public getRecents(limit: number) {
    return this.getList().filter((prototype) => prototype.getCategory()).slice(0, limit);
  }

  /**
   * 列出所有组件列表
   *
   * @returns {Array}
   */
  public listByCategory() {
    const categories: any[] = [];
    const categoryMap: any = {};
    const categoryItems: any[] = [];
    const defaultCategory = {
      items: categoryItems,
      name: '*',
    };
    categories.push(defaultCategory);
    categoryMap['*'] = defaultCategory;
    this.getList().forEach((prototype) => {
      const cat = prototype.getCategory();
      if (!cat) {
        return;
      }
      if (!categoryMap.hasOwnProperty(cat)) {
        const categoryMapItems: any[] = [];
        categoryMap[cat] = {
          items: categoryMapItems,
          name: cat,
        };
        categories.push(categoryMap[cat]);
      }
      categoryMap[cat].items.push(prototype);
    });
    return categories;
  }

  public getAllCategories(): string[] {
    return this.listByCategory().map((group) => {
      if (group.name === '*') {
        return '未分类';
      }
      return group.name;
    });
  }

  /**
   * 获取仓库
   *
   * @returns {Array}
   */
  public getTrunk() {
    return this.trunk;
  }

  /**
   * 根据 componentName 查找对应的 prototype
   *
   * @param {string} componentName
   * @returns {Prototype}
   */
  public getPrototype(componentName: string) {
    if (!componentName) {
      lg.error('ERROR: no component name found while get Prototype');
      return null;
    }
    const name = componentName.split('.');
    const namespace = name.length > 1 ? name[0] : '';
    let i = this.trunk.length;
    let bundle;
    let ns;
    let prototype;
    while (i-- > 0) {
      bundle = this.trunk[i];
      ns = bundle.getNamespace();
      if (ns === '' || namespace === ns) {
        prototype = bundle.get(componentName);
        if (prototype) {
          return prototype;
        }
      }
    }
    return null;
  }

  public getPrototypeById(id: string) {
    let i = this.trunk.length;
    let bundle;
    let prototype;
    while (i-- > 0) {
      bundle = this.trunk[i];
      prototype = bundle.getById(id);
      if (prototype) {
        return prototype;
      }
    }
    return null;
  }

  public getPrototypeView(componentName: string) {
    const prototype = this.getPrototype(componentName);
    return prototype ? prototype.getView() : null;
  }

  public loadComponentBundleList(componentBundleList: IComponentBundleConfigListItem[]) {
    Promise.all(componentBundleList.map((componentBundle) => {
      const { name, version, path, ...bundleContextInfo } = componentBundle;
      return this.loadComponentBundle(name, version, path, {
        ...bundleContextInfo,
        isDIYComponent: componentBundle.isDIYComponent,
        isSilence: true,
      });
    })).then((results) => {
      results.forEach((r: any) => this.getBundle().addComponentBundle(r));
      this.emitter.emit('trunkchange');
    });
  }

  public loadComponentBundle(
    name: string,
    version: string,
    path?: string,
    options?: IComponentBundleLoadingConfig) {
    const bundleList: IComponentBundle[] = [];
    return new Promise((resolve: any, reject: any) => {
      if (options && options.isDIYComponent) {
        let result: IBeforeLoad = { name, version, path, ...options };
        if (isFunction(this.beforeLoad)) {
          result = this.beforeLoad(result);
        }
        return this.componentBundleLoader.load(result.name, result.version, result.path)
          .then((b: IComponentBundle) => {
            if (isFunction(this.afterLoad)) {
              this.afterLoad(b, { name, path, version, ...options });
            }
            if (!options.isSilence) {
              this.getBundle().addComponentBundle([b]);
              this.emitter.emit('trunkchange');
            }
            resolve([b]);
          })
          .catch((e: Error) => {
            this.bus.emit('ve.error.networkError', e);
            reject(e);
          });
      } else {
        this.componentBundleLoader.load(name, version, 'build/prototype.js')
          .then((b: IComponentBundle) => {
            bundleList.push(b);
            return this.componentBundleLoader.load(name, version, 'build/prototypeView.js');
          })
          .then((b: IComponentBundle) => {
            bundleList.push(b);
            if (!options.isSilence) {
              this.getBundle().addComponentBundle(bundleList);
              this.emitter.emit('trunkchange');
            }
            resolve(bundleList);
          })
          .catch((e: Error) => {
            this.bus.emit('ve.error.networkError', e);
            reject(e);
          });
      }
    });
  }

  public removeComponentBundle(name: string) {
    this.getBundle().removeComponentBundle(name);
    this.emitter.emit('trunkchange');
  }

  public mockComponentPrototype(bundle: ComponentClass) {
    if (!this.componentPrototypeMocker) {
      lg.error('ERROR: no component prototypeMocker is set');
    }
    return this.componentPrototypeMocker
      && this.componentPrototypeMocker.mockPrototype(bundle);
  }

  public beforeLoadBundle(fn: beforeLoadFn) {
    this.beforeLoad = fn;
  }

  public afterLoadBundle(fn: afterLoadFn) {
    this.afterLoad = fn;
  }

  public onTrunkChange(func: () => any) {
    this.emitter.on('trunkchange', func);
    return () => {
      this.emitter.removeListener('trunkchange', func);
    };
  }

  private parseList(list: any) {
    if (this.trunk.length < 1) {
      throw new Error('Must addBundle to Trunk before call parseList.');
    }
    return list.map((item: any) => {
      if (!item) {
        return null;
      }
      let prototype = null;
      if (typeof item === 'string') {
        prototype = this.getPrototype(item);
      } else if (item.componentName) {
        prototype = this.getPrototype(item.componentName);
        if (prototype) {
          prototype = prototype.clone(item);
        }
      }
      return prototype;
    }).filter((item: any) => item != null);
  }

  public registerSetter(type: string, setter: ReactElement | ComponentType<any>) {
    registerSetter(type, setter);
  }

  public getSetter(type: string): ReactElement | ComponentType<any> | null {
    return getSetter(type);
  }

  public setPackages(packages: Array<{ package: string; library: object | string }>) {
    setPackages(packages);
  }
}

export default Trunk;
