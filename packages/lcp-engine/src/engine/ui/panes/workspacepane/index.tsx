import * as React from 'react';
import Core from '../../../core/index';
import Simulator from './simulator';
import Widgets from './widgets';

import './index.less';

export default class WorkspacePane extends React.Component {
  public resizeTimer: any;
  public state: {
    style: object;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      style: {},
    };
  }

  componentDidMount() {
    Core.Viewport.onSlateFixedChange((flag: boolean) => {
      if (!flag) {
        return;
      }
      Core.Bus.on('ve.dockpane.resize', (dock, size) => {
        if (this.resizeTimer) {
          window.clearTimeout(this.resizeTimer);
        }
        this.resizeTimer = window.setTimeout(() => {
          const position = dock.getCurrentPosition();
          this.setStyle(position, size);
        }, 100);
      });
    });
  }

  public setStyle(position: string, size: any) {
    let style;
    if (position === 'bottom') {
      style = {
        bottom: size.height,
      };
    } else if (position === 'top') {
      style = {
        top: size.height,
      };
    } else if (position === 'left' || position === 'default') {
      style = {
        left: 48 + size.width,
      };
    } else if (position === 'right') {
      style = {
        right: size.width,
      };
    }
    this.setState({
      style,
    });
  }

  public render() {
    const { style } = this.state;
    return (
      <div className='engine-pane engine-workspacepane' style={style}>
        <Simulator />
        <Widgets />
      </div>
    );
  }
}
