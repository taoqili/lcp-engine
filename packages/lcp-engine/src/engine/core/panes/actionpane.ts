import * as EventEmitter from 'events';

import Flags from '../flags';
import ActionCore, { IActionPaneConfig } from './actionCore';

class ActionPane {

  public actions: ActionCore[];
  public emitter: EventEmitter;

  constructor() {
    this.actions = [];
    this.emitter = new EventEmitter();
  }

  public addAction(actionConfig: IActionPaneConfig) {
    const action = new ActionCore(actionConfig);
    this.actions.push(action);
    this.sortActions();
    this.emitter.emit('actionschange', this.actions);
  }

  public removeAction(action: ActionCore | string): void;
  public removeAction(action: any): void {
    if (typeof action === 'string') {
      action = this.actions.find((item) => item.getName() === action);
    }
    const i = this.actions.indexOf(action);
    if (i > -1) {
      action.destroy();
      this.actions.splice(i, 1);
      this.emitter.emit('actionschange', this.actions);
    }
  }

  public getActions() {
    return this.actions;
  }

  public setActions(actions: ActionCore[] = []) {
    this.actions = actions;
    this.sortActions();
    this.emitter.emit('actionschange', this.actions);
  }

  public hidePane() {
    Flags.add('hide-actionpane');
  }

  public showPane() {
    Flags.remove('hide-actionpane');
  }

  public onActionsChange(func: (actions: ActionCore[]) => any) {
    this.emitter.on('actionschange', func);
    return () => {
      this.emitter.removeListener('actionschange', func);
    };
  }

  private sortActions() {
    this.actions.sort((prev, next) => {
      return (prev.getIndex()) <= (next.getIndex()) ? 1 : -1;
    });
  }
}

export default ActionPane;
