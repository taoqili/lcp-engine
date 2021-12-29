import * as Icons from '@ali/ve-icons';
import * as React from 'react';
import Context from '../../context';
import Exchange from '../../core/exchange';
import { Node } from '../../core/pages/node';
import Viewport from '../../core/viewport';

import './navigator.less';

function getSegments(selected: Node) {
  const segments = [selected];
  let limit = 2;
  let segment = selected.getParent();
  while (limit-- > 0 && segment) {
    segments.unshift(segment);
    segment = segment.getParent();
  }
  return segments;
}

class Segment extends React.Component {

  public readonly props: {
    node: Node;
  };

  public render() {
    const node = this.props.node;
    const title = node.getTitle() || 'unknow';
    let tipContent = title;
    const proto = node.getPrototype();
    const packageName = proto && proto.getPackageName();
    if (packageName) {
      tipContent = `${title} | ${packageName}`;
    }
    return (
      <div
        className='engine-navigator-segment'
        onMouseOver={() => Exchange.hover(node)}
        onMouseOut={() => Exchange.hover(null)}
        onClick={() => Exchange.select(node)}
        data-tip={tipContent}
        data-dir='top'
      >
        <a className='engine-segment-title'>
          {title}
        </a>
      </div>
    );
  }
}

type offBindingFn = () => any;

class Navigator extends React.Component {
  protected willDetach: offBindingFn[];

  // an outline instance of class Outline in Overlay
  protected outline: any;
  protected ctx: Context;

  constructor(props: React.Props<{}>) {
    super(props);
    this.ctx = new Context();
  }

  public componentWillMount() {
    this.willDetach = [Exchange.onSelectedChange(() => this.forceUpdate())];
  }

  public componentDidMount() {
    const outline = this.outline;
    const focusin = () => {
      Viewport.setFocus(true);
    };

    const focusout = (e: MouseEvent) => {
      if (!outline || !outline.contains) {
        return;
      }

      if (e.relatedTarget && outline.contains(e.relatedTarget)) {
        Viewport.setFocus(true);
      } else {
        Viewport.setFocus(false);
      }
    };

    outline.addEventListener('focusin', focusin);
    outline.addEventListener('focusout', focusout);

    this.willDetach.push(() => {
      outline.removeEventListener('focusin', focusin);
      outline.removeEventListener('focusout', focusout);
    });
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off) => off());
    }
  }

  public render() {
    const selected = Exchange.getSelected();
    const TreePane = this.ctx.getModule('TreePane');
    const TreeCore = this.ctx.getModule('TreeCore');

    // Icons' declaration file use React v16.0 which is not compatible
    const IconButton: any = Icons.Button;
    const IconSingle: any = Icons;

    let icon;
    let path;
    let treePaneHeader = null;
    let treePane = null;

    if (selected) {
      icon = selected.getIcon() || 'unknow';
      path = getSegments(selected).map((segment) =>
      <Segment key={segment.getId()} node={segment} />);
    } else {
      icon = 'nonselected';
      path = <span className='engine-navigator-nonselected'>未选中</span>;
    }

    if (TreeCore && TreePane) {
      treePaneHeader = (
        <IconButton
          name='outline' className='engine-toggle-tree'
          size='medium'
          data-tip='大纲树'
          onClick={() => TreeCore.toggle()}
        >
          大纲树
        </IconButton>
      );
      treePane = <TreePane />;
    }

    return (
    <div className='engine-navigator'>
      <div className='engine-navigator-path'>
        {treePaneHeader}
        <IconSingle name={icon} className='engine-navigator-icon' size='medium' />
        {path}
      </div>
      <div
        ref={(ref: HTMLDivElement) => { this.outline = ref; }} className='engine-navigator-outline'
        tabIndex={-1}
      >
        {treePane}
      </div>
    </div>);
  }
}

export default Navigator;
