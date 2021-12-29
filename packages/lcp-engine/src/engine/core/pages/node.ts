import * as EventEmitter from 'events';
import { List as IMList, Map as IMMap } from 'immutable';
import { isArray, isObject } from 'lodash';
import { VE_EVENTS } from '../base/const';
import Prototype from '../bundle/prototype';
import Bus from '../bus';
import Exchange from '../exchange';
import { createLocation, Insertion } from '../location';
import Trunk from '../trunk';
import Viewport from '../viewport';
import { IComponentSchema, Page } from './page';
import Prop from './prop';
import { Props } from './props';
import Root from './root';

const { uniqueId } = require('@ali/ve-utils');

const bus = new Bus();

export enum DisplayType {
  INLINE = 'inline',
  BLOCK = 'block',
  INLINE_BLOCK = 'inline-block',
  FLEX = 'flex',
}

export enum FlexDirection {
  ROW = 'row',
  ROW_REVERSE = 'row-reverse',
  COLUMN = 'column',
  COLUMN_REVERSE = 'column-reverse',
}

export interface IDisplay {
  display: DisplayType;
  flexDirection?: FlexDirection;
}

interface IPoint {
  clientX: number;
  clientY: number;
}

export interface INodeStatus {
  selected: boolean | Insertion;
  hovering: boolean | Insertion;
  dragging: boolean | Insertion;
  dropping: boolean | Insertion;
  locking: boolean | Insertion;
  pseudo: boolean | Insertion;
  inPlaceEditing: boolean;
  visibility: boolean | Insertion; // @todo 重构的时候重写
  [statusName: string]: boolean | Insertion;
}

export interface IHotNodeData extends IMMap<string, any> {
  id?: string;
  props?: { [key: string]: any };
  children?: IComponentSchema[];
}

function isPointInRect(point: IPoint, rect: ClientRect | DOMRect) {
  return (
    point.clientY >= rect.top
    && point.clientY <= rect.bottom
    && (point.clientX >= rect.left && point.clientX <= rect.right)
  );
}

function distanceToRect(point: IPoint, rect: ClientRect | DOMRect) {
  let minX = Math.min(Math.abs(point.clientX - rect.left), Math.abs(point.clientX - rect.right));
  let minY = Math.min(Math.abs(point.clientY - rect.top), Math.abs(point.clientY - rect.bottom));
  if (point.clientX >= rect.left && point.clientX <= rect.right) {
    minX = 0;
  }
  if (point.clientY >= rect.top && point.clientY <= rect.bottom) {
    minY = 0;
  }

  return Math.sqrt(minX ** 2 + minY ** 2);
}

function distanceToEdge(point: IPoint, rect: ClientRect | DOMRect) {
  const distanceTop = Math.abs(point.clientY - rect.top);
  const distanceBottom = Math.abs(point.clientY - rect.bottom);

  return {
    distance: Math.min(distanceTop, distanceBottom),
    nearAfter: distanceBottom < distanceTop,
  };
}

function isNearAfter(point: IPoint, rect: ClientRect | DOMRect, inline: boolean, containerDisplay?: IDisplay) {
  if (
    inline
    || (containerDisplay
      && containerDisplay.display === DisplayType.FLEX
      && (containerDisplay.flexDirection === FlexDirection.ROW
        || containerDisplay.flexDirection === FlexDirection.ROW_REVERSE))
  ) {
    return (
      Math.abs(point.clientX - rect.left) + Math.abs(point.clientY - rect.top) >
      Math.abs(point.clientX - rect.right) + Math.abs(point.clientY - rect.bottom)
    );
  }
  return Math.abs(point.clientY - rect.top) > Math.abs(point.clientY - rect.bottom);
}

function getNodeProps(dataProps: any, nodeData: any) {
  const { condition, loop, loopArgs } = nodeData;
  const nodeProps = { ... dataProps };

  if (condition != null && dataProps) {
    nodeProps.__condition__ = condition;
  }

  if (loop && dataProps) {
    nodeProps.__loop__ = loop;
  }

  if (loopArgs && dataProps) {
    nodeProps.__loopArgs__ = loopArgs;
  }

  return nodeProps;
}

export interface INodeOptions {
  /**
   * 是否保留当前创建已有的 id
   */
  reserveSchemaNodeId?: boolean;
  /**
   * 子节点类型
   */
  SubNodeType?: typeof Node;
}

export class Node {
  public static Root: Root;
  public static Props = Props;

  public id: string;
  public page: Page;
  public parent: Node;
  public emitter: EventEmitter;
  public proto: Prototype;
  public componentName: string;
  public props: Props;
  public valid: boolean;
  public hotData: IHotNodeData;

  /**
   * When the node is created, the props data from schema or immutable data structure
   * as HotData of a node
   */
  public initialPropsData: any;

  public children: Node[];
  public status: INodeStatus;

  constructor(page: Page, data: IHotNodeData |Node| IComponentSchema, parent?: Node, options?: INodeOptions);
  constructor(page: Page, data: any, parent?: Node, options?: INodeOptions) {
    this.page = page;
    this.parent = parent || null;
    this.emitter = new EventEmitter();

    const isHot = IMMap.isMap(data);

    let children;
    if (data.getComponentName) {
      // from a prototype
      this.proto = data;
      this.id = uniqueId(null, 'node', 'engine-node');
      this.componentName = this.proto.getComponentName();
      this.props = new Props(this, this.proto.getConfigure(), this.proto.getDefaultProps());
      const childrenInitial = this.proto.getInitialChildren();
      if (typeof childrenInitial === 'function') {
        children = childrenInitial.call(this, this.props);
      } else if (Array.isArray(childrenInitial)) {
        children = childrenInitial;
      }
    } else if (isHot) {
      // from Immutable data
      this.id = data.get('id');
      this.componentName = data.get('componentName');
      this.proto = new Trunk().getPrototype(this.getComponentName()) || null;
      if (this.proto) {
        this.props = new Props(this, this.proto.getConfigure(), data.get('props'));
      }
      children = data.get('children');
    } else {
      // from simple schema structure
      data = this.transformInitData(data);

      this.id = uniqueId(data.id, 'node', 'engine-node');
      if (options && options.reserveSchemaNodeId) {
        this.id = data.id || this.id;
      }
      this.componentName = data.componentName;
      this.proto = new Trunk().getPrototype(this.getComponentName()) || null;

      if (this.proto) {
        const dataProps = this.proto.transformToActive(data.props || {});
        const nodeProps = getNodeProps(dataProps, data);

        this.props = new Props(this, this.proto.getConfigure(), nodeProps);
      }

      this.initialPropsData = data.props;
      children = data.children;
      if (!children && this.isContainer()) {
        const childrenInitial = this.proto.getInitialChildren();
        if (typeof childrenInitial === 'function') {
          children = childrenInitial.call(this, this.props);
        } else if (Array.isArray(childrenInitial)) {
          children = childrenInitial;
        }
      }
    }

    this.valid = this.proto != null;

    if (this.ableToModifyChildren()) {
      if (children) {
        if (isHot) {
          children = IMList.isList(children) ? children.toArray() : [];
        } else {
          children = Array.isArray(children) ? children : [];
        }
      } else {
        children = [];
      }
      const SubNodeType = options && options.SubNodeType;
      if (SubNodeType) {
        this.children = children.map((child: Node) => new SubNodeType(this.page, child, this, options));
      } else {
        this.children = children.map((child: Node) => new Node(this.page, child, this, options));
      }

    }

    if (this.props) {
      this.props.init();
    }

    this.status = {
      dragging: false,
      dropping: false,
      hovering: false,
      inPlaceEditing: false,
      locking: false,
      pseudo: false,
      selected: false,
      visibility: localStorage.getItem(`${this.getId()}_visibility`) !== 'hidden', // @todo 重构的时候重写
    };

    this.hotData = isHot
      ? data
      : IMMap({
        children: this.ableToModifyChildren() ? IMList(this.children.map((node) => node.getHotData())) : null,
        componentName: this.getComponentName(),
          id: this.getId(),
          props: this.props ? this.props.getHotData() : null,
        });
    new Bus().emit(VE_EVENTS.VE_NODE_CREATED, this);
  }

  public addRecord(title?: string) {
    const hotData = this.hotData.merge({
      children: this.ableToModifyChildren() ? IMList(this.children.map((node) => node.getHotData())) : [],
      props: this.props ? this.props.getHotData() : null,
    });
    if (hotData.equals(this.hotData)) {
      return;
    }

    title = title || 'Alter node';

    this.hotData = hotData;
    if (this.isRoot()) {
      this.page.addHistory(title);
    } else if (this.parent) {
      this.parent.addRecord(title);
    }
  }

  public setPropValue(prop: string, value: any) {
    if (this.props) {
      this.props.setPropValue(prop, value);
    }
  }

  public setStatus(field?: string, flag?: boolean) {
    if (!this.status.hasOwnProperty(field)) {
      return;
    }
    if (flag !== this.status[field]) {
      if (field === 'pseudo' && flag && !this.status.selected) {
        return;
      }
      if (field === 'selected' && !flag) {
        this.status.pseudo = false;
      }
      if (field === 'visibility') {
        localStorage.setItem(`${this.getId()}_visibility`, flag ? 'visible' : 'hidden'); // @todo 重构的时候重写
      }
      this.status[field] = flag;
      this.emitter.emit('statuschange', this.status, field);
    }
  }

  public setLock(flag?: boolean) {
    if (flag) {
      Exchange.lock(this);
    } else if (this.isLocking()) {
      Exchange.lock(null);
    }
  }

  public setInPlaceEdit(flag?: boolean) {
    if (flag) {
      Exchange.inPlaceEdit(this);
    } else if (this.isInPlaceEditing()) {
      Exchange.inPlaceEdit(null);
    }
  }

  public setParent(parent: Node) {
    if (parent === this.parent) { return; }

    if (this.parent) {
      this.parent.didDropOut(this);
    }

    this.parent = parent;

    if (parent) {
      parent.didDropIn(this);
    }
  }

  public setProps(props: Props) {
    this.props = props;
    bus.emit(VE_EVENTS.VE_NODE_PROPS_REPLACE, this.props, this);
    this.emitter.emit('node.propsReplace', props);
  }

  public setHotData(hotData: IHotNodeData, options?: {
    disableMutator: boolean;
  }) {
    if (!IMMap.isMap(hotData)) {
      return;
    }
    this.hotData = hotData;

    if (this.ableToModifyChildren()) {
      // diff children
      const children = hotData.get('children');
      const has: any = {};
      if (this.children) {
        this.children.forEach((node) => {
          has[node.getId()] = node;
        });
      }
      this.children = (IMList.isList(children) ? children.toArray() : []).map((child: IHotNodeData) => {
        const id = child.get('id');
        let node;
        if (has.hasOwnProperty(id)) {
          node = has[id];
          delete has[id];
          node.setHotData(child, options);
        } else {
          node = new Node(this.page, child, this);
        }
        return node;
      });

      Object.keys(has).forEach((id) => has[id].destroy());
      this.emitter.emit('childrenchange', this.children);
    }

    if (this.props) {
      this.props.setHotData(hotData.get('props'), {
        disableMutator: true,
      });
    }
  }

  public setPrototype(proto: Prototype) {
    this.proto = proto;
  }

  public getHotData() {
    return this.hotData;
  }

  public getId() {
    return this.id;
  }

  public getStatus(): INodeStatus;
  public getStatus(field?: string): Insertion;
  public getStatus(field?: string): any {
    return field ? this.status[field] : this.status;
  }

  public getChildren() {
    return this.children;
  }

  public getParent() {
    return this.parent;
  }

  public getPage() {
    return this.page;
  }

  public getRoot() {
    return this.getPage().getRoot();
  }

  public getPrototype() {
    return this.proto;
  }

  public getExtraActions() {
    const actions = this.proto ? this.proto.getExtraActions() : [];
    return actions.map((action: any) => {
      if (action && typeof action === 'function') {
        return action.call(this);
      }
      return action;
    });
  }

  public getProps() {
    return this.props;
  }

  public getProp(prop: string, createNewPropIfEmpty?: boolean): Prop {
    return this.props ? this.props.getProp(prop, createNewPropIfEmpty) : null;
  }

  public getPropValue(prop: string): any {
    const resultProp = this.getProp(prop);
    if (resultProp) {
      return resultProp.getValue();
    }
    return null;
  }

  public getStaticProps(forSave?: boolean) {
    let props = {};
    if (this.props) {
      if (forSave) {
        props = this.props.toData();
      } else {
        props = this.props.toProps();
      }
      props = this.proto.transformToStatic(props);
      if (!forSave) {
        props = this.proto.reduce(props);
      }
    }
    return props;
  }

  /**
   * 获取组件标题
   */
  public getTitle() {
    if (!this.proto) { return this.getComponentName(); }
    if (this.proto.getComponentName() === 'Slot') {
      return this.getPropValue('slotTitle')
        || this.getPropValue('slotName')
        || this.getComponentName();
    }
    return this.proto.getTitle();
  }

  /**
   * 获取组件标识
   */
  public getComponentName() {
    return this.proto ? this.proto.getComponentName() : this.componentName || 'UnknownComponent';
  }

  /**
   * 获取图标
   */
  public getIcon() {
    return this.proto ? this.proto.getIcon() : '';
  }

  public getSuitablePlace(node: Node, ref: any = null, dropIn: boolean = false): any {
    if (this.isRoot() || (this.isContainer() && dropIn)) {
      if (this.canDropIn(node) && !(node.isNode && node.containsNode(this))) {
        return { container: this, ref };
      } else if (this.isRoot() && this.children.length > 0) {
        /**
         * if the root element is not allowed to be dropped in
         * use the nearest child element as drop-in replacement
         */
        const dropElement = this.children.filter((c) => c.canDropIn(node))[0];
        if (dropElement) {
          return { container: dropElement, ref };
        }
      }
    }

    const parent = this.getParent();
    if (parent) {
      return parent.getSuitablePlace(node, this, true);
    }
    return null;
  }

  public getIndex() {
    const parent = this.getParent();
    return parent ? parent.indexOf(this) : 0;
  }

  public getChild(index: number) {
    if (!this.children) {
      return null;
    }
    const l = this.children.length;
    if (index >= l) {
      return null;
    }
    if (index < 0) {
      return null;
    }
    return this.children[index];
  }

  /**
   * 获取矩形区域
   */
  public getRect() {
    const prototype = this.getPrototype();
    const rectSelector = prototype ? prototype.getRectSelector() : null;
    const node = this.getDOMNode();
    if (node) {
      if (rectSelector) {
        const rectNode = node.querySelector(rectSelector);
        if (rectNode) {
          return rectNode.getBoundingClientRect();
        }
      }
      return node.getBoundingClientRect();
    } else {
      return null;
    }
  }

  /**
   * 获取DOM节点
   *
   * @returns {DOMElement}
   */
  public getDOMNode(): Element {
    return this.getPage().findDOMNode(this.getId());
  }

  public isLocking() {
    return Exchange.getLocking() === this;
  }

  public isInPlaceEditing() {
    return Exchange.getInPlaceEditing() === this;
  }

  public isRoot() {
    return false;
  }

  /**
   * 是否可见
   */
  public isVisible() {
    const device = Viewport.getDevice().toUpperCase();
    const visibility = this.getPropValue('visibility');

    if (visibility == null || visibility === 'ALL') {
      return true;
    }

    if (Array.isArray(visibility) && visibility.indexOf(device) > -1) {
      return true;
    }

    return false;
  }

  public isVisibleInPane(): boolean {
    return !!this.getStatus('visibility');
  }
  /**
   * 是否是容器
   */
  public isContainer() {
    return this.proto ? this.proto.isContainer() : false;
  }

  /**
   * 是否行内元素
   */
  public isInline() {
    const ret = this.proto ? this.proto.isInline() : null;
    if (ret == null) {
      const nativeNode = this.getDOMNode();
      if (!nativeNode) { return false; }
      const style = window.getComputedStyle(nativeNode);
      return /^inline/.test(style.getPropertyValue('display'));
    }
    return ret;
  }

  public isEmpty() {
    return !this.children || this.children.length < 1;
  }

  public isValid() {
    return this.valid;
  }

  public isNode() {
    return true;
  }

  public isMount() {
    return this.getDOMNode() !== null;
  }

  /**
   * 判断是否是一个节点的子级
   * @param node 父级节点
   * @param isRecursive 是否向上递归查找
   */
  public isChildOf(node: Node, isRecursive: boolean) {
    if (!isRecursive) {
      return this.parent === node;
    }
    let child: Node = this;
    while (child.parent) {
      if (child.parent === node ) {
        return true;
      }
      child = child.parent;
    }
    return false;
  }

  /**
   * 能否拖动
   */
  public canDragging() {
    const node = this;
    return this.proto ? this.proto.canDragging(node) : false;
  }

  /**
   * 能否悬停
   */
  public canHovering() {
    return this.proto ? this.proto.canHovering() : true;
  }

  /**
   * 能否选中
   */
  public canSelecting() {
    return this.proto ? this.proto.canSelecting() : true;
  }

  /**
   * 能否设置
   */
  public canSetting() {
    return this.proto ? this.proto.canSetting() : true;
  }

  /**
   * 能否操作
   */
  public canOperating() {
    return this.proto ? this.proto.canOperating() : true;
  }

  /**
   * 能否投至
   *
   * @param {Node} container
   */
  public canDropTo(container: Node) {
    return this.proto ? this.proto.canDropTo(container) : true;
  }

  /**
   * 能否投入
   *
   * @param {Dragment} dragment
   */
  public canDropIn(dragment: Node) {
    return (this.proto ? this.proto.canDropIn(dragment) : false) && dragment.canDropTo(this);
  }

  public didDropIn(dragment: Node) {
    if (this.proto) {
      this.proto.didDropIn(dragment, this);
      if (this.parent) {
        this.parent.didDropIn(dragment);
      }
    }
  }

  public didDropOut(dragment: Node) {
    if (this.proto) {
      this.proto.didDropOut(dragment, this);
      if (this.parent) {
        this.parent.didDropOut(dragment);
      }
    }
  }

  public canContain(dragment: Node) {
    return this.isContainer() && dragment !== this && (this.proto ? this.proto.canContain(dragment) : false);
  }

  /**
   * 定位
   *
   * @param {Dragment} dragment
   * @param e
   * @returns {Location}
   */
  public locate(dragment: any, e: any): any {
    // 模态组件只能拖入到root节点
    const isModal = dragment.isModal ? dragment.isModal() : dragment.getPrototype().isModal();
    if (isModal) {
      if (!this.isRoot()) {
        return null;
      } else {
        return createLocation(this, {
          near: this.children[0],
          nearAfter: false,
          nearContainerDisplay: null,
          nearEdge: true,
          nearIndex: 0,
        });
      }
    }

    // 当视图有模态组件时，只能拖入到模态组件或其children中
    if (this.isRoot()) {
      const modalManager = this.getPage().modalNodesManager;
      const visibleModalNode = modalManager.getVisibleModalNode();
      if (visibleModalNode) {
        return visibleModalNode.locate(dragment, e);
      }
    }

    // 当视图有悬浮组件时，优先判断能否拖入到悬浮组件中
    if (this.isRoot() || (this.getPrototype().isModal() && !this.getPrototype().isFloating())) {
      const floatingNodeManager = this.getPage().floatingNodesManager;
      let floatingNodes = floatingNodeManager.getVisibleFloatingNodes();
      floatingNodes = floatingNodes.filter((node) => {
        return node.isChildOf(this, true);
      });
      if (floatingNodes && floatingNodes.length > 0) {
        for (let i = 0, len = floatingNodes.length; i < len; i++) {
          const node = floatingNodes[i];
          const rect = node.getRect();

          if (!rect) {
            continue;
          }

          if (node.isContainer() && isPointInRect(e, rect)) {
            const location = floatingNodes[i].locate(dragment, e);
            if (location) {
              return location;
            }
          }
        }
      }
    }

    if (!this.canContain(dragment) || !this.isVisible()) {
      return null;
    }

    const edgeRect = this.getRect();
    if (!edgeRect) {
      return null;
    }

    const children = this.getChildren();

    let node;
    let rect;
    let distance;
    let near = null;
    let nearDistance = null;

    if (this.canDropIn(dragment)) {
      let location;
      let nearRect = null;
      let nearIndex = 0;
      let nearAfter = false;
      let nearEdge = false;

      for (let i = 0, l = children.length; i < l; i++) {
        node = children[i];
        rect = node.getRect();

        if (!rect) {
          continue;
        }

        if (node.isContainer() && isPointInRect(e, rect)) {
          location = node.locate(dragment, e);
          if (location) {
            return location;
          }
          distance = 0;
        } else {
          distance = distanceToRect(e, rect);
        }

        if (distance === 0) {
          nearDistance = distance;
          near = node;
          nearIndex = i;
          nearRect = rect;
          break;
        }

        if (nearDistance === null || distance < nearDistance) {
          nearDistance = distance;
          near = node;
          nearIndex = i;
          nearRect = rect;
        }
      }

      let nearContainerDisplay: IDisplay;
      if (near) {
        const parentElement = near.getDOMNode().parentElement;
        const parentStyle = window.getComputedStyle(parentElement);
        nearContainerDisplay = {
          display: parentStyle.getPropertyValue('display') as DisplayType,
        };
        if (/^flex/.test(nearContainerDisplay.display)) {
          nearContainerDisplay.flexDirection =
            parentStyle.getPropertyValue('flex-direction') as FlexDirection || FlexDirection.ROW;
        }
      }

      if (near && nearRect) {
        nearAfter = isNearAfter(e, nearRect, near.isInline(), nearContainerDisplay);
      }

      if (nearDistance !== 0) {
        const edgeDistance = distanceToEdge(e, edgeRect);
        distance = edgeDistance.distance;
        if (nearDistance === null || distance < nearDistance) {
          nearAfter = edgeDistance.nearAfter;
          nearIndex = nearAfter ? children.length - 1 : 0;
          nearEdge = true;
        }
      }

      return createLocation(this, {
        near,
        nearAfter,
        nearContainerDisplay,
        nearEdge,
        nearIndex,
      });
    }

    if (isPointInRect(e, edgeRect)) {
      for (let i = 0, l = children.length; i < l; i++) {
        node = children[i];

        rect = node.getRect();
        if (!node.isContainer() || !rect || rect.width <= 0 || rect.height <= 0) {
          continue;
        }

        distance = distanceToRect(e, rect);

        if (distance === 0) {
          near = node;
          break;
        }

        if (nearDistance === null || distance < nearDistance) {
          nearDistance = distance;
          near = node;
        }
      }
      return near ? near.locate(dragment, e) : null;
    }

    return null;
  }

  public select() {
    Exchange.select(this);
  }

  public hover() {
    Exchange.hover(this);
  }

  public lock() {
    Exchange.lock(this);
  }

  /**
   * 插入节点
   *
   * @param {Node|Dragment} node
   * @param {Insertion} insertion
   * @param {boolean} noRecord 是否不需要加入 history
   * @returns {Node}
   */
  public insert(node: Node, insertion: Insertion, index: number, noRecord?: boolean) {
    if (index == null) {
      index = insertion ? insertion.getIndex() : this.children.length;
      if (index === null) {
        return node instanceof Node ? node : null;
      }
    }

    if (!(node instanceof Node)) {
      node = new Node(this.getPage(), node);
    }

    const i = this.children.indexOf(node);

    if (i < 0) {
      const oldContainer = node.getParent();
      if (oldContainer && oldContainer !== this) {
        oldContainer.removeChild(node, true);
      }
      node.setParent(this);
      if (index < this.children.length) {
        this.children.splice(index, 0, node);
      } else {
        this.children.push(node);
      }
      if (!oldContainer) {
        this.getPage().addNode(node);
      }
    } else {
      if (index > i) {
        index -= 1;
      }
      if (index === i) {
        return node;
      }
      this.children.splice(i, 1);
      this.children.splice(index, 0, node);
    }

    if (!noRecord) {
      this.addRecord();
    }
    this.emitter.emit('childrenchange', this.children);
    return node;
  }

  public insertAfter(node: IComponentSchema | Node, ref?: any, noRecord?: boolean): Node;
  public insertAfter(node: any, ref?: any, noRecord?: boolean) {
    if (!this.ableToModifyChildren()) { return null; }
    let index = this.children.length;
    if (ref) {
      index = this.indexOf(ref);
      if (index < 0) {
        return null;
      }
      index += 1;
    }
    return this.insert(node, null, index, noRecord);
  }

  public insertBefore(node: Node, ref: any, noRecord?: boolean) {
    if (!this.ableToModifyChildren()) { return null; }
    let index = 0;
    if (ref) {
      index = this.indexOf(ref);
      if (index < 0) {
        return null;
      }
    }
    return this.insert(node, null, index, noRecord);
  }

  public indexOf(node: Node) {
    return this.children.indexOf(node);
  }

  public lastChild() {
    if (!this.children) {
      return null;
    }
    return this.getChild(this.children.length - 1);
  }

  public nextSibling() {
    const parent = this.getParent();
    return parent ? parent.getChild(this.getIndex() + 1) : null;
  }

  public prevSibling() {
    const parent = this.getParent();
    return parent ? parent.getChild(this.getIndex() - 1) : null;
  }

  public clone() {
    const parent = this.getParent();
    if (parent) {
      const node = parent.insertAfter(this.toData(), this);
      if (node) {
        Exchange.select(node);
      }
      this.reportModified(parent, {type: 'clone'});
    }
  }

  public mergeChildren(remover: () => any, adder: (children: Node[]) => any, sorter: () => any) {
    let changed = 0;
    if (remover) {
      const willRemove = this.children.filter(remover);
      if (willRemove.length > 0) {
        willRemove.forEach((node) => {
          const i = this.children.indexOf(node);
          if (i > -1) {
            this.children.splice(i, 1);
          }
          node.setParent(null);
          node.destroy();
        });
        changed = 1;
      }
    }
    if (adder) {
      let items = adder(this.children);
      if (items && items.length > 0) {
        items = items.map((child: Node) => new Node(this.page, child, this));
        this.children = this.children.concat(items);
        changed = 1;
      }
    }
    if (sorter) {
      this.children = this.children.sort(sorter);
      changed = 1;
    }
    if (changed) {
      this.addRecord();
      this.emitter.emit('childrenchange', this.children);
      this.reportModified(this, {type: 'mergeChildren'});
    }
  }

  /**
   * 移除子节点
   *
   * @param {Node} node
   * @param {bool} move is move operation not delete
   */
  public removeChild(node: Node, move?: boolean, noRecord?: boolean) {
    const i = this.children.indexOf(node);
    if (i > -1) {
      this.children.splice(i, 1);
      const parent = this.getParent();
      node.setParent(null);
      if (!noRecord) {
        this.addRecord();
      }
      this.emitter.emit('childrenchange', this.children);
      if (!move) {
        node.destroy();
      }
      this.reportModified(parent, {type: 'removeChild', removeIndex: i, removeNode: node});
    }
  }

  /**
   * 替换子节点
   *
   * @param {Node} node
   * @param {object} data
   * @param {bool} keepData
   */
  public replaceChild(node: Node, data: any, extraOptions?: {
    reserveSchemaNodeId?: boolean;
  }) {
    const parent = this.getParent();
    const i = this.children.indexOf(node);
    if (i > -1) {
      const selected = Exchange.getSelected() === node;

      node.setParent(null);
      node.destroy();

      node = new Node(this.getPage(), data, this, { ...(extraOptions || {}) });
      this.children.splice(i, 1, node);
      this.page.addNode(node);

      this.addRecord();
      this.emitter.emit('childrenchange', this.children);

      if (selected) {
        Exchange.select(node);
      }
    }
    this.reportModified(parent, {type: 'replaceChild', replaceIndex: i, replaceNode: node});
    return node;
  }

  /**
   * 移除
   */
  public remove() {
    const parent = this.getParent();
    const index = parent.children.indexOf(this);
    parent.removeChild(this);
    this.reportModified(parent, {type: 'remove', removeIndex: index, removeNode: this});
  }

  public replaceWith(data: any, inheritData: any) {
    data = Object.assign({}, inheritData ? this.toData() : {}, data);
    return this.getParent().replaceChild(this, data);
  }

  public mountChange() {
    this.emitter.emit('mountchange');
  }

  public destroy() {
    Exchange.purge(this);
    if (this.ableToModifyChildren()) {
      this.getChildren().forEach((node) => node.destroy());
    }
    this.getPage().destroyNode(this);
    if (this.props) {
      this.props.destroy();
    }
    this.emitter.emit('destroy');
    this.emitter.removeAllListeners();
    new Bus().emit(VE_EVENTS.VE_NODE_DESTROY, this.getParent());
  }

  /**
   * 是否包含元素
   *
   * @param {DOMElement} elem
   * @returns {boolean}
   */
  public contains(elem: Element) {
    const node = this.getDOMNode();
    return elem && node && node.contains(elem);
  }

  public containsNode(node: Node) {
    if (node === this) {
      return true;
    }
    if (this.isContainer()) {
      node = node.getParent();
      while (node) {
        if (node === this) {
          return true;
        }
        node = node.getParent();
      }
    }
    return false;
  }

  /**
   * 通过元素匹配查找节点
   *
   * @param {DOMElement} elem
   * @returns {Node|null}
   */
  public findNode(elem: Element): Node {
    if (!this.contains(elem)) {
      return null;
    }

    if (this.ableToModifyChildren()) {
      let node;
      for (let i = 0, l = this.children.length; i < l; i++) {
        node = this.children[i].findNode(elem);
        if (node) {
          return node;
        }
      }
    }
    return this;
  }

  /**
   * 导出节点数据
   *
   * @returns {{props: Object, children:Array}}
   */
  public toData() {
    const data: IComponentSchema = {
      componentName: this.getComponentName(),
      id: this.getId(),
      props: this.getStaticProps(true),
    };

    if (data.props && data.props.__condition__ != null) {
      data.condition = data.props.__condition__;
      delete data.props.__condition__;
    }

    if (data.props && data.props.__loop__) {
      data.loop = data.props.__loop__;

      if (data.props.__loopArgs__) {
        data.loopArgs = data.props.__loopArgs__;
      }

      delete data.props.__loop__;
    }

    if (data.props && data.props.__loopArgs__) {
      delete data.props.__loopArgs__;
    }

    if (this.ableToModifyChildren()) {
      data.children = this.children.filter((item) => {
        return item.componentName !== 'Slot';
      }).map((node) => node.toData()).filter((item) => item != null);
    }
    return data;
  }

  public onPropsReplace(func: (props: Props) => any) {
    this.emitter.on('node.propsReplace', func);
    return () => {
      this.emitter.removeListener('node.propsReplace', func);
    };
  }

  public onPropsChange(func: () => any) {
    return this.props ? this.props.onPropsChange(func) : () => {};
  }

  public onChildrenChange(func: () => any) {
    this.emitter.on('childrenchange', func);
    return () => {
      this.emitter.removeListener('childrenchange', func);
    };
  }

  public onVisibilityChange(func: () => any) {
    this.emitter.on('visibilitychange', func);
    return () => {
      this.emitter.removeListener('visibilitychange', func);
    };
  }

  public onStatusChange(func: (status?: any, field?: any) => any) {
    this.emitter.on('statuschange', func);
    return () => {
      this.emitter.removeListener('statuschange', func);
    };
  }

  public onMountChange(func: () => any) {
    this.emitter.on('mountchange', func);
    return () => {
      this.emitter.removeListener('mountchange', func);
    };
  }

  public onDestroy(func: () => any) {
    this.emitter.on('destroy', func);
    return () => {
      this.emitter.removeListener('destroy', func);
    };
  }

  /**
   * isContainer or hasSlot
   */
  public ableToModifyChildren() {
    return this.isContainer() || (this.proto && this.proto.hasSlot());
  }

  protected transformInitData(data: IComponentSchema) {
    if (data.props) {
      Object.keys(data.props).forEach((key) => {
        if (data.props[key] && data.props[key].type === 'JSBlock') {
          if (!data.children) {
            data.children = [];
          }
          data.children.push(data.props[key].value);
        }
      });
    }
    return data;
  }

  private reportModified(node: Node, options = {}) {
    if (!node) { return; }
    if (node.isRoot()) { return; }
    const fn = node.proto.getConfig('subtreeModified');
    if (fn) { fn.call(this, node, options); }
    if (node.parent && !node.parent.isRoot()) { this.reportModified(node.parent); }
  }
}
