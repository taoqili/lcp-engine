import * as React from 'react';

import Flags from '../../../core/flags';
import Pages from '../../../core/pages';

import Insertion from './insertion';
import DroppingOutline from './outline/droppingOutline';
import HoveringOutline from './outline/hoveringOutline';
import SelectedOutline from './outline/selectedOutline';
import ResizeOutline from './outline/resizeOutline';

import './overlay.less';

type OffBinding = () => any;

class Overlay extends React.Component {

  public willDetach: OffBinding[];
  public page: any;

  public componentWillMount() {
    let pageWillDetach: any = [];
    const detachPage = () => {
      pageWillDetach.forEach((off: () => any) => off());
      pageWillDetach = [];
      this.page = null;
    };
    const attachPage = (page: any) => {
      if (page) {
        pageWillDetach = [
          page.onReady(() => this.forceUpdate()),
          page.onScroll(() => this.forceUpdate()),
        ];
      }
      this.page = page;
    };
    attachPage(Pages.getCurrentPage());
    this.willDetach = [
      detachPage,
      Pages.onCurrentPageChange((page: any) => {
        this.page = page;
        detachPage();
        attachPage(page);

        this.forceUpdate();
      }),
      Flags.onFlagsChange(() => this.forceUpdate()),
    ];
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off) => off());
    }
  }

  public render() {
    if (!this.page || !this.page.isReady()) {
      return <div className='engine-simulator-overlay' />;
    }
    const st = this.page.getScrollTop();
    return (
      <div className='engine-simulator-overlay' style={{ transform: `translateY(${-st}px)` }}>
        <HoveringOutline />
        <SelectedOutline />
        <DroppingOutline />
        <ResizeOutline />
        <Insertion />
      </div>
    );
  }
}

export default Overlay;
