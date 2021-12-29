import Env from '../env';
import { Node } from '../pages/node';
import { Page } from '../pages/page';
import './InPlaceEditing.less';

const I18nUtil = require('@ali/ve-i18n-util');
const EDITOR_KEY = 'data-setter-prop';
const TIME_DELAY = 300;

function getPropName(ele: HTMLElement, root: HTMLElement): string {
  let propName = ele.getAttribute(EDITOR_KEY);
  let parent: HTMLElement = ele.parentElement;
  while (parent && parent !== root) {
    if (!propName) {
      propName = parent.getAttribute(EDITOR_KEY);
    }
    parent = parent.parentElement;
  }
  return propName;
}

const isI18nRecord = (value: any) => value && value.type === 'i18n' && value.key;
const isI18nSingleValue = (value: any) => value && value.type === 'i18n' && value.use;

export default class InPlaceEditing {

  /**
   * indicator if it's running
   */
  private boosted: boolean;

  /**
   * the last time clicked, to simulate dblclick
   */
  private clickTime: number;
  /**
   * the last one clicked, to prevent clicking two elements
   * and then editing
   */
  private preId: string;
  private willStop: Array<() => void> = [];

  public start(root: HTMLElement, page: Page) {
    if (this.boosted) {
      return;
    }
    const onMouseDown = (e: MouseEvent) => {
      const currentTime = new Date().getTime();
      const ele = e.target as HTMLElement;
      const propName = getPropName(ele, root);
      if (propName) {
        const node = page.getNodeFromPoint(e);
        if (currentTime - this.clickTime < TIME_DELAY
            && this.preId === node.id
            && node.canOperating()) {
          if (node) {
            node.setInPlaceEdit(true);
          }
          ele.setAttribute('contenteditable', 'true');
        }
        this.preId = node.id;
      }
      this.clickTime = currentTime;
    };
    const onFocusOut = (e: Event) => {
      const ele = e.target as HTMLElement;
      const propName = getPropName(ele, root);
      if (propName) {
        const node = page.getNodeFromPoint(e);
        if (node && node.canOperating()) {
          ele.removeAttribute('contenteditable');
          const { innerText } = ele;
          node.setInPlaceEdit(false);
          try {
            const setterName = node.getProp(propName).getSetter().type.displayName;
            if (setterName === 'I18nSetter') {
              this.changeI18nValue(node, propName, innerText);
            } else {
              node.getProp(propName).setHotValue(innerText);
            }
            return;
          } catch (e) {
            throw new Error(e.message);
          }
        }
      }
      this.clickTime = 0;
    };
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('focusout', onFocusOut);
    this.willStop = [
      () => {
        root.removeEventListener('mousedown', onMouseDown);
        root.removeEventListener('focusout', onFocusOut);
      },
    ];
  }
  public stop() {
    this.willStop.forEach((func) => func());
  }
  /**
   * i18n setting change
   */
  private changeI18nValue(node: Node, propName: string, val: string) {
    const locale = Env.getLocale();
    const advancedMode = Env && Env.supports && Env.supports('i18nPane');
    const hotValue = node.getProp(propName).getHotValue();
    if (isI18nRecord(hotValue) && advancedMode) {
      I18nUtil.update(hotValue.key, val, locale);
    } else if (isI18nSingleValue(hotValue)) {
      node.getProp(propName).setHotValue({ ...hotValue, [hotValue.use]: val });
    } else {
      node.getProp(propName).setHotValue({ ...hotValue, [locale]: val });
    }
  }
}
