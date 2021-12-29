import * as EventEmitter from 'events';
import { find } from 'lodash';
import lg from '@ali/vu-logger';

import Env from '../env';
import Exchange from '../exchange';
import Flags from '../flags';
import DragEngine from '../dragengine';
import Overlay from '../overlay/index';
import { Page, IPageData } from './page';

import { Insertion } from '../location';

const StyleSheet = require('@ali/vu-style-sheet');

export default class Pages {

  pages: Page[];
  emitter: EventEmitter;
  currentPage: Page;

  constructor() {
    this.pages = [];
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(0);
    this.currentPage = null;

    Exchange.onIntoView((node: any, insertion: Insertion) => {
      const page = node.getPage();
      if (page === this.currentPage) {
        page.scrollIntoNode(node, insertion);
      }
    });
    Flags.onFlagsChange(() => Overlay.touch(true));
    Env.onEnvChange(() => Overlay.touch(true));
    DragEngine.addSensor(this);
  }

  /** start: sensor for DragEngine **/

  isEnabled() {
    return this.currentPage && this.currentPage.isEnabled();
  }

  isEnter(e: any) {
    return this.currentPage && this.currentPage.isEnter(e);
  }

  isInRange(e: any) {
    return this.currentPage && this.currentPage.isInRange(e);
  }

  deactive() {
    return this.currentPage && this.currentPage.deactive();
  }

  orient(dragment: any, e: any) {
    return this.currentPage && this.currentPage.orient(dragment, e);
  }

  /** end: sensor for DragEngine **/

  /**
   * 初始化页面集数据
   *
   * @param {Object[]} pagesdata
   */
  setPages(pagesdata: IPageData[]) {
    if (this.pages) {
      this.pages.forEach((page) => {
        page.destroy();
      });
    }
    this.pages = pagesdata ? pagesdata.map((data) => {
      try {
        return new Page(data);
      } catch (e) {
        lg.error('ERROR: create new page error', e);
        return null;
      }
    }).filter(item => item !== null) : [];
    // delay the execution of pageChange event to avoid invalid repaint
    setTimeout(() => {
      this.emitter.emit('pageschange', this.pages);
      this.setCurrentPage(this.getPage(0));
    });
  }

  /**
   * 导出页面集数据
   *
   * @returns {Object[]}
   */
  toData() {
    return this.pages.map(page => page.toData());
  }

  /**
   * 添加页面
   *
   * @param {Object} data
   * @returns {Page}
   */
  addPage(data: IPageData) {
    const page = new Page(data);
    this.pages.push(page);

    this.emitter.emit('pageschange', this.pages);

    if (!this.currentPage) {
      this.setCurrentPage(page);
    }

    return page;
  }

  /**
   * 获取一个页面
   *
   * @param {int} index
   * @returns {Page|null}
   */
  getPage(fn: (page: Page) => boolean): Page | null;
  getPage(index: number): Page;
  getPage(fn: any) {
    if (typeof fn === 'number') {
      return this.pages[fn];
    } else if (typeof fn === 'function') {
      return find(this.pages, fn);
    }
    return null;
  }

  /**
   * 删除页面
   *
   * @param {Page} page
   */
  removePage(page: Page) {
    const i = this.pages.indexOf(page);
    if (i >= 0) {
      page.destroy();
      this.pages.splice(i, 1);
      if (this.currentPage === page) {
        this.setCurrentPage(this.getPage(0));
      }
    }
    this.emitter.emit('pageschange', this.pages);
  }

  /**
   * 插入页面, 用于排序
   *
   * @param {Page} page
   * @param {int} index
   */
  insertPage(page: Page, index: number) {
    const i = this.pages.indexOf(page);

    if (i >= 0) {
      this.pages.splice(i, 1);
      this.pages.splice(index > i ? (index - 1) : index, 0, page);
      this.emitter.emit('pageschange', this.pages);
    }
  }

  sortPages(pages: Page[]) {
    this.pages = pages;
    this.emitter.emit('pageschange', this.pages);
  }

  /**
   * 获取所有页面
   *
   * @returns {Page[]}
   */
  getPages() {
    return this.pages;
  }

  /**
   * 设置当前页面
   *
   * @param {Page} page
   */
  setCurrentPage(page: Page) {
    if (page === this.currentPage) {
      return;
    }
    StyleSheet.clear();
    Exchange.purge();
    if (this.currentPage) {
      this.currentPage.setVisible(false);
    }
    if (page && this.pages.indexOf(page) < 0) {
      page = null;
    }
    if (page) {
      this.currentPage = page;
      page.setVisible(true);
    }
    this.emitter.emit('currentpagechange', this.currentPage);
  }

  /**
   * 获取当前页面
   *
   * @returns {Page|null}
   */
  getCurrentPage() {
    return this.currentPage;
  }

  onPagesChange(func: (pages: Page[]) => any) {
    this.emitter.on('pageschange', func);
    return () => {
      this.emitter.removeListener('pageschange', func);
    };
  }

  onCurrentPageChange(func: (page: Page) => any) {
    this.emitter.on('currentpagechange', func);
    return () => {
      this.emitter.removeListener('currentpagechange', func);
    };
  }
}
