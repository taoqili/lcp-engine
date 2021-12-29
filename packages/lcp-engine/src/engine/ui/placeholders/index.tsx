import lg from '@ali/vu-logger';
import React = require('react');
import Overlay from '../../core/overlay';

import './index.less';

export class UnknownComponent extends React.Component {
  public props: {
    _componentName: string;
  };

  public render() {
    lg.log('ERROR_NO_COMPONENT_VIEW');
    lg.error('Error component information:', this.props);
    return <div className='engine-unknow-component'>组件 {this.props._componentName} 无视图，请打开控制台排查</div>;
  }
}

export class FaultComponent extends React.Component {
  public props: {
    _componentName: string;
  };

  public render() {
    return (
      <div className='engine-fault-component'>组件 {this.props._componentName} 渲染错误，请打开控制台排查</div>
    );
  }
}

export class HiddenComponent extends React.Component {
  public render() {
    return <div className='engine-hidden-component'>在本页面不显示</div>;
  }
}

export class InsertionGhost extends React.Component {
  public ghost: any;

  private willDetach: () => any;

  public componentDidMount() {
    const elem = this.ghost;
    Overlay.getInsertionGhost().mount(elem);
    this.willDetach = () => {
      Overlay.getInsertionGhost().unmount(elem);
    };
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach();
    }
  }

  public render() {
    return (
      <div
        className='engine-insertion-ghost'
        ref={(ref) => { this.ghost = ref; }}
      />
    );
  }
}


export default { FaultComponent, HiddenComponent, UnknownComponent, InsertionGhost };
