import { assign } from "lodash";
import * as React from "react";

import VariableSetter from "../../builtins/setters/variableSetter";
import Context from "../../context";
import { VE_HOOKS } from "../../core/base/const";
import CompositeProp from "../../core/pages/compositeProp";
import {
  AccordionField,
  BlockField,
  CaptionField,
  EntryField,
  InlineField,
  PlainField,
  PopupField
} from "./fields";

export * from "./fields";

import VEUtils = require("@ali/ve-utils");
import { getSetter } from "../../core/bundle/bundle";

function isReactClass(obj: any): obj is React.ComponentClass<any> {
  return (
    obj &&
    obj.prototype &&
    (obj.prototype.isReactComponent || obj.prototype instanceof React.Component)
  );
}

function isReactComponent(obj: any): obj is React.ComponentType<any> {
  return obj && (isReactClass(obj) || typeof obj === "function");
}

function createSetterContent(setter: any, props: any): React.ReactNode {
  if (typeof setter === "string") {
    setter = getSetter(setter);
  }

  if (React.isValidElement(setter)) {
    return React.cloneElement(setter, props);
  }

  if (isReactComponent(setter)) {
    return React.createElement(setter, props);
  }

  return React.createElement(VariableSetter, props);
}

interface IExtraProps {
  stageName?: string;
  isGroup?: boolean;
  isExpand?: boolean;
  propName?: string;
  toggleExpand?: () => any;
  onExpandChange?: () => any;
}

const { VE_SETTING_FIELD_VARIABLE_SETTER } = VE_HOOKS;

const FIELD_TYPE_MAP: any = {
  accordion: AccordionField,
  block: BlockField,
  caption: CaptionField,
  entry: EntryField,
  inline: InlineField,
  plain: PlainField,
  popup: PopupField,
  tab: AccordionField
};

export class SettingField extends React.Component {
  public readonly props: {
    prop: CompositeProp;
    selected?: boolean;
    forceDisplay?: string;
    className?: string;
    children?: JSX.Element | string;
    compact?: boolean;
    key?: string;
    addonProps?: object;
  };

  /**
   * VariableSetter placeholder
   */
  public variableSetter: any;

  constructor(props: any) {
    super(props);

    const ctx = new Context();
    if (ctx.getPlugin(VE_SETTING_FIELD_VARIABLE_SETTER)) {
      this.variableSetter = ctx.getPlugin(VE_SETTING_FIELD_VARIABLE_SETTER);
    } else {
      this.variableSetter = VariableSetter;
    }
  }

  public render() {
    const { prop, selected, addonProps } = this.props;
    const display = this.props.forceDisplay || prop.getDisplay();

    if (display === "none") {
      return null;
    }

    // 标准的属性，即每一个 Field 在 VE 下都拥有的属性
    const standardProps = {
      className: this.props.className,
      compact: this.props.compact,

      isSupportMultiSetter: this.supportMultiSetter(),
      isSupportVariable: prop.isSupportVariable(),
      isUseVariable: prop.isUseVariable(),
      prop,
      setUseVariable: () => prop.setUseVariable(!prop.isUseVariable()),
      tip: prop.getTip(),
      title: prop.getTitle()
    };

    // 部分 Field 所需要的额外 fieldProps
    const extraProps = {};
    const ctx = new Context();
    const plugin = ctx.getPlugin(VE_HOOKS.VE_SETTING_FIELD_PROVIDER);
    let Field;
    if (typeof plugin === "function") {
      Field = plugin(display, FIELD_TYPE_MAP, prop);
    }
    if (!Field) {
      Field = FIELD_TYPE_MAP[display] || PlainField;
    }
    this._prepareProps(display, extraProps);

    if (display === "entry") {
      return <Field {...{ ...standardProps, ...extraProps }} />;
    }

    let setter;
    const props: any = {
      prop,
      selected,
    };
    const fieldProps = { ...standardProps, ...extraProps };

    if (prop.isUseVariable() && !this.variableSetter.isPopup) {
      props.placeholder = "请输入表达式: ${var}";
      props.key = `${prop.getId()}-variable`;
      setter = React.createElement(this.variableSetter, props);
      return <Field {...fieldProps}>{setter}</Field>;
    }

    // for composited prop
    if (prop.getVisibleItems) {
      setter = prop
        .getVisibleItems()
        .map((item: any) => (
          <SettingField {...{ key: item.getId(), prop: item, selected }} />
        ));
      return <Field {...fieldProps}>{setter}</Field>;
    }

    // TODO setter 透传了 onChange 给 control，导致异常
    /*
    props.value = prop.getValue();
    props.onChange = (val: any) => {
      prop.setValue(val);
    };
    */

    setter = prop.getSetter();
    if (
      typeof setter === "object" &&
      "componentName" in setter &&
      !(React.isValidElement(setter) || isReactClass(setter))
    ) {
      const { componentName: setterType, props: setterProps } = setter as any;
      setter = createSetterContent(setterType, {
        ...addonProps,
        ...setterProps,
        ...props
      });
    } else {
      setter = createSetterContent(setter, {
        ...addonProps,
        ...props
      });
    }

    return <Field {...fieldProps}>{setter}</Field>;
  }

  private supportMultiSetter() {
    const { prop } = this.props;
    const setter = prop && prop.getConfig && prop.getConfig("setter");
    return prop.isSupportVariable() || Array.isArray(setter);
  }

  private _prepareProps(displayType: string, extraProps: IExtraProps): void {
    const { prop } = this.props;
    extraProps.propName = prop.isGroup()
      ? "组合属性，无属性名称"
      : prop.getName();
    switch (displayType) {
      case "title":
        break;
      case "block":
        assign(extraProps, { isGroup: prop.isGroup() });
        break;
      case "accordion":
        assign(extraProps, {
          headDIY: true,
          isExpand: prop.isExpand(),
          isGroup: prop.isGroup(),
          onExpandChange: () => prop.onExpandChange(() => this.forceUpdate()),
          toggleExpand: () => {
            prop.toggleExpand();
          }
        });
        break;
      case "entry":
        assign(extraProps, { stageName: prop.getName() });
        break;
      default:
        break;
    }
  }
}
