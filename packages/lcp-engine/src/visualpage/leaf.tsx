import lg from '@ali/vu-logger';
import { each, get, omit } from 'lodash';
import React = require('react');
import ReactDOM = require('react-dom');

import VEContext from '../engine/context';
import { VE_HOOKS } from '../engine/core/base/const';
import { Insertion } from '../engine/core/location';
import { Node } from '../engine/core/pages/node';
import { Props } from '../engine/core/pages/props';
import { FaultComponent, HiddenComponent, UnknownComponent, InsertionGhost } from '../engine/ui/placeholders';
import { getView, createNodeStyleSheet, isValidComponent, setNativeNode, shallowEqual } from './renderUtils';

const { VE_NODE_PROPS_DECORATOR } = VE_HOOKS;
const context = new VEContext();

const REACT_VERSION_IS_15 = React.version && React.version.startsWith('15');

type OffBindingEvent = () => any;

interface ILeafProps {
  _componentName?: string;
  leaf?: Node;
}

export default class Leaf extends React.Component<ILeafProps> {
   public static displayName = 'Leaf';
   public props: any;
   public state = {
     hasError: false,
   };

  private leaf: Node;
  private styleSheet: any;
  private willDetach: OffBindingEvent[];

  public componentWillMount() {
    this.leaf = this.props.leaf;
    this.willDetach = [
      this.leaf.onPropsChange(() => this.forceUpdate()),
      this.leaf.onChildrenChange(() => this.forceUpdate()),
      this.leaf.onStatusChange((status: string, field: string) => {
        if (field === 'dragging' || field === 'dropping' || field === 'pseudo' || field === 'visibility') {
          this.forceUpdate();
        }
      }),
    ];

    /**
     * while props replaced
     * bind the new event on it
     */
    this.leaf.onPropsReplace((props: Props) => {
      this.willDetach[0]();
      this.willDetach[0] = this.leaf.onPropsChange(() => {
        this.forceUpdate();
      });
    });
  }

   public componentDidMount() {
    this.modifyDOM();
  }

   public shouldComponentUpdate(nextProps: any) {
    const pageCanRefresh = this.leaf.getPage().canRefresh();
    if (pageCanRefresh) {
      return pageCanRefresh;
    }
    const getExtProps = (obj: any) => {
      const { leaf, ...props } = obj;
      return props;
    };
    return !shallowEqual(getExtProps(this.props), getExtProps(nextProps));
  }

   public componentDidUpdate() {
    this.modifyDOM();
  }

   public componentWillUnmount() {
    if (this.willDetach) {
      this.willDetach.forEach((off: any) => off());
    }
    if (this.styleSheet) {
      this.styleSheet.parentNode.removeChild(this.styleSheet);
    }
    setNativeNode(this.leaf, null);
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    lg.log('ERROR_PAGE_RENDER');
    lg.info('ERROR:', error, info);
    this.setState({ hasError: true }, () => {
      this.forceUpdate();
    });
  }

  public modifyDOM() {
    const shell = ReactDOM.findDOMNode(this);
    const leaf = this.leaf;
    if (shell) {
      setNativeNode(leaf, shell);
      if (leaf.getStatus('dragging')) {
        get(shell, 'classList').add('engine-dragging');
      } else {
        get(shell, 'classList').remove('engine-dragging');
      }
      each(get(shell, 'classList'), (cls) => {
        if (cls.substring(0, 8) === '-pseudo-') {
          get(shell, 'classList').remove(cls);
        }
      });
      const pseudo = leaf.getStatus('pseudo');
      if (pseudo) {
        get(shell, 'classList').add(`-pseudo-${pseudo}`);
      }
    } else {
      setNativeNode(leaf, null);
    }
  }

  public render() {
    const props = omit(this.props, ['leaf']);
    const leaf = this.props.leaf;
    const componentName = leaf.getComponentName();
    const View = getView(componentName);

    if (!View) {
      return <UnknownComponent _componentName={componentName} />;
    }

    let staticProps = {
      ...leaf.getStaticProps(false),
      ...props,
      _componentName: componentName,
      _leaf: leaf,
      componentId: leaf.getId(),
    };

    if (!leaf.isVisibleInPane()) {
      return null;
    }

    if (!leaf.isVisible()) {
      return <HiddenComponent {...staticProps} />;
    }

    if ((REACT_VERSION_IS_15 && !isValidComponent(View, staticProps))
      || this.state.hasError
    ) {
      return <FaultComponent _componentName={componentName} />;
    }

    const propsDecorator = context.getPlugin(VE_NODE_PROPS_DECORATOR);
    if (propsDecorator) {
      staticProps = propsDecorator(staticProps);
    }

    if (this.styleSheet) {
      this.styleSheet.parentNode.removeChild(this.styleSheet);
    }

    this.styleSheet = createNodeStyleSheet(staticProps);

    if (leaf.ableToModifyChildren()) {
      let children: React.ReactElement[] = leaf.getChildren()
        .filter((child: Node) => child.getComponentName() !== 'Slot')
        .map((child: Node) => <Leaf key={child.getId()} leaf={child} />);
      const insertion: Insertion = leaf.getStatus('dropping');
      if (children.length < 1 && insertion && insertion.getIndex() !== null) {
        children = [<InsertionGhost key='insertion' />];
      } else if (insertion && insertion.isNearEdge()) {
        if (insertion.isNearAfter()) {
          children.push(<InsertionGhost key='insertion' />);
        } else {
          children.unshift(<InsertionGhost key='insertion' />);
        }
      }
      staticProps = { ...staticProps, ...this.processSlots(this.leaf.getChildren())};
      return (
        <View {...staticProps}>
          {children}
        </View>
      );
    }

    return <View {...staticProps} />;
  }

  private processSlots(children: Node[]) {
    const slots: { [slotName: string]: React.ReactElement } = {};
    children.forEach((child: Node) => {
      if (child.getComponentName() === 'Slot') {
        slots[child.getPropValue('slotName')] = <Leaf key={child.getId()} leaf={child} />;
      }
    });
    return slots;
  }
}
