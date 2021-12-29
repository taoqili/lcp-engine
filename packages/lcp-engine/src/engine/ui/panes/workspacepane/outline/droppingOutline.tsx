import * as React from 'react';

import OverlayCore from '../../../../core/overlay';

export default class DroppingOutline extends React.Component {

  public droppingLine: any;
  public willDetach: () => any;

  public componentWillMount() {
    this.droppingLine = OverlayCore.getDroppingLine();
    this.willDetach = this.droppingLine.onSync(() => this.forceUpdate());
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach();
    }
  }

  public render() {
    if (!this.droppingLine.hasOutline()) {
      return null;
    }

    const node = this.droppingLine.getCurrentNode();
    const rect = node.getRect();
    const page = node.getPage();
    const bounds = page.getBounds();
    const st = page.getScrollTop();

    if (!rect || !bounds) {
      return null;
    }

    return (
    <div
      className='engine-outline engine-dropping-outline' style={{
        height: rect.height,
        transform: `translate(${rect.left - bounds.left}px, ${rect.top + st - bounds.top}px)`,
        width: rect.width,
      }}
    />);
  }
}
