import * as EventEmitter from 'events';
import Pane, { IPaneConfig } from './pane';
import Widget, { IWidgetPaneConfig } from './widgetsCore';

class Widgets {

  emitter: EventEmitter;
  widgets: Widget[];

  constructor() {
    this.emitter = new EventEmitter();
    this.widgets = [];
  }

  addWidget(widgetConfig: IWidgetPaneConfig) {
    this.widgets.push(new Widget(widgetConfig));
    this.emitter.emit('widgetschange', this.widgets);
  }

  getWidgets() {
    return this.widgets;
  }

  onWidgetsChange(func: (widgets: Widget[]) => any) {
    this.emitter.on('widgetschange', func);
    return () => {
      this.emitter.removeListener('widgetschange', func);
    };
  }
}

export default Widgets;
