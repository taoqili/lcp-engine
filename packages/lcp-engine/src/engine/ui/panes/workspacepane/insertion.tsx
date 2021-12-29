import * as React from 'react';

import OverlayCore from '../../../core/overlay';

export default class Insertion extends React.Component {

  public droppingLine: any;
  public insertionGhost: any;
  public willDetach: any;

  public componentWillMount() {
    this.droppingLine = OverlayCore.getDroppingLine();
    this.insertionGhost = OverlayCore.getInsertionGhost();
    this.willDetach = [
      this.droppingLine.onSync(() => this.forceUpdate()),
      this.insertionGhost.onSync(() => this.forceUpdate()),
    ];
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off: () => any) => off());
    }
  }

  public render() {
    if (!this.droppingLine.hasOutline()) {
      return null;
    }

    const node = this.droppingLine.getCurrentNode();
    const page = node.getPage();
    const st = page.getScrollTop();
    const bounds = page.getBounds();

    let rect;
    let style;
    let className = 'engine-insertion';

    const ghost = this.insertionGhost.getGhost();
    const insertion = node.getStatus('dropping');

    if (ghost) {
      rect = ghost.getBoundingClientRect();
      style = {
        transform: `translate(${rect.left - bounds.left}px, ${st + rect.top - bounds.top}px)`,
        width: rect.width,
      };
    } else if (insertion && insertion.getIndex() !== null) {
      const isAfter = insertion.isNearAfter();
      rect = insertion.getNearRect() || node.getRect();

      if (!!rect && !!bounds && insertion.isVertical()) {
        style = {
          height: rect.height,
          transform: `translate(${(isAfter ? rect.right : rect.left) - bounds.left}px,\
           ${st + rect.top - bounds.top}px)`,
        };
        className += ' engine-vertical';
      } else if (rect && bounds) {
        style = {
          transform: `translate(${rect.left - bounds.left}px,\
           ${st + (isAfter ? rect.bottom : rect.top) - bounds.top}px)`,
          width: rect.width,
        };
      }
    }
    return <div className={className} style={style} />;
  }
}
