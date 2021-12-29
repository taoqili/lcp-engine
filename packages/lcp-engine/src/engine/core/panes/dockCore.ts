import Pane, { IPaneConfig } from './pane';

function getCachedPosition(dockPaneName: string) {
  return window.localStorage && window.localStorage.getItem(`__ve.dockpane.${dockPaneName}.position__`);
}

function setPositionCache(dockPaneName: string, position: string) {
  if (window.localStorage) {
    window.localStorage.setItem(`__ve.dockpane.${dockPaneName}.position__`, position);
  }
}

export interface IContentItemConfig {
  title: string;
  content: JSX.Element;
  tip?: {
    content: string;
    url?: string;
  };
}

export interface IDockPaneConfig extends IPaneConfig {
  contents?: IContentItemConfig[];
  hideTitleBar?: boolean;
  width?: number;
  maxWidth?: number;
  height?: number;
  maxHeight?: number;
  position?: string | string[];
  menu?: JSX.Element;
  index?: number;
  place?: 'top' | 'bottom';
  isAction?: boolean;
  fullScreen?: boolean;
}

export default class DockCore extends Pane {
  public config: IDockPaneConfig;
  public contents: IContentItemConfig[];
  public description: string;
  public currentIndex: number;
  public actived: boolean;
  public isInitialized: boolean;
  public position: string;

  constructor(config: IDockPaneConfig) {
    super(config);
    if (this.config.contents && Array.isArray(this.config.contents)) {
      this.contents = this.config.contents;
      this.contents.forEach((item) => {
        item.content = this.initContent(item.content);
      });
    } else {
      this.contents = [{
        content: this.content,
        title: this.getTitle(),
      }];
    }

    this.description = this.config.description || this.getTitles().join('/');
    this.currentIndex = 0;
    this.position = getCachedPosition(config.name);
  }

  public getPlace() {
    return this.config.place || 'top';
  }

  public getTitles() {
    return this.contents.map((item) => item.title);
  }

  public getDescription() {
    return this.description;
  }

  public getMenu() {
    return this.config.menu || this.getTitle();
  }

  public getWidth() {
    return this.config.width || 200;
  }

  public getMaxWidth() {
    return this.config.maxWidth || 1000;
  }

  public getHeight() {
    return this.config.height || 300;
  }

  public getMaxHeight() {
    return this.config.maxHeight || 1000;
  }

  public getSupportedPositions() {
    if (!this.config.position) {
      return ['default'];
    }
    return Array.isArray(this.config.position) ? this.config.position : [this.config.position];
  }

  public getCurrentPosition() {
    if (this.position) {
      return this.position;
    }
    return this.getSupportedPositions()[0];
  }

  public setPosition(position: string) {
    if (this.position !== position) {
      this.position = position;
      setPositionCache(this.config.name, position);
      this.emitter.emit('positionchange', position);
    }
  }

  public showTitleBar() {
    return !this.config.hideTitleBar;
  }

  public getContent() {
    return this.contents[this.currentIndex].content || null;
  }

  public getCurrentContentConfig() {
    return this.contents[this.currentIndex] || null;
  }

  public getContents() {
    return this.contents;
  }

  // 是否只是动作，不需要出发弹窗
  public isAction() {
    return this.config.isAction;
  }

  public addContent(content: IContentItemConfig) {
    if (!content) { return; }
    content.content = this.initContent(content.content);
    this.contents.push(content);
    this.emitter.emit('contentschange');
  }

  public getCurrentIndex() {
    return this.currentIndex;
  }

  public activeIndex(index: number) {
    if (index === this.currentIndex) {
      return;
    }
    this.currentIndex = index;
    this.emitter.emit('contentschange');
  }

  /**
   * 是否激活
   *
   * @returns {boolean}
   */
  public isActive() {
    return this.actived;
  }

  /**
   * 是否初始化
   *
   * @returns {boolean}
   */
  public isInitialize() {
    return this.isInitialized;
  }

  public setActive(flag: boolean) {
    if (this.actived && !flag) {
      this.actived = false;
      this.emitter.emit('activechange', this.actived);
    } else if (!this.actived && flag) {
      this.actived = true;
      this.isInitialized = true;
      this.emitter.emit('activechange', this.actived);
    }
  }

  public onActiveChange(func: () => any) {
    this.emitter.on('activechange', func);
    return () => {
      this.emitter.removeListener('activechange', func);
    };
  }

  public onContentsChange(func: () => any) {
    this.emitter.on('contentschange', func);
    return () => {
      this.emitter.removeListener('contentschange', func);
    };
  }

  public onPositonChange(func: (position: string) => any) {
    this.emitter.on('positionchange', func);
    return () => {
      this.emitter.removeListener('positionchange', func);
    };
  }
}
