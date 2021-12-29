import * as React from 'react';
import panes from '../../../core/panes';

import './widgets.less';

const { widgets } = panes;

export default class Widgets extends React.Component {

  willDetach: () => any;

  componentWillMount() {
    this.willDetach = widgets.onWidgetsChange(() => this.forceUpdate());
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
    const widgetsList = widgets.getWidgets();

    if (!widgetsList || widgetsList.length < 1) return null;

    return (
      <div className="engine-widgets">
      {widgetsList.map(widget =>
          (<div
            className={`engine-widget engine-widget-${widget.getName()}`}
            key={widget.getName()}
          >
            {widget.getContent()}
          </div>)
      )}
      </div>
    );
  }
}
