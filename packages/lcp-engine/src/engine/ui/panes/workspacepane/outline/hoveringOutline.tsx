import * as React from 'react';

import Context from '../../../../context';
import { VE_EVENTS, VE_HOOKS } from '../../../../core/base/const';
import Bus from '../../../../core/bus';
import DragEngine from '../../../../core/dragengine';
import Exchange from '../../../../core/exchange';
import OverlayCore from '../../../../core/overlay';

const context = new Context();
const Icons = require('@ali/ve-icons');

export function getComputedActionSpace(rect: any, bounds: any, isSpaceEnough: boolean) {
  let h = 'top';
  let v = 'right';
  if (rect.left - bounds.left < 60 && rect.width < 200) {
    v = 'left';
  }
  if (rect.top < 70) {
    h = 'bottom';
  }
  return `${h}-${v}`;
}

export function removeNode(node: any, from: string, bus: Bus) {
  const removeHelper: (node: any) => Promise<boolean>
    = context.getPlugin(VE_HOOKS.VE_NODE_REMOVE_HELPER);
  if (removeHelper) {
    removeHelper(node).then((isOK = true) => {
      if (isOK) {
        node.remove();
        bus.emit(VE_EVENTS.VE_OVERLAY_ACTION_REMOVE_NODE, { from });
      }
    });
  } else {
    node.remove();
    bus.emit(VE_EVENTS.VE_OVERLAY_ACTION_REMOVE_NODE, { from });
  }
}

export default class HoveringOutline extends React.Component {

  public hoveringLine: any;
  public hoveringCapture: any;
  public willDetach: () => any;
  public willUnbind: () => any;
  public handler: any;
  public bus: Bus;

  public outline: any;

  public componentWillMount() {
    this.hoveringLine = OverlayCore.getHoveringLine();
    this.hoveringCapture = OverlayCore.getHoveringCapture();
    this.willDetach = this.hoveringLine.onSync(() => this.forceUpdate());
    this.bus = new Bus();
  }

  public componentDidMount() {
    this.hoveringCapture.setBoundary(this.outline);
    this.willBind();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidUpdate() {
    this.hoveringCapture.setBoundary(this.outline);
    this.willBind();
  }

  public componentWillUnmount() {
    this.hoveringCapture.setBoundary(null);
    if (this.willDetach) {
      this.willDetach();
    }
    if (this.willUnbind) {
      this.willUnbind();
    }
  }

  public willBind() {
    if (this.willUnbind) {
      this.willUnbind();
    }

    const handler = this.handler;

    if (!handler) { return; }

    const node = this.hoveringLine.getCurrentNode();

    let downEvent: any;
    const dragOff = DragEngine.from(handler, (e) => {
      downEvent = e;
      return node;
    });
    const select = () => {
      if (downEvent && downEvent.shaked) { return; }
      Exchange.select(node);
    };
    handler.addEventListener('click', select, false);
    this.willUnbind = () => {
      handler.removeEventListener('click', select, false);
      dragOff();
      this.willUnbind = null;
    };
  }

  public render() {
    if (!this.hoveringLine.hasOutline()) {
      return null;
    }

    const node = this.hoveringLine.getCurrentNode();
    const page = node.getPage();
    const bounds = page.getBounds();
    const st = page.getScrollTop();
    const rect = node.getRect();
    const canDragging = node.canDragging();

    if (!rect || !bounds) {
      return null;
    }

    const isSpaceEnough = rect.height > 30 && rect.width > 60;
    const showHandler = isSpaceEnough && canDragging
      && (canDragging === 'handler' || DragEngine.isUseHandler());
    const showActions = node.canOperating();
    const actionSpace = getComputedActionSpace(rect, bounds, isSpaceEnough);

    return (<div
      ref={(ref) => { this.outline = ref; }}
      className='engine-outline engine-hovering-outline' style={{
        height: rect.height,
        transform: `translate(${rect.left - bounds.left}px, ${rect.top + st - bounds.top}px)`,
        width: rect.width,
      }}
    >
      {showHandler &&
        <div
          ref={(ref) => { this.handler = ref; }}
          className='engine-draghandler'
        >
          <Icons name='drag-handler' />
        </div>
      }
    </div>);
  }
}
