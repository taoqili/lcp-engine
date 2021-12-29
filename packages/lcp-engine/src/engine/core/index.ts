import { VE_EVENTS, VE_HOOKS, VERSION } from "./base/const";
import Bundle from "./bundle/bundle";
import Prototype from "./bundle/prototype";
import Bus from "./bus";
import DragEngine from "./dragengine";
import Env from "./env";
import Exchange from "./exchange";
import Flags from "./flags";
import Location from "./location";
import Panes from "./panes";
import Project from "./project";
import Symbols from "./symbols";
import Trunk from "./trunk";
import Viewport from "./viewport";

import * as Hotkey from "../builtins/hotkeys/hotkey";
import { VirtualRenderingNode } from "../builtins/nodes/vnode";
import Pages from "./pages";
import { Node } from "./pages/node";

const I18nUtil = require("@ali/ve-i18n-util");

/* tslint:disable: no-console */
console.log(
  `%cVisualEngine %cv${VERSION}`,
  "color:#000;font-weight:bold;",
  "color:green;font-weight:bold;"
);

// 全局属性配置
// @ts-ignore
export default {
  /**
   * 不允许在下面添加核心类和对象了
   * 推荐通过 Engine.Context 来处理
   *
   * @deprecated
   */
  /* 包抽象 */
  Bundle,

  /* pub/sub 集线器 */
  Bus: new Bus(),

  /* 拖拽引擎 */
  DragEngine,

  /* 环境变量 */
  Env,

  /* 状态交换 */
  Exchange,

  /* 状态 Flags */
  Flags,

  /* 快捷键 */
  Hotkey,

  /* 多语言文案 */
  I18nUtil,

  /* 页面管理 */
  Pages,

  /* 面板管理 */
  Panes,

  /* 应用管理 */
  Project,

  /* 包原型 */
  Prototype,

  /* 组件仓库 */
  Trunk: new Trunk(),

  /* 版本号 */
  Version: VERSION,

  /* 事件 */
  EVENTS: VE_EVENTS,

  /* 修饰方法 */
  HOOKS: VE_HOOKS,

  /* 视图管理 */
  Viewport,

  /* 位置解析 */
  Location,

  /* Symbol 管理类 */
  Symbols,

  /* 节点类 */
  Node,
  VirtualRenderingNode
};
