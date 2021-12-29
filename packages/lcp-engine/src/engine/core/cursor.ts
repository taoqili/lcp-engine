class Cursor {

  state: string[] = [];

  constructor() {
    this.state = [];
  }

  addState(state: string) {
    if (this.state.indexOf(state) === -1) {
      this.state.push(state);
      document.documentElement.classList.add(`engine-cursor-${state}`);
    }
  }

  hasState(state: string) {
    return this.state.indexOf(state) > -1;
  }

  removeState(state: string) {
    const i = this.state.indexOf(state);
    if (i > -1) {
      this.state.splice(i, 1);
      document.documentElement.classList.remove(`engine-cursor-${state}`);
    }
  }

  clearState() {
    let i = this.state.length;
    while (i-- > 0) {
      this.removeState(this.state[i]);
    }
  }

  setMove(flag: boolean) {
    if (flag) {
      this.addState('move');
    } else {
      this.removeState('move');
    }
  }

  setCopy(flag: boolean) {
    if (flag) {
      this.addState('copy');
    } else {
      this.removeState('copy');
    }
  }

  isCopy() {
    return this.hasState('copy');
  }

  release() {
    this.clearState();
  }
}

export default new Cursor();
