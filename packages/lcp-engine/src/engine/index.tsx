import * as utils from '@ali/ve-utils';
import logger from '@ali/vu-logger';
import { once } from 'lodash';
import React = require('react');
import ReactDOM = require('react-dom');

import VisualEngineContext from './context';
import EngineCore from './core';
import { Node } from './core/pages/node';
import Prop from './core/pages/prop';
import { Props } from './core/pages/props';
import BaseModules from './core/base';
import Scroller from './core/scroller';
import { Insertion } from './core/location';
import BuiltInsUI from './ui';
import * as Field from './ui/fields';
import { FaultComponent, HiddenComponent, UnknownComponent, InsertionGhost } from './ui/placeholders';

/**
 * Boot built-ins modules
 */
import './builtins';
import './global.less';

const engineExports = {
  /**
   * Compatible with old APIs
   * @deprecated
   */
  Popup: require('@ali/ve-popups'),

  /**
   * VE.context
   *
   * 默认未初始化，需要等待 init 之后
   * @memberof VisualEngine
   */
  context: new VisualEngineContext(),

  /**
   * VE.init
   *
   * Initialized the whole VisualEngine UI
   */
  init: once((container?: Element, contextConfigs?: any) => {
    if (!container) {
      container = document.createElement('div');
      document.body.appendChild(container);
    }
    container.id = 'engine';
    ReactDOM.render(<BuiltInsUI />, container);
  }),

  /**
   * VE.modules.xxx
   *
   * VE BuildIn Modules
   */
  modules: {
    ...BaseModules,
    Node,
    Props,
    Prop,
    Scroller,
    Insertion,
  },

  /**
   * VE.ui.xxx
   *
   * Core UI Components
   */
  ui: {
    Field,
    Icon: require('@ali/ve-icons'),
    Icons: require('@ali/ve-icons'),
    Popup: require('@ali/ve-popups'),
    FaultComponent,
    HiddenComponent,
    UnknownComponent,
    InsertionGhost,
  },

  /**
   * VisualEngine Logger Tool
   */
  lg: logger,
  logger,

  /**
   * VE Utils
   */
  utils,
};

module.exports = {
  ...engineExports,
  ...EngineCore,
};
