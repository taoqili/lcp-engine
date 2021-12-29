import { DisplayType, FlexDirection, IDisplay } from './pages/node';

export class Insertion {
  public index: any;
  public near: any;
  public nearAfter: any;
  public nearEdge: any;
  public nearIndex: any;
  public nearContainerDisplay?: IDisplay; // 插入节点的临近元素的父容器的display属性

  constructor(insertion: IInsertionConfigs) {
    this.index = insertion.nearIndex;
    this.near = insertion.near;
    this.nearAfter = insertion.nearAfter;
    this.nearEdge = insertion.nearEdge;
    this.nearContainerDisplay = insertion.nearContainerDisplay;

    if (this.nearAfter && this.index >= 0) {
      this.index += 1;
    }
  }

  public getIndex() {
    return this.index;
  }

  public getNear() {
    return this.near;
  }

  public getNearRect() {
    return this.near ? this.near.getRect() : null;
  }

  /**
   * 是否是垂直的
   */
  public isVertical() {
    return (
      !this.isNearEdge()
      && ((this.near && this.near.isInline())
        || (this.nearContainerDisplay
          && this.nearContainerDisplay.display === DisplayType.FLEX
          && this.nearContainerDisplay.flexDirection === FlexDirection.ROW))
    );
  }

  public isNearEdge() {
    return this.nearEdge;
  }

  public isNearAfter() {
    return this.nearAfter;
  }
}

export interface IInsertionConfigs {
  nearIndex: any;
  near: any;
  nearAfter: any;
  nearEdge: any;
  nearContainerDisplay: any;
}

export class Location {
  public static Insertion: Insertion;

  /**
   * VE.Node
   */
  public container: any;
  public insertion: Insertion;

  constructor(container: any, insertion: Insertion) {
    this.container = container;
    this.insertion = insertion instanceof Insertion ? insertion : new Insertion(insertion);
  }
  public createLocation(container: any, insertion: IInsertionConfigs) {
    return new Location(container, new Insertion(insertion));
  }

  public getContainer() {
    return this.container;
  }

  public getInsertion() {
    return this.insertion;
  }
}

export function createLocation(container: any, insertion: IInsertionConfigs) {
  return new Location(container, new Insertion(insertion));
}

Object.defineProperty(Location, 'Insertion', {
  value: Insertion,
});

export default Location;
