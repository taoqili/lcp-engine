import * as EventEmitter from 'events';
import { Node } from './node';
import { Page } from './page';

function getFloatingNodes(node: Node) {
  let nodes: any = [];
  const prototype = node.getPrototype();
  if (prototype && prototype.isFloating()) {
    nodes.push(node);
  }
  const children = node.getChildren();
  if (children) {
    children.forEach((child) => {
      nodes = nodes.concat(getFloatingNodes(child));
    });
  }
  return nodes;
}

export default class FloatingNodesManager {
  public willDestroy: any;

  private page: Page;
  private floatingNodes: [Node];
  private emitter: EventEmitter;

  constructor(page: Page) {
    this.page = page;
    this.emitter = new EventEmitter();
    this.setNodes();
    this.willDestroy = [
      page.onNodeCreate((node) => this.addNode(node)),
      page.onNodeDestroy((node) => this.removeNode(node)),
    ];
  }

  public getFloatingNodes() {
    return this.floatingNodes;
  }

  public getVisibleFloatingNodes() {
    const visibleNodes = this.floatingNodes
      ? this.floatingNodes.filter((node: Node) => {
          return !!node.getStatus('visibility');
        })
      : null;
    return visibleNodes;
  }

  public onFloatingNodesChange(func: () => any) {
    this.emitter.on('floatingNodesChange', func);
    return () => {
      this.emitter.removeListener('floatingNodesChange', func);
    };
  }

  private addNode(node: Node) {
    const prototype = node.getPrototype();
    if (prototype && prototype.isFloating()) {
      this.floatingNodes.push(node);
      this.emitter.emit('floatingNodesChange');
    }
    const children = node.getChildren();
    if (children && children.length > 0) {
      children.forEach((child) => {
        this.addNode(child);
      });
    }
  }

  private removeNode(node: Node) {
    const prototype = node.getPrototype();
    if (prototype && prototype.isFloating()) {
      const index = this.floatingNodes.indexOf(node);
      if (index >= 0) {
        this.floatingNodes.splice(index, 1);
      }
      this.emitter.emit('floatingNodesChange');
    }
  }

  private setNodes() {
    const nodes = getFloatingNodes(this.page.getRoot());
    this.floatingNodes = nodes;
    this.emitter.emit('floatingNodesChange');
  }
}
