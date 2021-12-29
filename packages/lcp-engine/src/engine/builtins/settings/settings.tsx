import * as Icons from '@ali/ve-icons';
import * as React from 'react';

import { VE_EVENTS } from '../../core/base/const';
import Bus from '../../core/bus';
import Env from '../../core/env';
import Exchange from '../../core/exchange';
import Navigator from './navigator';
import flags from '../../core/flags';

import { Node } from '../../core/pages/node';
import { Stage } from '../../ui/fields';

type OffBinding = () => any;

interface ISettingsState {
  hasError: boolean;
};

export default class Settings extends React.Component<{}, ISettingsState> {

  public static getDerivedStateFromError(error: Error) {
    return { hasError: error, error };
  }
  public selected: Node;
  public willDetach: OffBinding[];
  public bus: Bus;
  public shell: Element;
  public state: ISettingsState = {
    hasError: false,
  };

  public componentWillMount() {
    let detachListeners: OffBinding[];
    this.bus = new Bus();
    const detach = () => {
      if (detachListeners) {
        detachListeners.forEach((off: () => any) => off());
        detachListeners = [];
      }
    };

    const attach = () => {
      detach();
      this.selected = Exchange.getSelected();
      if (this.selected) {
        detachListeners = [this.selected.onStatusChange((status: string, field: any) => {
          if (field === 'pseudo') {
            this.forceUpdate();
          }
        })];
        const props = this.selected.getProps();
        if (props) {
          detachListeners.push(props.onPropsChange(() => this.forceUpdate()));
          detachListeners.push(props.onStageChange(() => this.forceUpdate()));
        }
      }
    };

    attach();

    this.willDetach = [
      detach,
      Exchange.onSelectedChange(() => {
        attach();
        this.forceUpdate();
      }),
      Env.onEnvChange((envs, name) => {
        if (name === 'locale') {
          this.forceUpdate();
        }
      }),
      this.bus.on(VE_EVENTS.VE_NODE_PROPS_REPLACE, () => {
        this.forceUpdate();
      }),
      this.bus.on(VE_EVENTS.VE_NODE_CREATED, () => {
        this.forceUpdate();
      }),
      this.bus.on(VE_EVENTS.VE_NODE_DESTROY, () => {
        this.forceUpdate();
      }),
    ];
  }

  public componentDidMount() {
    const pane = this.shell;

    function getTarget(node: any): any {
      if (!pane.contains(node) || (node.nodeName === 'A' && node.getAttribute('href'))) {
        return null;
      }

      const target = node.dataset ? node.dataset.stageTarget : null;
      if (target) {
        return target;
      }
      return getTarget(node.parentNode);
    }

    if (pane && pane.contains) {
      const click = (e: MouseEvent) => {
        const target = getTarget(e.target);
        if (!target || !this.selected) {
          return;
        }

        const props = this.selected.getProps();
        if (props) {
          if (target === 'stageback') {
            props.stageBack();
          } else {
            props.stagePush(target);
          }
        }
      };

      pane.addEventListener('click', click, false);
      this.willDetach.push(() => pane.removeEventListener('click', click, false));
    }
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off) => off());
    }
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error);
    console.warn(info, info.componentStack);
  }

  public render() {
    const selected = this.selected;
    let content = null;
    let contentRefer = null;
    if (this.state.hasError) {
      return (
        <div>Setting Pane rendering error, open console to check.</div>
      );
    }
    if (selected) {
      const props = selected.getProps();
      if (props) {
        const stage = props.getCurrentStage();
        const refer = stage.getRefer();

        if (refer) {
          content = <Stage key={stage.getId()} stage={stage} direction={refer.direction} current />;
          contentRefer = (
            <Stage
              key={refer.stage.getId()}
              stage={refer.stage}
              direction={refer.direction}
            />
          );
        } else {
          content = (
            <Stage
              key={stage.getId()}
              stage={stage}
              current
            />
          );
        }
      }
    } else {
      content = (<div className='engine-nonselected-notice'>
        {Icons.getIcon('selection')}
        <p>请在左侧画布选中节点</p>
      </div>);
    }

    return (
    <div ref={(ref) => { this.shell = ref; }} className='engine-settings'>
      {flags.has('hide-navigator') ? null : <Navigator />}
      <div className='engine-settings-content'>
        {content}
        {contentRefer}
      </div>
    </div>);
  }
}
