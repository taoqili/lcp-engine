import {cloneDeep} from '@ali/ve-utils';
import {INodeOptions, Node} from './node';
import {IComponentSchema} from './page';
import {Page} from './page';

const lifeCycleNames = [
  'constructor', 'didMount', 'willUnmount',
];

function fetchLifeCyclesToRoot(data: IComponentSchema) {
  const props = data && data.props;

  if (props) {
    lifeCycleNames.forEach((lifeCycleName: string) => {
      let value = props[lifeCycleName];

      if (props.hasOwnProperty(lifeCycleName) && value) {
        if (!data.lifeCycles) {
          data.lifeCycles = {};
        }
        if (typeof value === 'string') {
          value = {
            type: 'js',
            compiled: value,
            source: value,
          };
        }

        data.lifeCycles[lifeCycleName] = value;
      }

      delete props[lifeCycleName];
    });
  }
}

function fetchLifeCyclesToProps(data: IComponentSchema) {
  const result = {
    ...data,
  };
  const lifeCycles = result && result.lifeCycles;

  if (lifeCycles && Object.keys(lifeCycles).length > 0) {
    if (!result.props) {
      result.props = {};
    } else {
      result.props = {
        ...result.props,
      };
    }
    Object.keys(lifeCycles).forEach((lifeCycleName: string) => {
      result.props[lifeCycleName] = lifeCycles[lifeCycleName];
    });

    delete result.lifeCycles;
  }

  return result;
}

/**
 * 容器组件节点（Page、Block、Component）
 */

const addonNames = ['css', 'state', 'dataSource', 'methods'];

export default class ContainerNode extends Node {
  private addons: { [key: string]: any };
  private rawAddons: { [key: string]: any };

  constructor(page: Page, data: any, parent?: Node, options?: INodeOptions) {
    super(page, data, parent, options);

    const {id, componentName, props, children, lifeCycles, ...rawAddons} = data;
    this.rawAddons = rawAddons || {};
    this.addons = {};
  }

  public toData() {
    const superData = cloneDeep(super.toData());

    fetchLifeCyclesToRoot(superData);

    return {
      ...superData,
      ...this.exportAddonData(),
    };
  }

  public registerAddon(name: string, exportData: any) {
    if (addonNames.indexOf(name) < 0) {
      const nameListString = Object.keys(addonNames).join(',');
      throw new Error(`node addon name must one of [${nameListString}]`);
    }

    if (this.addons[name]) {
      throw new Error(`node addon ${name} exist`);
    }

    this.addons[name] = exportData;
  }

  public getAddonData(name: string) {
    const addon = this.addons[name];
    if (addon) {
      return addon();
    }
    return this.rawAddons[name];
  }

  protected transformInitData(data: IComponentSchema) {
    return fetchLifeCyclesToProps(data);
  }

  private exportAddonData() {
    const addons = {
      ...this.rawAddons,
    };

    Object.keys(this.addons).forEach((name) => {
      const data = this.addons[name]();

      if (data) {
        addons[name] = data;
      }
    });

    return addons;
  }
}

ContainerNode.Root = Node.Root;
ContainerNode.Props = Node.Props;
