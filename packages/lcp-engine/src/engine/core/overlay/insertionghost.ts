import * as EventEmitter from 'events';

class InsertionSync {

  public emitter: EventEmitter;
  public ghost: any;

  constructor() {
    this.emitter = new EventEmitter();
  }

  public mount(ghost: any) {
    if (ghost === this.ghost) {
      return;
    }
    this.ghost = ghost;
    this.emitter.emit('sync', this.ghost);
  }

  public getGhost() {
    return this.ghost;
  }

  public unmount(ghost: any) {
    if (this.ghost === ghost) {
      this.ghost = null;
      this.emitter.emit('sync', null);
    }
  }

  public onSync(func: () => any) {
    this.emitter.on('sync', func);
    return () => {
      this.emitter.removeListener('sync', func);
    };
  }
}

export default InsertionSync;
