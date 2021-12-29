import * as React from 'react';

import DragEngine from '../../../core/dragengine';
import DragResizeEngine from '../../../core/dragResizeEngine';
import Exchange from '../../../core/exchange';
import Overlay from '../../../core/overlay';
import InPlaceEditing from '../../../core/overlay/InPlaceEditing';
import Viewport from '../../../core/viewport';

import './page.less';

class PageWrapper extends React.Component {
  public props: {
    page: any;
    onPageClick: (e: any) => any;
  };

  public page: any;
  public shell: any;
  public willDetach: any;

  public componentWillMount() {
    this.page = this.props.page;
  }

  public componentDidMount() {
    const shell = this.shell;
    const doc = shell.firstElementChild;
    const page = this.page;

    const scroll = () => {
      if (Viewport.isPreview()) { return; }
      page.scroll();
    };

    const hover = (e: any) => {
      if (Viewport.isPreview()) { return; }
      const node = page.getNodeFromPoint(e);
      Exchange.hover(node);
    };

    const over = (e: any) => {
      if (Viewport.isPreview()) { return; }
      if (page.inScrolling() || DragEngine.inDragging() ||
        DragResizeEngine.isDragResizing()) {
        return;
      }
      hover(e);
    };

    const leave = (e: any) => {
      if (Viewport.isPreview() || DragEngine.inDragging() ||
        DragResizeEngine.isDragResizing()) {
        return;
      }
      if (Overlay.getHoveringCapture().capture(e, hover)) {
        return;
      }
      Exchange.hover(null);
    };

    const click = (e: any) => {
      this.props.onPageClick(e);
    };

    doc.addEventListener('click', click, true);
    doc.addEventListener('scroll', scroll, true);
    doc.addEventListener('mouseover', over, true);
    doc.addEventListener('mouseleave', leave, false);
    doc.addEventListener('mouseup', hover, true);

    const inPlaceEditing = new InPlaceEditing();
    inPlaceEditing.start(doc, page);

    this.willDetach = [
      page.onVisibleChange((visible: boolean) => {
        if (!shell) {
          return;
        }

        if (visible) {
          shell.classList.add('engine-visible');
        } else {
          shell.classList.remove('engine-visible');
        }
      }),
      () => {
        doc.removeEventListener('click', click, true);
        doc.removeEventListener('scroll', scroll, true);
        doc.removeEventListener('mouseover', over, true);
        doc.removeEventListener('mouseleave', leave, false);
        doc.removeEventListener('mouseup', hover, true);
      },
      () => {
        inPlaceEditing.stop();
      },
    ];

    page.mount(doc);
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    this.page.unmount();
    if (this.willDetach) {
      this.willDetach.forEach((off: () => any) => off());
    }
  }

  public render() {
    return (
      <div
        ref={(ref) => { this.shell = ref; }}
        className={`engine-page${this.page.isVisible() ? ' engine-visible' : ''}`}
      >
        <div className='engine-document' id={this.page.getId()} />
      </div>
    );
  }
}

export default PageWrapper;
