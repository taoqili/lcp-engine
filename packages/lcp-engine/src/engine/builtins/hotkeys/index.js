import CopyPaster from '@ali/ve-copy-paster';

import Exchange from '../../core/exchange.ts';
import Viewport from '../../core/viewport.ts';
import Pages from '../../core/pages/index.ts';
import Panes from '../../core/panes';
import flags from '../../core/flags';

const HotKey = require('./hotkey');

function isFormEvent(e) {
  const t = e.target;
  if (!t) return false;

  if (t.form || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) {
    return true;
  }
  if (/write/.test(window.getComputedStyle(t).getPropertyValue('-webkit-user-modify'))) {
    return true;
  }
  return false;
}

function isValidNodeData(data) {
  if (data && data.componentName) {
    return true;
  }
  return false;
}

function getNextForSelect(next, head, parent) {
  if (next) {
    if (!head && next.canSelecting()) {
      return next;
    }

    let ret;

    if (next.isContainer()) {
      ret = getNextForSelect(next.getChild(0));
      if (ret) {
        return ret;
      }
    }

    ret = getNextForSelect(next.nextSibling());
    if (ret) {
      return ret;
    }
  }

  if (parent) {
    return getNextForSelect(parent.nextSibling(), false, parent.getParent());
  }

  return null;
}

function getPrevForSelect(prev, head, parent) {
  if (prev) {
    let ret;
    if (!head && prev.isContainer()) {
      ret = getPrevForSelect(prev.lastChild());
      if (ret) {
        return ret;
      }
    }

    if (!head && prev.canSelecting()) {
      return prev;
    }

    ret = getPrevForSelect(prev.prevSibling());
    if (ret) {
      return ret;
    }
  }

  if (parent) {
    if (parent.canSelecting()) {
      return parent;
    }
    return getPrevForSelect(parent.lastChild(), false, parent.getParent());
  }

  return null;
}

let engineTreePane = null;
function isInEditingArea(e) {
  if (!engineTreePane) {
    engineTreePane = document.querySelector('.engine-tree');
  }
  return Viewport.isFocus() || e.target.contains(engineTreePane);
}

// remove select node
HotKey.bind('backspace', (e) => {
  if (isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }
  e.preventDefault();
  if (Viewport.isPreview()) {
    return;
  }
  const selected = Exchange.getSelected();
  if (!selected || !selected.canOperating()) return;
  selected.remove();
});

// cancel select | cancel edit
HotKey.bind('escape', (e) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }

  e.preventDefault();
  const selected = Exchange.getSelected();
  if (!selected) return;

  if (selected.isLocking()) {
    Exchange.lock(null);
  } else {
    Exchange.select(null);
  }
  // 收起属性面板
  if (flags.has('tabpane-float')) {
    Panes.tabPane.hide();
  }
});

// command + c copy  command + x cut
HotKey.bind(['command+c', 'ctrl+c', 'command+x', 'ctrl+x'], (e, action) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }
  e.preventDefault();

  const selected = Exchange.getSelected();
  if (!selected || !selected.canOperating()) return;
  CopyPaster.setClipboardData(selected.toData(), () => Viewport.returnFocus());
  const cutMode = action.indexOf('x') > 0;
  if (cutMode) {
    const parentNode = selected.getParent();
    parentNode.select();
    selected.remove();
  }
});

// command + v paste
HotKey.bind(['command+v', 'ctrl+v'], (e) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }
  CopyPaster.getClipboardData((data) => {
    Viewport.returnFocus();
    if (isValidNodeData(data)) {
      const selected = Exchange.getSelected();
      if (!selected) return;
      if (!selected.isRoot() && !selected.canOperating()) return;
      const page = selected.getPage();
      const clipboardNode = page.createNode(data);
      if (!clipboardNode) return;
      const place = selected.getSuitablePlace(clipboardNode);
      if (!place) return;
      if (selected.isRoot()) {
        place.container.insert(clipboardNode, place.ref);
      } else {
        place.container.insertAfter(clipboardNode, place.ref);
      }
      if (clipboardNode) {
        Exchange.select(clipboardNode);
      }
    }
  });
});

// command + z undo
HotKey.bind(['command+z', 'ctrl+z'], (e) => {
  if (Viewport.isPreview() || isFormEvent(e)) {
    return;
  }
  e.preventDefault();
  const currentPage = Pages.getCurrentPage();
  if (!currentPage) {
    return;
  }
  currentPage.getHistory().back();
});

// command + shift + z redo
HotKey.bind(['command+y', 'ctrl+y', 'command+shift+z'], (e) => {
  if (Viewport.isPreview() || isFormEvent(e)) {
    return;
  }
  e.preventDefault();
  const currentPage = Pages.getCurrentPage();
  if (!currentPage) {
    return;
  }
  currentPage.getHistory().forward();
});

// sibling selection
HotKey.bind(['left', 'right'], (e, action) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }
  e.preventDefault();
  const selected = Exchange.getSelected();
  if (!selected) return;
  const silbing = action === 'left' ? selected.prevSibling() : selected.nextSibling();
  if (silbing) {
    Exchange.select(silbing);
  }
});

HotKey.bind(['up', 'down'], (e, action) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }

  e.preventDefault();
  const selected = Exchange.getSelected();
  if (!selected) return;
  if (action === 'down') {
    const next = getNextForSelect(selected, true, selected.getParent());
    if (next) {
      Exchange.select(next);
    }
    return;
  }
  if (action === 'up') {
    const prev = getPrevForSelect(selected, true, selected.getParent());
    if (prev) {
      Exchange.select(prev);
    }
  }
});

HotKey.bind(['option+up', 'option+down', 'option+left', 'option+right'], (e, action) => {
  if (Viewport.isPreview() || isFormEvent(e) || !isInEditingArea(e)) {
    return;
  }

  e.preventDefault();
  const selected = Exchange.getSelected();
  if (!selected || !selected.canOperating()) return;

  const parent = selected.getParent();
  if (!parent) return;

  const isPrev = /(up|left)$/.test(action);
  const isTravel = /(up|down)$/.test(action);

  const silbing = isPrev ? selected.prevSibling() : selected.nextSibling();
  if (silbing) {
    if (isTravel && silbing.isContainer()) {
      const place = silbing.getSuitablePlace(selected, null, true);
      if (isPrev) {
        place.container.insertAfter(selected, place.ref);
      } else {
        place.container.insertBefore(selected, place.ref);
      }
    } else if (isPrev) {
      parent.insertBefore(selected, silbing);
    } else {
      parent.insertAfter(selected, silbing);
    }
    Exchange.select(selected);
    return;
  }
  if (isTravel) {
    const place = parent.getSuitablePlace(selected); // upwards
    if (place) {
      if (isPrev) {
        place.container.insertBefore(selected, place.ref);
      } else {
        place.container.insertAfter(selected, place.ref);
      }
      Exchange.select(selected);
    }
  }
});
