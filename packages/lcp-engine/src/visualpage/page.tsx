import React = require('react');
import Env from '../engine/core/env';
import Trunk from '../engine/core/trunk';
import Viewport from '../engine/core/viewport';
import Leaf from './leaf';
import { NativeNodeCache } from './renderUtils';

type offBindingEvents = () => void;

class Page extends React.Component {
  public static getDOMNode = function getDOMNode(id: string) {
    return NativeNodeCache[id];
  };

  public props: {
    page: any;
  };

  private trunk: Trunk;
  private willDetach: offBindingEvents[];

  constructor(props: any) {
    super(props);

    this.trunk = new Trunk();
  }

  public componentWillMount() {
    const page = this.props.page;
    this.willDetach = [
      page.onRefresh(() => {
        if (!page.isVisible()) {
          return;
        }
        this.updatePage();
      }),
      Viewport.onViewportChange(() => {
        if (!page.isVisible()) {
          return;
        }
        this.updatePage();
      }),
      Env.onEnvChange(() => {
        if (!page.isVisible()) {
          return;
        }
        this.updatePage();
      }),
      page.onVisibleChange((flag: string) => {
        if (flag) {
          this.updatePage();
        }
      }),
    ];
  }

  public updatePage() {
    const page = this.props.page;
    page.startRefresh();
    this.forceUpdate(() => {
      page.endRefresh();
    });
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off) => off());
    }
  }

  public render() {
    if (!this.trunk.isReady()) {
      return (<div></div>);
    }
    const leaf = this.props.page.getRoot();
    return React.createElement(Leaf, {
      _componentName: leaf.getComponentName(),
      leaf,
    });
  }
}

export default Page;
