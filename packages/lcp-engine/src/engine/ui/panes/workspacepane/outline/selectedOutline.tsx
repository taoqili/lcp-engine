import * as React from 'react';

import { VE_EVENTS } from '../../../../core/base/const';
import Bus from '../../../../core/bus';
import DragEngine from '../../../../core/dragengine';
import Exchange from '../../../../core/exchange';
import OverlayCore from '../../../../core/overlay';
import Viewport from '../../../../core/viewport';
import { getComputedActionSpace, removeNode } from './hoveringOutline';
import OutlineSync from '../../../../core/overlay/outlinesync';
import flags from '../../../../core/flags';
import panes from '../../../../core/panes';

const Icons = require('@ali/ve-icons');

// 获取节点的父级节点（最多获取5层）
const getParentNodes = (node: any) => {
  const parentNodes = [];
  let currentNode = node;
  while (currentNode && parentNodes.length < 5) {
    currentNode = currentNode.getParent();
    if (currentNode && (currentNode.canSelecting() || currentNode.isRoot())) {
      parentNodes.push(currentNode);
    }
  }
  return parentNodes;
};

const getNodeSelectorSpace = (rect: any, bounds: any, parentNodeLength: number) => {
  if (rect.top - bounds.top < (parentNodeLength + 1) * 22) {
    return 'bottom';
  }
  return 'top';
};

export default class SelectedOutline extends React.Component {
  public bus: Bus;
  public selectedLine: OutlineSync;
  public inPlaceEditingPoint: OutlineSync;
  public willDetach: Array<() => any>;
  public willNotDrag: () => any;
  public handler: any;

  public state: { popupVisible: boolean, parentNodes: any[] };

  public constructor(props: any) {
    super(props);
    this.state = {
      parentNodes: [],
      popupVisible: false,
    };
  }

  public componentWillMount() {
    this.bus = new Bus();
    this.selectedLine = OverlayCore.getSelectedLine();
    this.inPlaceEditingPoint = OverlayCore.getInPlaceEditingPoint();
    this.willDetach = [
      this.selectedLine.onSync(() => {
        const node = this.selectedLine.getCurrentNode();
        const parentNodes = getParentNodes(node);
        this.setState({
          parentNodes,
        });
        this.forceUpdate();
      }),
      this.inPlaceEditingPoint.onSync(() => {
        this.forceUpdate();
      }),
    ];
  }

  public componentDidMount() {
    this.willDrag();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidUpdate() {
    this.willDrag();
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((func) => {
        func();
      });
    }
    if (this.willNotDrag) {
      this.willNotDrag();
    }
  }

  public willDrag() {
    if (this.willNotDrag) {
      this.willNotDrag();
    }

    const handler = this.handler;
    if (!handler) { return; }

    const dragOff = DragEngine.from(handler, () => this.selectedLine.getCurrentNode());
    this.willNotDrag = () => {
      dragOff();
      this.willNotDrag = null;
    };
  }

  public switchNode(node: any) {
    Exchange.select(node);
    setTimeout(() => {
      Viewport.setFocus(true);
    });
  }

  public render() {
    if (!this.selectedLine.hasOutline()) {
      return null;
    }

    let { parentNodes } = this.state;
    const node = this.selectedLine.getCurrentNode();
    const page = node.getPage();
    const bounds = page.getBounds();
    const st = page.getScrollTop();
    const rect = node.getRect();
    const canDragging = node.canDragging();

    if (!rect || !bounds) {
      return null;
    }

    const isSpaceEnough = rect.height > 30 && rect.width > 60;
    const isInPlaceEditing = node.isInPlaceEditing();
    const showHandler = !isInPlaceEditing && !node.isLocking() && isSpaceEnough && canDragging
      && (canDragging === 'handler' || DragEngine.isUseHandler());
    const showActions = !isInPlaceEditing && !node.isLocking() && node.canOperating();
    const actionSpace = getComputedActionSpace(rect, bounds, isSpaceEnough);
    const nodeSelectorSpace = getNodeSelectorSpace(rect, bounds, parentNodes.length);
    const showNodeSelector = node.getComponentName() !== 'Root';
    if (nodeSelectorSpace === 'top') {
      parentNodes = parentNodes.reverse();
    }

    return (<div
      className={`engine-outline engine-selected-outline${isInPlaceEditing ? ' in-place-editing' : ''}`} style={{
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
      <div className={`engine-selected-outline-actions-wrapper engine-space-${actionSpace}`}>
        {showNodeSelector && (
          <div className='engine-outline-node-selector'>
            <div className='engine-outline-node-selector-current'>
              <Icons className='node-icon' name={node.getIcon() || 'unknow'} />
              <span className='node-text'>
                {node.getPrototype() && node.getPrototype().getTitle() || node.getComponentName()}
              </span>
              <Icons className='arrow' name='arrow' />
            </div>
            <div className={`engine-outline-node-selector-popup engine-outline-node-selector-popup-${
              nodeSelectorSpace}`}>
              {
                parentNodes.map((item) => (
                  <div key={item.id} className='engine-outline-node-selector-popup-item'>
                    <div className='engine-outline-node-selector-popup-item-inner'
                      onMouseEnter={() => { Exchange.hover(item); }}
                      onClick={this.switchNode.bind(this, item)}>
                      <Icons className='node-icon' name={item.getIcon() || 'unknow'} />
                      <span className='node-text'>
                        {item.getPrototype() && item.getPrototype().getTitle() || item.getComponentName()}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        <div className='engine-outline-actions'>
          {node.getExtraActions().length > 0 && node.getExtraActions()}
          {
            showActions ? (
              <Icons.Button
                data-tip='复制'
                className='engine-action-clone' name='clone' onClick={() => {
                  node.clone();
                  this.bus.emit(
                    VE_EVENTS.VE_OVERLAY_ACTION_CLONE_NODE,
                    { from: 'selecting', node: Exchange.getSelected() },
                  );
                }}
              />) : null
          }
          {
            showActions && node.getPrototype() && node.getPrototype().isModal() ? (<Icons.Button
              data-tip='隐藏'
              className='engine-action-hidden'
              name='hidden'
              onClick={() => {
                node.setStatus('visibility', false);
              }}
            />) : null
          }
          {
            showActions ? (
              <Icons.Button
                data-tip='删除'
                className='engine-action-remove' name='remove' onClick={() => {
                  removeNode(node, 'selecting', this.bus);
                }}
              />
            ) : null
          }
          {
            showActions && flags.has('tabpane-float') &&
            <Icons.Button
              data-tip='设置'
              className='engine-action-setting' name='setting' onClick={() => {
                panes.tabPane.show();
              }}
            />
          }
        </div>
      </div>
    </div>);
  }
}
