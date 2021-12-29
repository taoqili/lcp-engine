import * as React from 'react';
import panes from '../../core/panes';
import ActionCore from '../../core/panes/actionCore';

const actionPane = panes.actionPane;

import './actionpane.less';

interface IActionProps {
  action: ActionCore;
  key?: string;
}

class Action extends React.Component {

  public props: IActionProps;

  public render() {
    const action = this.props.action;
    return <div className='engine-actionitem'>{action.getContent()}</div>;
  }
}

class ActionPane extends React.Component {

  public willDetach: () => any;

  public componentWillMount() {
    this.willDetach = actionPane.onActionsChange(() => this.forceUpdate());
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach();
    }
  }

  public render() {
    const leftActions: JSX.Element[] = [];
    const centerActions: JSX.Element[] = [];
    const rightActions: JSX.Element[] = [];

    actionPane.getActions().forEach((action, i) => {
      if (action.isHidden()) { return; }
      if (action.getPlace() === 'right') {
        rightActions.unshift(
          <Action key={`rightaction-${i}`} action={action} />,
        );
      } else if (action.getPlace() === 'center') {
        centerActions.push(
          <Action key={`centeraction-${i}`} action={action} />,
        );
      } else {
        leftActions.push(
          <Action key={`leftaction-${i}`} action={action} />,
        );
      }
    });

    return (
      <div className='engine-pane engine-actionpane'>
        <div className='engine-actions-group engine-group-left'>{leftActions}</div>
        <div className='engine-actions-group engine-group-center'>{centerActions}</div>
        <div className='engine-actions-group engine-group-right'>{rightActions}</div>
      </div>
    );
  }
}

export default ActionPane;
