import { find } from 'lodash';

import {
  BaseManager,

  connectGeneralManager,
  connectGeneralManagerList,

  IDesignerController,
  IManagerController,
} from './base';
import VisualDesigner from './visualDesigner';

export default class VisualManager extends BaseManager
  implements IManagerController, IDesignerController {

  private visualManagerList: VisualManager[];
  private visualDesignerList: VisualDesigner[];

  public getManager(): VisualManager {
    return this.visualManagerList[0];
  }

  public getManagerByName(name?: string): VisualManager[] {
    return this.visualManagerList.filter((m) => m.getName() === name);
  }

  public getManagerById(id?: string): VisualManager {
    return find(this.visualManagerList, (m) => m.getId() === id);
  }

  public getManagerList(): VisualManager[] {
    return this.visualManagerList;
  }

  public getDesigner(): VisualDesigner {
    return this.visualDesignerList[0];
  }

  public getDesignerByName(name?: string): VisualDesigner[] {
    return this.visualDesignerList.filter((m) => m.getName() === name);
  }

  public getDesignerById(id?: string): VisualDesigner {
    return find(this.visualDesignerList, (m) => m.getId() === id);
  }

  public getDesignerList() {
    return this.visualDesignerList;
  }

  public connectManager(manager: VisualManager) {
    connectGeneralManager.call(this, manager, this.visualManagerList);
    return this;
  }

  public connectDesigner(manager: VisualDesigner): this {
    connectGeneralManager.call(this, manager, this.visualDesignerList);
    return this;
  }

  public connectManagerList(managerList: VisualManager[]): this {
    this.visualManagerList =
      connectGeneralManagerList.call(this, managerList, this.visualManagerList);
    return this;
  }

  public connectDesignerList(managerList: VisualDesigner[]): this {
    this.visualDesignerList =
      connectGeneralManagerList.call(this, managerList, this.visualDesignerList);
    return this;
  }

  public notifyAllManagers(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.getManagerList().map((m) => m.emit(eventName, eventData)).every((r) => r);
  }

  public notifyAllDesigners(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.getDesignerList().map((m) => m.emit(eventName, eventData)).every((r) => r);
  }
}
