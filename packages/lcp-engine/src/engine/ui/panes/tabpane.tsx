import * as React from 'react';
import TabCore from '../../core/panes/tabCore';
import panes from '../../core/panes';

import './tabpane.less';

const { tabPane } = panes;

class Tab extends React.Component {
  tab: TabCore;
  willDetach: () => any;

  props: {
    tab: TabCore;
    key?: string;
  }

  componentWillMount() {
    this.tab = this.props.tab;
    this.willDetach = this.tab.onActiveChange(() => {
      this.forceUpdate();
    });
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
    const tab = this.tab;
    return (
      <div
        className={`engine-tab${tab.isActive() ? ' engine-active' : ''}`}
        onClick={() => tabPane.activeTab(tab)}
      >
        {tab.getTitle()}
      </div>
    );
  }
}

class TabContent extends React.Component {

  isInited: boolean;
  willDetach: () => any;
  tab: TabCore;

  props: {
    tab: TabCore;
  }

  componentWillMount() {
    this.tab = this.props.tab;
    this.isInited = this.tab.isActive();
    this.willDetach = this.tab.onActiveChange((flag) => {
      if (flag) {
        this.isInited = true;
      }
      this.forceUpdate();
    });
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
    if (!this.isInited) return null;

    const tab = this.tab;
    let className = `engine-tab-content engine-tabcontent-${tab.getName()}`;
    if (tab.isActive()) {
      className += ' engine-visible';
    }
    return (<div className={className}>{tab.getContent()}</div>);
  }
}

class TabPane extends React.Component {
  willDetach: () => any;

  componentWillMount() {
    this.willDetach = tabPane.onTabsChange(() => {
      this.forceUpdate();
    });
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
    const tabs: JSX.Element[] = [];
    const tabsContent: any = [];

    tabPane.getTabs().forEach((tab: TabCore) => {

      tabs.push(
        <Tab
          key={`tab-${tab.getName()}`}
          tab={tab}
        />
      );

      tabsContent.push(
        <TabContent
          key={`tabcontent-${tab.getName()}`}
          tab={tab}
        />
      );
    });

    let className = 'engine-pane engine-tabpane';

    if (tabs.length < 2) {
      className += ' engine-single';
    }

    if (tabPane.visible) {
      className += ' engine-visible';
    }

    return (
      <div className={className}>
        <div className="engine-tabs">{tabs}</div>
        <div className="engine-tab-contents">{tabsContent}</div>
      </div>
    );
  }
}

export default TabPane;
