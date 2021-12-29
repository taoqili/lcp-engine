import { Node } from '../../core/pages/node';

/**
 * Virtual Node for only rendering componentView
 * based on prototypeView.js
 */
export class VirtualRenderingNode extends Node {

  public isVirtual() {
    return true;
  }

  public isRoot() {
    return false;
  }

  public isVisibleInPane() {
    return true;
  }

  public canDragging() {
    return false;
  }

  public canHovering() {
    return false;
  }

  public canSelecting() {
    return false;
  }

  public canOperating() {
    return false;
  }

  public canDropIn() {
    return false;
  }

  public canDropTo() {
    return false;
  }

  public didDropIn() {
    return;
  }

  public didDropOut() {
    return;
  }

  /**
   * do not allow to export to schemaData
   */
  public toData(): any {
    return null;
  }
}
