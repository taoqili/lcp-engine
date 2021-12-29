import * as React from 'react';
import panes from '../../core/panes';

import './toolbar.less';

const { toolbar } = panes;

export default class Toolbar extends React.Component {
  willDetach: () => any;

  componentWillMount() {
    this.willDetach = toolbar.onContentsChange(() => this.forceUpdate());
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach();
    }
  }

  render() {
    return (
    <div className="engine-toolbar">{toolbar.contents}</div>
    );
  }
}
