import ActionPane from "./actionpane";
import DockPane from "./dockpane";
import Stages from "./stages";
import TabPane from "./tabpane";
import Widgets from "./widgets";
import Toolbar from "./toolbar";

const dockPane = new DockPane();
const actionPane = new ActionPane();
const tabPane = new TabPane();
const toolbar = new Toolbar();
const widgets = new Widgets();

export interface IPaneConfigs {
  // 'dock' | 'action' | 'tab' | 'widget' | 'stage'
  type: string;
  description?: string;
  name: string;
  title?: string;

  place?: string;
  content?: any;
}

function add(
  config: (() => IPaneConfigs) | IPaneConfigs,
  extraConfig?: any
): any;
function add(config: any, extraConfig?: any): any {
  if (typeof config === "function") {
    config = config.call(null);
  }
  if (!config || !config.type) {
    return null;
  }
  if (extraConfig) {
    config = { ...config, ...extraConfig };
  }
  switch (config.type) {
    case "dock":
      return dockPane.addDock(config);
    case "action":
      return actionPane.addAction(config);
    case "tab":
      return tabPane.addTab(config);
    case "widget":
      return widgets.addWidget(config);
    case "stage":
      return Stages.addGlobalStage(config);
    default:
      return null;
  }
}

export default {
  ActionPane: actionPane,
  DockPane: dockPane,
  Stages,
  TabPane: tabPane,
  Widgets: widgets,
  actionPane,
  add,
  dockPane,
  tabPane,
  widgets,
  toolbar
};
