import { find } from 'lodash';

import {
  BaseManager,

  connectGeneralManager,
  connectGeneralManagerList,

  IManagerController,
} from './base';
import VisualManager from './visualManager';

export default class VisualRender extends BaseManager
  implements IManagerController {

  private visualManagerList: VisualManager[];

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

  public connectManager(manager: VisualManager) {
    connectGeneralManager.call(this, manager, this.visualManagerList);
    return this;
  }

  public connectManagerList(managerList: VisualManager[]): this {
    this.visualManagerList =
      connectGeneralManagerList.call(this, managerList, this.visualManagerList);
    return this;
  }

  public notifyAllManagers(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.visualManagerList.map((m) => m.emit(eventName, eventData)).every((r) => r);
  }

  /**
   * Render function
   * @override
   *
   * @memberof VisualRender
   */
  public render(): any {
    return '';
  }
}
