class Watcher {

  synces: any[];

  constructor() {
    this.synces = [];
    window.onresize = () => {
      this.touch();
    };
  }

  touch(delay?: boolean) {
    const applyTouch = () => {
      if (this.synces.length < 1) {
        return;
      }
      this.synces.forEach((item) => item());
    };
    applyTouch();

    if (delay) {
      if (typeof delay === 'number') {
        setTimeout(applyTouch, delay);
      } else {
        requestAnimationFrame(applyTouch);
      }
    }
  }

  addSync(sync: any) {
    if (this.synces.indexOf(sync) > -1) {
      return null;
    }
    this.synces.push(sync);
    return () => {
      this.removeSync(sync);
    };
  }

  removeSync(sync: any) {
    const i = this.synces.indexOf(sync);
    if (i > -1) {
      this.synces.splice(i, 1);
    }
  }
}

export default new Watcher();
