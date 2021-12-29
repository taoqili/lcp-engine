import Pane, { IPaneConfig } from './pane';

export interface IActionPaneConfig extends IPaneConfig {
  place?: 'left' | 'center' | 'right';
  index?: number;
}

export default class ActionCore extends Pane {
  public config: IActionPaneConfig;
  public getPlace() {
    return this.config.place || 'left';
  }

  /**
   * default to 0, without any priority, the action will
   * be sorted from left to right with large index on the
   * right
   */
  public getIndex() {
    return this.config.index || 0;
  }
}
