import * as React from 'react';
import Core from '../../core/index';
import panes from '../../core/panes';
import ActionPane from './actionpane';
import DockPane, { getCachedSize } from './dockpane';
import TabPane from './tabpane';
import WorkspacePane from './workspacepane';
import Toolbar from './toolbar';

import './index.less';

const { dockPane } = panes;

class Panes extends React.Component {
  public resizeTimer: any;
  public state: {
    style: object;
  };
  public styleCache: object;

  constructor(props: any) {
    super(props);
    this.state = {
      style: {},
    };
  }

  public getDockSize(dock: any) {
    const dockSize = getCachedSize(dock.getName());
    return dockSize || {
      height: dock.getHeight(),
      width: dock.getWidth(),
    };
  }

  public setStyle(position: string, size: any) {
    if (position === 'default') {
      this.resetStyle();
      return;
    }

    let style;
    if (position === 'bottom') {
      style = {
        bottom: size.height,
      };
    } else if (position === 'top') {
      style = {
        top: size.height,
      };
    } else if (position === 'left') {
      style = {
        left: size.width,
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

  public resetStyle() {
    this.setState({
      style: {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
      },
    });
  }

  public componentDidMount() {
    dockPane.onDockShow((dock) => {
      const position = dock.getCurrentPosition();
      this.setStyle(position, this.getDockSize(dock));
    });

    dockPane.onDockHide((dock) => {
      this.resetStyle();
    });

    Core.Bus.on('ve.dockpane.resize', (dock, size) => {
      if (this.resizeTimer) {
        window.clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = window.setTimeout(() => {
        const position = dock.getCurrentPosition();
        this.setStyle(position, size);
      }, 100);
    });

    Core.Viewport.onPreview(() => {
      const isPreview = Core.Viewport.isPreview();
      if (isPreview) {
        this.styleCache = {...this.state.style};
        this.resetStyle();
      } else {
        this.setState({
          style: this.styleCache,
        });
      }
    });

    Core.Viewport.onSlateFixedChange((flag: boolean) => {
      if (flag) {
        dockPane.activeDock(null);
      }
    });
  }

  public render() {
    const { style } = this.state;
    return (
    <div className='engine-panes' style={style}>
      <DockPane />
      <ActionPane />
      <Toolbar />
      <WorkspacePane />
      <TabPane />
    </div>);
  }
}

export default Panes;
