import * as React from 'react';

import Bus from '../../../../core/bus';
import DragResizeEngine from '../../../../core/dragResizeEngine';
import OverlayCore from '../../../../core/overlay';

export default class ResizeOutline extends React.Component {
  private hoveringLine: any;
  private hoveringCapture: any;
  private willDetach: () => any;
  private willUnbind: () => any;
  private handler: any;
  private bus: Bus;

  private outline: any;
  private outlineRight: any;
  private outlineLeft: any;

  public componentWillMount() {
    this.hoveringLine = OverlayCore.getHoveringLine();
    this.hoveringCapture = OverlayCore.getHoveringCapture();
    this.willDetach = this.hoveringLine.onSync(() => this.forceUpdate());
    this.bus = new Bus();
  }

  public componentDidMount() {
    this.hoveringCapture.setBoundary(this.outline);
    this.willBind();

    const resize = (e: MouseEvent, direction: string, node: any, moveX: number, moveY: number) => {
      const proto = node.getPrototype();
      if (proto && proto.options && typeof proto.options.onResize === 'function') {
        proto.options.onResize(e, direction, node, moveX, moveY);
      }
    };

    const resizeStart = (e: MouseEvent, direction: string, node: any) => {
      const proto = node.getPrototype();
      if (proto && proto.options && typeof proto.options.onResizeStart === 'function') {
        proto.options.onResizeStart(e, direction, node);
      }
    };

    const resizeEnd = (e: MouseEvent, direction: string, node: any) => {
      const proto = node.getPrototype();
      if (proto && proto.options && typeof proto.options.onResizeEnd === 'function') {
        proto.options.onResizeEnd(e, direction, node);
      }
    };

    DragResizeEngine.onResize(resize);
    DragResizeEngine.onResizeStart(resizeStart);
    DragResizeEngine.onResizeEnd(resizeEnd);
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

    if (!this.outlineRight && !this.outlineLeft) {
      return;
    }

    const unBind: any[] = [];
    unBind.push(DragResizeEngine.from(this.outlineRight, 'e', () => {
      if (!this.hoveringLine.hasOutline()) {
        return null;
      }
      return this.hoveringLine.getCurrentNode();
    }));
    unBind.push(DragResizeEngine.from(this.outlineLeft, 'w', () => {
      if (!this.hoveringLine.hasOutline()) {
        return null;
      }
      return this.hoveringLine.getCurrentNode();
    }));

    this.willUnbind = () => {
      if (unBind && unBind.length > 0) {
        unBind.forEach((item) => {
          item();
        });
      }
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

    if (!rect || !bounds) {
      return null;
    }

    const proto = node.getPrototype();
    let triggerVisible: any = {};
    if (proto && proto.options && typeof proto.options.canResizing === 'boolean') {
      triggerVisible = {
        e: proto.options.canResizing,
        w: proto.options.canResizing,
        n: proto.options.canResizing,
        s: proto.options.canResizing,
      };
    } else if (proto && proto.options && typeof proto.options.canResizing === 'function') {
      triggerVisible = {
        e: proto.options.canResizing(node, 'e'),
        w: proto.options.canResizing(node, 'w'),
        n: proto.options.canResizing(node, 'n'),
        s: proto.options.canResizing(node, 's'),
      };
    }

    return (
      <div ref={(ref) => { this.outline = ref; }}>
        {
          triggerVisible.w && (
            <div
              ref={(ref) => { this.outlineLeft = ref; }}
              className='engine-outline engine-resize-outline' style={{
                height: rect.height,
                transform: `translate(${rect.left - bounds.left - 10}px, ${rect.top + st - bounds.top}px)`,
                width: 20,
              }}
            />
          )
        }
        {
          triggerVisible.e && (
            <div
              ref={(ref) => { this.outlineRight = ref; }}
              className='engine-outline engine-resize-outline' style={{
                height: rect.height,
                transform: `translate(${rect.left - bounds.left + rect.width - 10}px, ${rect.top + st - bounds.top}px)`,
                width: 20,
              }}
            />
          )
        }
      </div>
    );
  }
}
