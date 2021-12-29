import * as EventEmitter from 'events';
import VisualPage, { IVisualPage } from '../../../visualpage';
import { VE_EVENTS } from '../base/const';
import Bus from '../bus';
import { Insertion } from '../location';
import Scroller from '../scroller';
import FloatingNodesManager from './floatingNodesManager';
import History from './history';
import ModalNodesManager from './modalNodesManager';
import { Node } from './node';
import { IHotDataMap } from './prop';
import Root from './root';

import { uniqueId } from '@ali/ve-utils';
import { Map as ImmutableMap } from 'immutable';

import Context from '../../context';

export class Page {
  public id: string;
  public document: Element;
  public readyState: boolean;
  public visible: boolean;
  public addons: any[];
  public emitter: EventEmitter;
  /**
   * global Pub/Sub object in page
   */
  public bus: Bus;

  public root: Root;
  public params: { [key: string]: any } | any;
  public addonsData: any;
  public history: History;
  public scroller: Scroller;
  public willUnmount: () => any;
  public scrolling: number;
  public tryScrollAgain: number;
  public sensitive: boolean;
  public refreshCount: number;

  public modalNodesManager: ModalNodesManager;
  public floatingNodesManager: FloatingNodesManager;

  protected ctx: Context;
  protected VisualPage: IVisualPage;

  private rootNodeVisitorMap: { [visitorName: string]: any } = {};

  constructor(data: IPageData) {
    const { id, componentsTree, props, children, params, ...addonsData } = data;

    this.emitter = new EventEmitter();
    this.bus = new Bus();
    const rootData = componentsTree ? componentsTree[0] : {
      children,
      props,
    };
    this.root = new Root(this, rootData);

    this.params = new (ImmutableMap as any)(params || {});

    this.addonsData = addonsData || {};
    this.history = new History((hotData: IHotDataMap) => {
      const nativeData = {
        layout: this.root.getHotData(),
        params: this.params,
      };
      return hotData ? hotData.merge(nativeData) : new (ImmutableMap as any)(nativeData);
    }, (hotData: IHotDataMap) => {
      this.setHotParams(hotData.get('params'));
      this.root.setHotData(hotData.get('layout'), { disableMutator: true });
    });

    this.id = uniqueId(id, 'page', 'engine-page');
    this.readyState = false;
    this.visible = false;
    this.addons = [];
    // TODO: use visitor pattern
    this.modalNodesManager = new ModalNodesManager(this);
    // TODO: use visitor pattern
    this.floatingNodesManager = new FloatingNodesManager(this);

    this.ctx = new Context();
  }

  public getParam(name: string) {
    return this.params.get(name);
  }

  public setHotParams(params: any) {
    if (params.equals(this.params)) {
      return false;
    }
    this.params = params;
    this.emitter.emit('paramschange', this.params);
    return true;
  }

  public setParam(name: string, value: any) {
    const params = this.params.set(name, value);
    this.setHotParams(params);
    this.addHistory('Change page params');
  }

  public registerAddon(name: string, exportData: any) {
    if (['id', 'params', 'layout'].indexOf(name) > -1) {
      throw new Error('addon name cannot be id, params, layout');
    }
    const i = this.addons.findIndex((item) => item.name === name);
    if (i > -1) {
      this.addons.splice(i, 1);
    }
    this.addons.push({
      exportData,
      name,
    });
  }

  public exportAddonData() {
    const addons = {
      ...this.addonsData,
    };
    this.addons.forEach((addon) => {
      const data = addon.exportData();
      if (data === null) {
        delete addons[addon.name];
      } else {
        addons[addon.name] = data;
      }
    });
    return addons;
  }

  public getAddonData(name: string) {
    const addon = this.addons.find((item) => item.name === name);
    if (addon) {
      return addon.exportData();
    }
    return this.addonsData[name];
  }

  public acceptRootNodeVisitor(
    visitorName: string = 'default',
    visitorFn: (node: Root) => any ) {
      let visitorResult = {};
      if (!visitorName) {
        /* tslint:disable no-console */
        console.warn('Invalid or empty RootNodeVisitor name.');
      }
      try {
        visitorResult = visitorFn.call(this, this.root);
        this.rootNodeVisitorMap[visitorName] = visitorResult;
      } catch (e) {
        console.error('RootNodeVisitor is not valid.');
      }
      return visitorResult;
  }

  public getRootNodeVisitor(name: string) {
    return this.rootNodeVisitorMap[name];
  }

  /**
   * 导出页面数据
   */
  public toData() {
    return {
      id: this.id,
      componentsTree: [this.root.toData()],
      params: this.params.toJS(),
      ...this.exportAddonData(),
    };

    // return {
    //   id: this.id,
    //   layout: this.root.toData(),
    //   params: this.params.toJS(),
    //   ...this.exportAddonData(),
    // };
  }

  public addHistory(title: string) {
    this.history.log(title);
  }

  public getHotData() {
    return this.history.getHotData();
  }

  /**
   * 获得运行时页面唯一ID
   *
   * @returns {string}
   */
  public getId() {
    return this.id;
  }

  /**
   * 设置页面可见性
   *
   * @internal
   * @param {boolean} flag
   */
  public setVisible(flag: boolean) {
    if (flag && !this.visible) {
      this.visible = true;
      this.emitter.emit('visiblechange', this.visible);
    } else if (!flag && this.visible) {
      this.visible = false;
      this.emitter.emit('visiblechange', this.visible);
    }
  }

  /**
   * 获得页面历史操作记录
   *
   * @returns {History}
   */
  public getHistory() {
    return this.history;
  }

  /**
   * 是否可见
   *
   * @returns {boolean}
   */
  public isVisible() {
    return this.visible;
  }

  /**
   * 是否已准备好
   *
   * @returns {boolean}
   */
  public isReady() {
    return this.readyState;
  }

  /**
   * 获得页面根节点
   *
   * @returns {*}
   */
  public getRoot() {
    return this.root;
  }

  public getDocument() {
    return this.document;
  }

  public createNode(data: any) {
    return new Node(this, data);
  }

  public mount(doc: Element) {
    this.scroller = new Scroller(this, doc);

    const render = () => {
      this.document = doc;

      // render data to view
      this.willUnmount = this.getVisualPage().render(this, () => {
        this.readyState = true;
        this.emitter.emit('ready');
        this.bus.emit(VE_EVENTS.VE_PAGE_PAGE_READY, this);
      });
    };
    if (this.isVisible()) {
      render();
    } else {
      const detach = this.onVisibleChange((visible: boolean) => {
        if (visible) {
          render();
          detach();
        }
      });
    }
  }

  public unmount() {
    if (this.willUnmount) {
      this.willUnmount();
      this.willUnmount = null;
    }
    this.readyState = false;
  }

  /**
   * 根据点获得元素
   *
   * @internal
   * @param {Point} e
   * @returns {DOMElement|null}
   */
  public getElementFromPoint(e: any) {
    const node = e.target;
    if (!node || node.nodeType === document.DOCUMENT_NODE) {
      return document.body;
    } else if (node.nodeType !== document.ELEMENT_NODE) {
      return node.parentNode;
    }
    return node;
  }

  public getNodeFromPoint(e: any) {
    const elem = this.getElementFromPoint(e);
    return this.root.findNode(elem);
  }

  /**
   * 获得边界
   *
   * @returns {ClientRect}
   */
  public getBounds() {
    return this.document.getBoundingClientRect();
  }

  public scroll() {
    clearTimeout(this.scrolling);
    this.scrolling = window.setTimeout(() => {
      this.scrolling = null;
    }, 50);
    this.emitter.emit('scroll', this.getScrollTop());
  }

  public inScrolling() {
    return this.scrolling;
  }

  /**
   * 滚动至节点
   *
   * @param node
   * @param {Insertion} insertion
   */
  public scrollIntoNode(node: any, insertion?: Insertion) {
    this.tryScrollAgain = null;
    if (this.sensitive) {
      return;
    }

    const bounds = this.root.getRect();
    const rect = insertion ? insertion.getNearRect() : node.getRect();
    let y;
    let scroll = false;

    if (insertion && rect) {
      y = insertion.isNearAfter() ? rect.bottom : rect.top;

      if (y < bounds.top || y > bounds.bottom) {
        scroll = true;
      }
    } else {
      if (!rect) {
        if (!this.tryScrollAgain) {
          this.tryScrollAgain = requestAnimationFrame(() => this.scrollIntoNode(node));
        }
        return;
      }
      y = rect.top + rect.height / 2;
      scroll = rect.height > bounds.height
        ? (rect.top > bounds.bottom || rect.bottom < bounds.top)
        : (rect.top < bounds.top || rect.bottom > bounds.bottom);
    }
    if (scroll && this.scroller) {
      this.scroller.scrollTo(Math.min(
        y + this.getScrollTop() - bounds.top - bounds.height / 2,
        this.getScrollHeight() - bounds.height,
      ));
    }
  }

  /**
   * 查找节点
   *
   * @param componentId
   * @returns {DOMElement}
   */
  public findDOMNode(componentId: string) {
    return this.getVisualPage().findDOMNode(componentId); // esline-disable-line
  }

  /**
   * 获得滚动上距离
   *
   * @returns {number}
   */
  public getScrollTop() {
    return this.document ? this.document.scrollTop : 0;
  }

  /**
   * 获得滚动高度
   *
   * @returns {number}
   */
  public getScrollHeight() {
    return this.document.scrollHeight;
  }

  /**
   * 敏感件接口
   */
  public isEnabled() {
    return this.document !== null;
  }

  public isEnter(e: any) {
    const rect = this.getBounds();
    if (!rect) { return false; }
    return e.clientX >= rect.left && e.clientX <= rect.right
      && e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  public isInRange(e: any) {
    const rect = this.getBounds();
    if (!rect) { return false; }
    return e.clientX <= rect.right;
  }

  public orient(dragment: any, e: any) {
    this.sensitive = true;
    this.scroller.scrolling(e);
    return this.root.locate(dragment, e);
  }

  public deactivate() {
    this.sensitive = false;
    this.scroller.scrolling(null);
  }

  /**
   * alias to deactivate
   * @deprecated
   */
  public deactive() {
    this.deactivate();
  }

  public destroy() {
    this.unmount();
    this.root.destroy();
    this.history.destroy();
    this.emitter.removeAllListeners();

    if (this.modalNodesManager.willDestroy) {
      this.modalNodesManager.willDestroy.forEach((off: any) => {
        off();
      });
    }
    if (this.floatingNodesManager.willDestroy) {
      this.floatingNodesManager.willDestroy.forEach((off: any) => {
        off();
      });
    }
  }

  public destroyNode(node: any) {
    this.emitter.emit('nodedestroy', node);
  }

  public addNode(node: Node | Node[]) {
    this.emitter.emit('nodecreate', node);
  }

  public refresh() {
    this.emitter.emit('ve.page.refresh');
  }

  public startRefresh() {
    if (this.refreshCount) {
      this.refreshCount += 1;
    } else {
      this.refreshCount = 1;
    }
  }

  public endRefresh() {
    if (this.refreshCount > 0) {
      this.refreshCount -= 1;
    }
  }

  public canRefresh() {
    return this.refreshCount > 0;
  }

  public onRefresh(func: () => any) {
    this.emitter.on('ve.page.refresh', func);
    return () => {
      this.emitter.removeListener('ve.page.refresh', func);
    };
  }

  public onScroll(func: () => any) {
    this.emitter.on('scroll', func);
    return () => {
      this.emitter.removeListener('scroll', func);
    };
  }

  public onVisibleChange(func: (visible: boolean) => any) {
    this.emitter.on('visiblechange', func);
    return () => {
      this.emitter.removeListener('visiblechange', func);
    };
  }

  public onParamsChange(func: () => any) {
    this.emitter.on('paramschange', func);
    return () => {
      this.emitter.removeListener('paramschange', func);
    };
  }

  public onReady(func: () => any) {
    this.emitter.once('ready', func);
    return () => {
      this.emitter.removeListener('ready', func);
    };
  }

  public onNodeDestroy(func: (node?: Node) => any) {
    this.emitter.on('nodedestroy', func);
    return () => {
      this.emitter.removeListener('nodedestroy', func);
    };
  }

  public onNodeCreate(func: (node?: Node) => any) {
    this.emitter.on('nodecreate', func);
    return () => {
      this.emitter.removeListener('nodecreate', func);
    };
  }

  private getVisualPage() {
    if (!!this.ctx.getModule('VisualPage')) {
      return this.ctx.getModule('VisualPage');
    }
    return VisualPage;
  }
}

export interface IComponentSchema {
  componentName?: string;
  id?: string;
  props?: { [key: string]: any };
  children?: IComponentSchema[];
  lifeCycles?: { [key: string]: any };
  condition?: any;
  loop?: any;
  loopArgs?: Array<string>;
}

export interface IPageData {
  id: string;
  layout: IComponentSchema;
  [dataAddon: string]: any;
}
