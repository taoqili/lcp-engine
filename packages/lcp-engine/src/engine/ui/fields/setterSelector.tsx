import * as Icons from '@ali/ve-icons';
import { isObject } from 'lodash';
import * as React from 'react';

import VariableSetter from '../../builtins/setters/variableSetter';
import { ISetterConfig } from '../../core/bundle/prototype';
import { IVEFieldProps } from './field';

import './setterSelector.less';

const popups = require('@ali/ve-popups');

const USE_VARIABLE = '使用变量';
const USE_DEFAULT_SETTER = '默认设置器';

export default class SetterSelector extends React.Component<IVEFieldProps, {
  currentSetter?: string;
}> {

  public state = {
    currentSetter: '',
  };
  private domRef: HTMLElement = null;
  private popupHandler: any;

  constructor(props: IVEFieldProps) {
    super(props);
    this.state = {
      currentSetter: props.prop
        && props.prop.getSetterData
        && props.prop.getSetterData().title,
    };
  }

  public onSetterTypeChange(setterItem: ISetterConfig) {
    this.setState({ currentSetter: setterItem.title }, () => {
      if (setterItem.title === USE_DEFAULT_SETTER) {
        this.props.prop.setUseVariable(false);
      } else if (setterItem.title === USE_VARIABLE) {
        this.props.prop.setUseVariable(true);
      } else {
        this.props.prop.setUseVariable(false);
        this.props.prop.setHotValue(setterItem.initialValue);
      }
    });
    if (this.popupHandler) {
      this.popupHandler.close();
    }
  }

  public renderSelectItem() {
    const setterList: ISetterConfig[] = this.getSetterList();
    const jsxList = setterList.map((setterItem) => {
      return (
        <div
          className={setterItem.title === this.state.currentSetter ? 've-setter-selector-selected' : ''}
          onClick={this.onSetterTypeChange.bind(this, setterItem)}>{setterItem.title}</div>
      );
    });
    return (
      <div className='ve-setter-selector-list'>
        {jsxList}
      </div>
    );
  }

  public render() {
    const props = this.props;
    const { prop } = props;
    const setter = prop.getConfig && prop.getConfig('setter');
    const isSupportVariable = prop.isSupportVariable();

    if (!setter) { return null; }
    if (!isSupportVariable && !Array.isArray(setter)) {
      return null;
    }

    return (
      <div ref={(r: HTMLElement) => { this.domRef = r; }}>
        <Icons.Tip
          name='var'
          size='24px'
          position='bottom center'
          className={`engine-field-variable${props.isUseVariable ? ' engine-active' : ''}`}
          onClick={(e: Event) => {
            e.stopPropagation();
            // this means we only have default setter and variable setter
            if (isSupportVariable && this.getSetterList().length === 2) {
              prop.setUseVariable(!prop.isUseVariable());
              return;
            }
            this.popupHandler = popups.popup({
              cancelOnBlur: true,
              className: 've-setter-selector-popup-wrapper',
              content: this.renderSelectItem(),
              position: 'left bottom',
              showClose: false,
              sizeFixed: true,
              target: this.domRef,
            });
          }}
        >
          切换设置器类型
        </Icons.Tip>
      </div>
    );
  }

  private getSetterList() {
    const { prop } = this.props;
    let setterList: ISetterConfig[] = [];

    if (prop.isSupportVariable()) {
      setterList.push({
        condition(value?: { type: 'variable', [key: string]: any }) {
          return isObject(value) && (value.type === 'variable');
        },
        setter: VariableSetter,
        title: USE_VARIABLE,
      });
    }
    const setter: any = prop.getConfig && prop.getConfig('setter');
    if (Array.isArray(setter)) {
      setterList = setterList.concat(setter);
    }
    if (Array.isArray(setterList) && setterList.length >= 1) {
      if (setterList.length === 1 && setterList[0].title === USE_VARIABLE) {
        setterList.unshift({ title: USE_DEFAULT_SETTER });
      }
    }
    return setterList;
  }
}
