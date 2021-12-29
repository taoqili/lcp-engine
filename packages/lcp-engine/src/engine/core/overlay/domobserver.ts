import { get } from 'lodash';

const SUPPORT_MUTATION_OBSERVER = !!get(window, 'MutationObserver', null);

class DOMObserver {

  public observer: MutationObserver;
  public lastNativeNode: any;

  constructor(sync: MutationCallback) {
    this.observer = SUPPORT_MUTATION_OBSERVER
      ? new MutationObserver(sync) : null;
  }

  public observe(node: any) {
    if (!this.observer) { return; }
    if (!node) {
      this.stop();
      return;
    }
    const nativeNode = node.getDOMNode();
    if (nativeNode === this.lastNativeNode) {
      return;
    }
    if (nativeNode) {
      this.observer.observe(nativeNode, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      this.lastNativeNode = nativeNode;
    } else {
      this.stop();
    }
  }

  public stop() {
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    this.lastNativeNode = null;
  }
}

export default DOMObserver;
