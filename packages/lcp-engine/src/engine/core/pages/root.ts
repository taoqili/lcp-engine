import ContainerNode from './containerNode';
import { Node } from './node';

export default class Root extends ContainerNode {
  public setParent() {
  }

  public getRoot() {
    return this;
  }

  public isRoot() {
    return true;
  }

  public getComponentName() {
    return this.proto ? this.proto.getComponentName() : (this.componentName || 'Page');
  }

  public findNode(elem: Element): Node {
    return super.findNode(elem) || this;
  }

  public getRect() {
    return this.getPage().getBounds();
  }

  public remove() {
  }

  public clone() {
  }
}

Object.defineProperty(Node, 'Root', {
  value: Root,
});
