import Pane, { IPaneConfig } from './pane';

export interface IStagePaneConfig extends IPaneConfig {
  isRoot?: boolean;
}

export class Stage extends Pane {

  public config: IStagePaneConfig;
  public isRoot: boolean;
  public previous: Stage;
  public refer: {
    stage?: Stage;
    direction?: 'right' | 'left';
  };

  constructor(config: IStagePaneConfig) {
    super(config);
    this.isRoot = config.isRoot;
  }

  public getTip() {
    return this.config.tip;
  }

  public setPrevious(stage: Stage) {
    this.previous = stage;
  }

  public getPrevious(): Stage {
    return this.previous;
  }

  public hasBack(): boolean {
    return this.previous && !this.isRoot;
  }

  public setRefer(stage: Stage, direction: 'right' | 'left') {
    this.refer = { stage, direction };
  }

  public setReferRight(stage: Stage) {
    this.setRefer(stage, 'right');
  }

  public setReferLeft(stage: Stage) {
    this.setRefer(stage, 'left');
  }

  public getRefer() {
    const refer = this.refer;
    this.refer = null;
    return refer;
  }
}

const GLOBAL_STAGES: {
  [id: string]: Stage;
} = {};

const Stages = {
  Stage,

  getStage(id: string) {
    return GLOBAL_STAGES[id];
  },

  removeStage(id: string) {
    delete GLOBAL_STAGES[id];
  },

  createStage(config: IStagePaneConfig) {
    const stage = new Stage(config);
    GLOBAL_STAGES[stage.getId()] = stage;
    return stage.getId();
  },

  addGlobalStage(config: IStagePaneConfig) {
    return Stages.createStage(config);
  },
};

export default Stages;
