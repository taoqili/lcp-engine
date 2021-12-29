import * as React from 'react';
import CopyPaster from '@ali/ve-copy-paster';
import { uniqueId } from '@ali/ve-utils';

import DragEngine from '../../../core/dragengine';
import Viewport from '../../../core/viewport';
import Exchange from '../../../core/exchange';
import Page from './pageWrapper';
import Overlay from './overlay';
import Pages from '../../../core/pages';

import './simulator.less';

type OffBinding = () => any;

class Simulator extends React.Component {
  willDetach: OffBinding[];
  shell: any;
  downEvent: any;
  destroyPage: boolean;

  componentWillMount() {
    this.willDetach = [Pages.onPagesChange(() => {
      this.destroyPage = true;
      this.forceUpdate(() => {
        this.destroyPage = false;
      });
    })];
  }

  componentDidMount() {
    const shell = this.shell;
    Viewport.setFocusTarget(shell);

    const focusin = () => {
      Viewport.setFocus(true);
    };

    const focusout = (e: MouseEvent) => {
      if (e.target
        && shell
        && shell.contains
        && !shell.contains(e.target)) {
        Viewport.setFocus(false);
      }
    };

    shell.addEventListener('click', focusin);
    document.addEventListener('click', focusout);

    this.willDetach.push(() => {
      shell.removeEventListener('click', focusin);
      document.removeEventListener('click', focusout);
    });

    this.willDetach.push(DragEngine.from(shell, (e) => {
      this.downEvent = e;
      const page = Pages.getCurrentPage();
      if (Viewport.isPreview() || DragEngine.isUseHandler() || !page) return false;

      let node = page.getNodeFromPoint(e);
      while (node && !node.canDragging()) {
        node = node.getParent();
      }
      if (!node || node.canDragging() === 'handler' || node.isInPlaceEditing() || node.isLocking()) {
        return false;
      }
      return node;
    }));
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach(off => off());
    }
    Viewport.setFocusTarget(null);
  }

  renderPages() {
    const pages = Pages.getPages() || [];
    return pages.map((page: any) => (
      <Page
        key={this.destroyPage ? uniqueId(null, 'page') : page.getId()}
        page={page}
        onPageClick={(e) => {
          if (Viewport.isPreview() || (this.downEvent && this.downEvent.shaked)) {
            return;
          }
          const node = page.getNodeFromPoint(e);
          Exchange.select(node);
        }}
      />
    ));
  }

  render() {
    const pages = this.renderPages();
    const copyPaster = <CopyPaster />;
    return (
      <div
        ref={(ref: Element) => { this.shell = ref; }}
        className="engine-simulator"
      >
        <Overlay />
        <div className="engine-simulator-screen">
          <div className="engine-pages">
            {pages}
          </div>
          {copyPaster}
        </div>
      </div>
    );
  }
}

export default Simulator;
