import * as Icons from '@ali/ve-icons';
import * as React from 'react';
import DragEngine from '../core/dragengine';

import './ghost.less';

type offBinding = () => any;

export default class Ghost extends React.Component {
  public dragment: any;
  public willDetach: offBinding[];

  public x: number;
  public y: number;

  public componentWillMount() {
    this.dragment = null;
    this.x = 0;
    this.y = 0;

    this.willDetach = [
      DragEngine.onDragstart((e, dragment) => {
        this.dragment = dragment;
        this.x = e.clientX;
        this.y = e.clientY;
        this.forceUpdate();
      }),
      DragEngine.onDrag((e) => {
        this.x = e.clientX;
        this.y = e.clientY;
        this.forceUpdate();
      }),
      DragEngine.onDragend(() => {
        this.dragment = null;
        this.x = 0;
        this.y = 0;
        this.forceUpdate();
      }),
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
    if (!this.dragment) {
      return null;
    }

    return (
      <div
        className='engine-ghost' style={{
          transform: `translate(${this.x}px, ${this.y}px)`,
        }}
      >
        <Icons className='engine-ghost-icon' name={this.dragment.getIcon()} />
        <div className='engine-ghost-title'>{this.dragment.getTitle()}</div>
      </div>
    );
  }
}
