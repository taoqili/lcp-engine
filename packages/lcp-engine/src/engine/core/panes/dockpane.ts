import * as EventEmitter from 'events';
import Bus from '../bus';
import DragEngine from '../dragengine';
import Flags from '../flags';
import Viewport from '../viewport';
import DockCore, {
  IContentItemConfig,
  IDockPaneConfig,
} from './dockCore';

class DockPane {

  public emitter: EventEmitter;
  public bus: Bus;

  public activedDock: DockCore;
  public stashedDock: DockCore = null;

  public docks: DockCore[];
  public miniMode: boolean;

  constructor() {
    this.emitter = new EventEmitter();
    this.docks = [];
    this.miniMode = false;
    this.bus = new Bus();

    Viewport.onFocusChange((flag: boolean) => {
      if (Flags.has('slate-fixed')) {
        return;
      }
      if (flag && this.activedDock && this.activedDock.getCurrentPosition() === 'default') {
        this.activeDock(null);
      }
    });

    // 引擎开始拖拽的时候需要隐藏正在展示的 dockPane
    DragEngine.onDragstart(() => {
      if (Flags.has('slate-fixed')) {
        return;
      }
      this.stashedDock = this.activedDock;
      this.activeDock(null);
    });

    // 引擎结束拖拽的时候还原之前的状态
    DragEngine.onDragend(() => {
      if (Flags.has('slate-fixed')) {
        return;
      }
      this.activeDock(this.stashedDock || null);
      this.stashedDock = null;
    });
  }

  public activeDock(dock: DockCore | string): void;
  public activeDock(dock: any): void {
    if (typeof dock === 'string') {
      dock = this.docks.find((item) => item.getName() === dock);
    }

    if (this.activedDock === dock) {
      return;
    }

    if (this.activedDock) {
      this.activedDock.setActive(false);
      this.emitter.emit(
        've.dockPane.hideDock',
        this.docks.find((item) => item.getName() === this.activedDock.getName()),
      );
    }

    if (dock) {
      dock.setActive(true);
      Flags.setHideSlate(false);
      this.bus.emit('ve.dock_pane.active_doc', dock);
      this.emitter.emit('ve.dockPane.showDock', dock);
    } else {
      // 默认打开第一个
      if (Flags.has('slate-fixed')) {
        dock = this.docks[0];
        dock && dock.setActive(true);
      }
      Flags.setHideSlate(true);
    }

    this.activedDock = dock;
  }

  public setFixed(flag: boolean) {
    if (flag) {
      Flags.add('slate-fixed');
      if (this.activedDock == null) {
        this.activeDock(this.docks[0]);
      }
    } else {
      Flags.remove('slate-fixed');
    }
    this.emitter.emit('dockschange', this.docks);
  }

  /**
   * 添加一个泊位
   *
   * @param {object} dockConfig
   */
  public addDock(dockConfig: IDockPaneConfig) {
    const dock = new DockCore(dockConfig);

    let index = dockConfig.index;
    if (index == null) {
      index = this.docks.length;
    }
    this.docks.splice(index, 0, dock);
    if (Flags.has('slate-fixed') && this.activedDock == null) {
      this.activeDock(dock);
    }
    this.emitter.emit('dockschange', this.docks);
  }

  public addDockContent(name: string, content: IContentItemConfig) {
    const dock = this.docks.find((item) => item.getName() === name);
    if (dock) {
      dock.addContent(content);
    }
  }

  /**
   * 删除一个泊位
   *
   * @param dock | string
   */
  public removeDock(dock: DockCore | string): void;
  public removeDock(dock: any): void {
    if (typeof dock === 'string') {
      dock = this.docks.find((item) => item.getName() === dock);
    }

    const i = this.docks.indexOf(dock);

    if (i > -1) {
      this.docks.splice(i, 1);
      dock.destroy();
      if (this.activedDock === dock) {
        this.activeDock(this.docks[0]);
      }
      this.emitter.emit('dockschange', this.docks);
    }
  }

  public getDocks() {
    return this.docks;
  }

  public onDocksChange(func: (docks: DockCore[]) => any) {
    this.emitter.on('dockschange', func);
    return () => {
      this.emitter.removeListener('dockschange', func);
    };
  }

  public onDockShow(fn: (dock: DockCore) => any) {
    this.emitter.on('ve.dockPane.showDock', fn);
    return () => {
      this.emitter.removeListener('ve.dockPane.showDock', fn);
    };
  }

  public onDockHide(fn: (dock: DockCore) => any) {
    this.emitter.on('ve.dockPane.hideDock', fn);
    return () => {
      this.emitter.removeListener('ve.dockPane.hideDock', fn);
    };
  }
}

export default DockPane;
