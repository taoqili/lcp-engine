import * as EventEmitter from 'events';
import { ReactElement } from 'react';
import Flags from '../flags';

class Toolbar {
  emitter: EventEmitter;
  contents: any = null;

  constructor() {
    this.emitter = new EventEmitter();
  }

  setVisible(flag: boolean) {
    if (flag) {
      Flags.add('show-toolbar');
    } else {
      Flags.remove('show-toolbar');
    }
  }

  setContents(contents: ReactElement) {
    this.contents = contents;
    this.emitter.emit('contentschange');
  }

  onContentsChange(func: () => any) {
    this.emitter.on('contentschange', func);
    return () => {
      this.emitter.removeListener('contentschange', func);
    };
  }
}

export default Toolbar;
