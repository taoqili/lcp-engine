
class HoveringCapture {

  public boundary: any;
  public willDetach: () => any;

  public capture(e: MouseEvent, onLeave: (evt: any) => any) {
    this.release();

    const box = this.boundary;
    if (!box) {
      return false;
    }

    const elem = e.relatedTarget
      || document.elementFromPoint(e.clientX, e.clientY);
    if (!elem || !box.contains(elem)) {
      return false;
    }

    const leave = (evt: any) => {
      onLeave(evt);
      this.release();
    };
    this.willDetach = () => {
      box.removeEventListener('mouseleave', leave, false);
      this.willDetach = null;
    };

    box.addEventListener('mouseleave', leave, false);
    return true;
  }

  public release() {
    if (this.willDetach) {
      this.willDetach();
    }
  }

  public setBoundary(boundary: any) {
    this.release();
    this.boundary = boundary;
  }
}

export default HoveringCapture;
