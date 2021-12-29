import pages from '../core/pages';
import panes from '../core/panes';
import './hotkeys';
import './i18n';
import Settings from './settings';

import NodeCacheVisitor from './visitors/rootNodeVisitor';

/**
 * set builtin error map
 */
import { Page } from '../core/pages/page';
import './errors.ts';

const React = require('react');
const popups = require('@ali/ve-popups');
const StyleSheet = require('@ali/vu-style-sheet');

/**
 * Build-in logo
 */
panes.add({
  content: (
    <a href='https://go.alibaba-inc.com/home/' target='_blank' rel='noopener noreferrer'>
      <img
        alt=''
        className='engine-logo' src='https://img.alicdn.com/tfs/TB1DsrsXkyWBuNjy0FpXXassXXa-60-60.png'
      />
    </a>
  ),
  name: 'logo',
  place: 'left',
  type: 'action',
});

/**
 * Build-in prop value setting pane
 */
panes.add(Settings);
/**
 * Enable global tips
 */
popups.enableTip();
/**
 * Add page nodes-visitor
 */
pages.onCurrentPageChange((page: Page) => {
  if (!page) { return; }
  page.acceptRootNodeVisitor('NodeCache', (rootNode) => {
    const visitor: NodeCacheVisitor = page.getRootNodeVisitor('NodeCache');
    if (visitor) {
      visitor.destroy();
    }
    return new NodeCacheVisitor(page, rootNode);
  });
});

StyleSheet.setDesignMode(true);
