import * as EventEmitter from 'events';
import * as React from 'react';

class Sync {
  public emitter: EventEmitter;
  public wrapper: Element;
  public ghost: Element;

  constructor() {
    this.emitter = new EventEmitter();
  }

  public init(wrapper: Element) {
    this.wrapper = wrapper;
  }

  public touch() {
    this.emitter.emit('sync', this.getRect());
  }

  public getRect() {
    if (!this.ghost || !this.wrapper) {
      return null;
    }
    const rect = this.ghost.getBoundingClientRect();
    const bounds = this.wrapper.getBoundingClientRect();
    return {
      left: rect.left - bounds.left,
      top: rect.top - bounds.top,
      width: rect.width,
    };
  }

  public setGhost(ghost: Element) {
    this.ghost = ghost;
    this.touch();
  }

  public onSync(func: () => any) {
    this.emitter.on('sync', func);
    return () => {
      this.emitter.removeListener('sync', func);
    };
  }
}

export const InsertionSync = new Sync();

export class Insertion extends React.Component {

  public willDetach: () => any;

  public componentWillMount() {
    this.willDetach = InsertionSync.onSync(() => this.forceUpdate());
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
    const rect = InsertionSync.getRect();
    if (!rect) {
      return null;
    }
    return (<div
      className='engine-insertion'
      style={{
        transform: `translate(${rect.left}px, ${rect.top}px)`,
        width: rect.width,
      }}
    />);
  }
}

export class InsertionGhost extends React.Component {

  public shell: Element;

  public componentDidMount() {
    InsertionSync.setGhost(this.shell);
  }

  public componentDidUpdate() {
    InsertionSync.touch();
  }

  public componentWillUnmount() {
    InsertionSync.setGhost(null);
  }

  public render() {
    return (
      <div
        ref={(ref) => { this.shell = ref; }}
        className='engine-insertion-ghost'
      />
    );
  }
}
