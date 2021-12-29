import * as classnames from 'classnames';
import * as React from 'react';
import Core from '../../core/index';
import panes from '../../core/panes';
import DockCore from '../../core/panes/dockCore';
import Flags from '../../core/flags';
import './dockpane.less';
import flags from '../../core/flags';

const { Button, Tip } = require('@ali/ve-icons');
const DraggableLine = require('@ali/ve-draggable-line');
const { dockPane } = panes;

export function getCachedSize(dockPaneName: string) {
  const sizeStr = window.localStorage && window.localStorage.getItem(`__ve.dockpane.${dockPaneName}.size__`);
  if (!sizeStr) {
    return null;
  }
  try {
    return JSON.parse(sizeStr);
  } catch (e) {
    return null;
  }
}

function setSizeCache(dockPaneName: string, size: object) {
  if (window.localStorage) {
    window.localStorage.setItem(`__ve.dockpane.${dockPaneName}.size__`, JSON.stringify(size));
  }
}

interface ISlateProps {
  dock?: DockCore;
}

class Slate extends React.Component {
  public willDetach: Array<() => void>;
  public cachedSize: {
    width: number,
    height: number,
  };
  public state: {
    width: number;
    height: number;
  };

  public props: ISlateProps;

  constructor(props: ISlateProps) {
    super(props);
    const dock = props.dock;
    this.cachedSize = getCachedSize(dock.getName()) || {
      height: dock.getHeight(),
      width: dock.getWidth(),
    };
    this.state = {
      height: this.cachedSize.height,
      width: this.cachedSize.width,
    };
  }

  public componentWillMount() {
    const { dock } = this.props;
    this.willDetach = [
      this.props.dock.onContentsChange(() => this.forceUpdate()),
      this.props.dock.onPositonChange(() => {
        const { width, height } = this.state;
        Core.Bus.emit('ve.dockpane.resize', dock, {
          height, width,
        });
        this.forceUpdate();
      }),
    ];
    // const { height, width } = this.state;
    // Core.Bus.emit('ve.dockpane.resize', dock, {
    //   height, width,
    // });
  }

  public componentWillUnmount() {
    if (this.willDetach.length > 0) {
      this.willDetach.forEach((item) => item());
    }
  }

  public onDrag(value: number) {
    const { dock } = this.props;
    const position = dock.getCurrentPosition();
    let { width, height } = this.state;
    if (position === 'bottom' || position === 'top') {
      height = this.cachedSize.height + value;
    } else {
      width = this.cachedSize.width + value;
    }
    this.setState({
      height,
      width,
    });
    setSizeCache(dock.getName(), {
      height,
      width,
    });
    Core.Bus.emit('ve.dockpane.resize', dock, {
      height,
      width,
    });
  }

  public renderHelpTip(index: number) {
    const dock = this.props.dock;
    let tip = dock.getTip();
    if (!tip && dock.getContents) {
      tip = dock.getContents()[index].tip;
    }
    if (tip === null || typeof tip !== 'object') { return ''; }
    return (
      <div className='engine-slate-title-help-tip'>
        <Tip
          className='doubt'
          size='small'
          url={tip.url}
          position='top'
        >
          <span>{tip.content}</span>
        </Tip>
      </div>
    );
  }

  public render() {
    const dock = this.props.dock;
    if (!dock.isActive() && !dock.isInitialize()) {
      return null;
    }
    const position = dock.getCurrentPosition();
    const titles = dock.getTitles();
    const { width, height } = this.state;
    const style = {
      height: position === 'bottom' || position === 'top' ? height : '',
      width: position === 'bottom' || position === 'top' ? '100%' : width,
    };
    const isFixed = flags.has('slate-fixed');
    if (isFixed) {
      style.width = 320;
    }

    const positionClass = position === 'left' || position === 'default' ? 'show' : '';
    return (<div className={classnames('engine-slate', `engine-slate-${position}`)} style={style}>
      {dock.showTitleBar() && <div className='engine-slate-header'>
        <div className={`engine-slate-tabs${titles.length > 1 ? ' engine-multi-tabs' : ''}`}>{
          titles.map((title, index) => <div
            key={index}
            className={
              `engine-slate-title${index === dock.getCurrentIndex() ? ' engine-active' : ''}`}
            onClick={() => dock.activeIndex(index)}
          >
            <div className='engine-slate-title-wrap'>
              <div>{title}</div>
              {this.renderHelpTip(index)}
            </div>
          </div>)
        }</div>
        {isFixed ? null : <Button
          className='engine-slate-close'
          size='12px' name='close' onClick={() => dockPane.activeDock(null)}
        />}
      </div>}
      <div className='engine-slate-content'>{dock.getContent()}</div>
      {isFixed ? null : <>
        <DraggableLine
          position='top'
          className={classnames('engine-slate-draggable-line-top', position === 'bottom' ? 'show' : '')}
          onDrag={this.onDrag.bind(this)}
          maxIncrement={dock.getMaxHeight() - this.cachedSize.height}
          maxDecrement={this.cachedSize.height - dock.getHeight()}
        />
        <DraggableLine
          position='bottom'
          className={classnames('engine-slate-draggable-line-bottom', position === 'top' ? 'show' : '')}
          onDrag={this.onDrag.bind(this)}
          maxIncrement={dock.getMaxHeight() - this.cachedSize.height}
          maxDecrement={this.cachedSize.height - dock.getHeight()}
        />
        <DraggableLine
          position='left'
          className={classnames('engine-slate-draggable-line-left', position === 'right' ? 'show' : '')}
          onDrag={this.onDrag.bind(this)}
          maxIncrement={dock.getMaxWidth() - this.cachedSize.width}
          maxDecrement={this.cachedSize.width - dock.getWidth()}
        />
        <DraggableLine
          position='right'
          className={classnames('engine-slate-draggable-line-right', positionClass)}
          onDrag={this.onDrag.bind(this)}
          maxIncrement={dock.getMaxWidth() - this.cachedSize.width}
          maxDecrement={this.cachedSize.width - dock.getWidth()}
        />
      </>}
    </div>);
  }
}

class Dock extends React.Component {

  public props: ISlateProps;

  public willDetach: () => any;

  public componentWillMount() {
    this.willDetach = this.props.dock.onActiveChange(() => {
      this.forceUpdate();
    });
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
    const dock = this.props.dock;

    return (<div className='engine-dock'>
      <div className={`engine-docktray${dock.isActive() ? ' engine-active' : ''}`}>
        <div
          className='engine-dock-menu'
          data-tip={dock.getDescription()}
          data-dir='right'
          onClick={() => {
            // 如果只是动作，直接 return 掉。
            if (dock.isAction()) {
              return;
            }
            if (dock.isActive()) {
              dockPane.activeDock(null);
            } else {
              dockPane.activeDock(dock);
            }
            if (dock.config.fullScreen) {
              Flags.setSlateFullMode(dock.isActive());
            } else {
              Flags.setSlateFullMode(false);
            }
          }}
        >
          {dock.getMenu()}
        </div>
        <Slate dock={dock} />
      </div>
    </div>);
  }
}

class Docks extends React.Component {

  public willDetach: () => any;

  public componentWillMount() {
    this.willDetach = dockPane.onDocksChange(() => {
      this.forceUpdate();
    });
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
    const topPanes: any = [];
    const bottomPanes: any = [];
    const docks = dockPane.getDocks().forEach(
      (dock) => {
        if (dock.getPlace() === 'top') {
          topPanes.push(<Dock key={`dock-${dock.getName()}`} dock={dock} />);
        } else if (dock.getPlace() === 'bottom') {
          bottomPanes.push(<Dock key={`dock-${dock.getName()}`} dock={dock} />);
        }

      },
    );
    return <div className='engine-dockpane-docks'>
      <div className='engine-dockpane-docks-top'>{topPanes}</div>
      <div className='engine-dockpane-docks-bottom'>{bottomPanes}</div>
    </div>;
  }
}

export default class DockPane extends React.Component {
  public render() {
    return (
      <div className='engine-pane engine-dockpane'>
        <Docks />
      </div>
    );
  }
}
