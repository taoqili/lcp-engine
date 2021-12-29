import Pane, { IPaneConfig } from './pane';

export interface ITabPaneConfig extends IPaneConfig {
}

export default class TabCore extends Pane {

  public actived: boolean;

  /**
   * 是否激活
   *
   * @returns {boolean}
   */
  public isActive() {
    return this.actived;
  }

  public setActive(flag: boolean) {
    if (this.actived && !flag) {
      this.actived = false;
      this.emitter.emit('activechange', this.actived);
    } else if (!this.actived && flag) {
      this.actived = true;
      this.emitter.emit('activechange', this.actived);
    }
  }

  public onActiveChange(func: (tabPane: TabCore) => any) {
    this.emitter.on('activechange', func);
    return () => {
      this.emitter.removeListener('activechange', func);
    };
  }
}
