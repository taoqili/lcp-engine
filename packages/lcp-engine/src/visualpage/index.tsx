import logger from '@ali/vu-logger';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Page from './page';

function render(page: any, callback: () => any) {
  try {
    ReactDOM.render(<Page page={page} />, page.getDocument(), callback);
  } catch (e) {
    logger.log('ERROR_PAGE_RENDER');
    logger.error('ERROR:', e);
  }

  return () => {
    ReactDOM.unmountComponentAtNode(page.getDocument());
  };
}

function findDOMNode(id: string) {
  return Page.getDOMNode(id);
}

export default { render, findDOMNode };

export interface IVisualPage {
  render(page: any, callback: () => any): () => any,
  findDOMNode(id: string): Element,
}
