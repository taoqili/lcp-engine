import * as React from 'react';

import VariableSetter from '../../builtins/setters/variableSetter';
import Context from '../../context';
import { VE_HOOKS } from '../../core/base/const';

import * as Icons from '@ali/ve-icons';
import { IVEFieldProps } from './field';
import './variableSwitcher.less';

const { VE_SETTING_FIELD_VARIABLE_SETTER } = VE_HOOKS;

interface IState {
  visible: boolean;
}

export default class VariableSwitcher extends React.Component<IVEFieldProps, IState> {
  private ref: HTMLElement = null;
  private VariableSetter: any;

  constructor(props: IVEFieldProps) {
    super(props);

    const ctx = new Context();
    if (ctx.getPlugin(VE_SETTING_FIELD_VARIABLE_SETTER)) {
      this.VariableSetter = ctx.getPlugin(VE_SETTING_FIELD_VARIABLE_SETTER);
    } else {
      this.VariableSetter = VariableSetter;
    }

    this.state = {
      visible: false,
    };
  }

  public render() {
    const { isUseVariable, prop } = this.props;
    const { visible } = this.state;
    const isSupportVariable = prop.isSupportVariable();
    const tip = !isUseVariable ? '绑定变量' : prop.getVariableValue();
    if (!isSupportVariable) {
      return null;
    }
    return (
      <div>
        <Icons.Tip
          name='var'
          size='24px'
          position='bottom center'
          className={`engine-field-variable-switcher ${isUseVariable ? 'engine-active' : ''}`}
          data-tip={tip}
          onClick={(e: Event) => {
            e.stopPropagation();
            if (this.VariableSetter.isPopup) {
              this.VariableSetter.show({
                prop,
              });
            } else {
              prop.setUseVariable(!isUseVariable);
            }
          }}>
          绑定变量
        </Icons.Tip>
      </div>
    );
  }
}
