import * as React from 'react';
import Settings from './settings';

import './index.less';

/**
 * The SettingPane on the right-side
 * of the whole engine UI
 */
export default {
  content: <Settings />,
  name: 'settings',
  title: '设置',
  type: 'tab',
};
