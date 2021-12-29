import { cloneDeep, find } from 'lodash';

import {
  BaseManager,

  connectGeneralManager,
  connectGeneralManagerList,

  IManagerController,
  ISchemaController,
} from './base';
import VisualManager from './visualManager';

export default class SchemaManager extends BaseManager
  implements IManagerController, ISchemaController {

  private schemaData: object;
  private visualManagerList: VisualManager[];
  private schemaManagerList: SchemaManager[];

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

  public getSchemaManager(): SchemaManager {
    return this.schemaManagerList[0];
  }

  public getSchemaManagerById(id?: string): SchemaManager {
    return find(this.schemaManagerList, (m) => m.getId() === id);
  }

  public getSchemaManagerByName(name?: string): SchemaManager[] {
    return this.schemaManagerList.filter((m) => m.getName() === name);
  }

  public getSchemaManagerList() {
    return this.schemaManagerList;
  }

  public connectManager(manager: VisualManager) {
    connectGeneralManager.call(this, manager, this.visualManagerList);
    return this;
  }

  public connectSchemaManager(manager: SchemaManager): this {
    connectGeneralManager.call(this, manager, this.schemaManagerList);
    return this;
  }

  public connectManagerList(managerList: VisualManager[]): this {
    this.visualManagerList =
      connectGeneralManagerList.call(this, managerList, this.visualManagerList);
    return this;
  }

  public connectSchemaManagerList(managerList: SchemaManager[]): this {
    this.schemaManagerList =
      connectGeneralManagerList.call(this, managerList, this.schemaManagerList);
    return this;
  }

  public notifyAllManagers(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.visualManagerList.map((m) => m.emit(eventName, eventData)).every((r) => r);
  }

  public notifyAllSchemaManagers(eventName: string | symbol, ...eventData: any[]): boolean {
    return this.schemaManagerList.map((m) => m.emit(eventName, eventData)).every((r) => r);
  }

  public exportSchema(): string {
    try {
      return JSON.stringify(this.schemaData);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public exportSchemaObject(): object {
    return cloneDeep(this.schemaData);
  }

  public importSchema(schemaString: string): this {
    try {
      this.schemaData = JSON.parse(schemaString);
      return this;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public importSchemaObject(schema: object): this {
    this.schemaData = schema;
    return this;
  }
}
