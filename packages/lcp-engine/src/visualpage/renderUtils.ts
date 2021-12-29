import lg from '@ali/vu-logger';
import { get, isObject } from 'lodash';
import React = require('react');
import * as ReactDOMServer from 'react-dom/server';
import Trunk from '../engine/core/trunk';
import Viewport from '../engine/core/viewport';

const { toCss } = require('@ali/vu-css-style');
const { renderToStaticMarkup } = ReactDOMServer;
const privateRender: {
  renderToStaticMarkup?: (View: any) => any;
} = get(React, '__SECRET_DOM_SERVER_DO_NOT_USE_OR_YOU_WILL_BE_FIRED');

function ucfirst(s: string) {
  return s.charAt(0).toUpperCase() + s.substring(1);
}

export function isValidComponent(Component: React.Component, props: any): boolean {
  return tryRender(Component, props);
}

// idea by @alex.mm
export function tryRender(RenderView: any, props: any) {
  let result = true;

  const reactTestUtils: {
    createRenderer?: () => any;
  } = get(React, 'addons.TestUtils');

  let view;

  // react dom-server shall be imported individually
  if (get(ReactDOMServer, 'version', '16.0.0') >= '16.0.0') {
    return true;
  }

  try {
    if (renderToStaticMarkup) {
      // react >= 15.6.x && react <= 16.0.0
      view = React.createElement(RenderView, props);
      renderToStaticMarkup(view);
    } else if (privateRender) {
      // react <= 15.3.x
      const { renderToStaticMarkup } = privateRender;
      view = React.createElement(RenderView, props);
      renderToStaticMarkup(view);
    } else if (reactTestUtils) {
      // with test utils
      const renderer = reactTestUtils.createRenderer();
      renderer.render(React.createElement(RenderView, props));
    } else {
      console.warn(`The current React version ${React.version} is not support pre-render.`);
    }
  } catch (e) {
    result = false;
    lg.log('ERROR_COMPONENT_RENDER');
    lg.error('ERROR:', `${e}. Check the component '${props._componentName}'.`);
  }
  return result;
}

export function shallowEqual(obj: any, tObj: any): boolean {
  for (const i in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, i) && obj[i] !== tObj[i]) {
      return false;
    }
  }
  return true;
}

export const NativeNodeCache: { [key: string]: Element } = {};
export function setNativeNode(leaf: any, node: any) {
  const id = leaf.getId();
  if (NativeNodeCache[id] === node) {
    return;
  }
  NativeNodeCache[id] = node;
  leaf.mountChange();
}

export function getView(componentName: string) {
  let view = new Trunk().getPrototypeView(componentName);
  if (!view) {
    return null;
  }
  const viewport = Viewport.getViewport();
  if (viewport) {
    const [mode, device] = viewport.split('-', 2).map(ucfirst);
    if (view.hasOwnProperty(device)) {
      view = view[device];
    }

    if (view.hasOwnProperty(mode)) {
      view = view[mode];
    }
  }
  return view;
}

export function createNodeStyleSheet(props: any) {
  if (props && props.fieldId) {
    let styleProp = props.__style__;

    if (isObject(styleProp)) {
      styleProp = toCss(styleProp);
    }

    if (typeof styleProp === 'string') {
      const s = document.createElement('style');
      const cssId = '_style_pesudo_' + props.fieldId;
      const cssClass = '_css_pesudo_' + props.fieldId;

      props.className = cssClass;
      s.setAttribute('type', 'text/css');
      s.setAttribute('id', cssId);
      document.getElementsByTagName('head')[0].appendChild(s);

      s.appendChild(document.createTextNode(styleProp.replace(/:root/g, '.' + cssClass)));

      return s;
    }
  }
}
