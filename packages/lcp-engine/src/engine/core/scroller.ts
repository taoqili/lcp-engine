function getWindow(elem: any) {
  return elem && (elem.window === elem ? elem : (elem.nodeType === 9 && elem.defaultView));
}

function createApplier(elem: Element) {
  const win = getWindow(elem);
  return (val: number) => {
    if (val == null) {
      return win ? win.pageYOffset : elem.scrollTop;
    }

    if (win) {
      win.scrollTo(win.pageXOffset, val);
    } else {
      elem.scrollTop = val;
    }
    return null;
  };
}

function easing(n: number) {
  return Math.sin(n * Math.PI / 2);
}

class Scroller {

  public pid: number;
  public area: any;
  public applier: any;
  public inscrolling: boolean;

  constructor(area: any, target: any) {
    this.area = area;
    this.applier = createApplier(target);
  }

  public scrollTo(val: any) {
    if (this.inscrolling) {
      return;
    }
    if (this.pid) {
      this.cancel();
    }

    let pid: number;
    const initVal = this.applier();

    const end = () => {
      this.cancel();
    };

    if (initVal === val) {
      end();
      return;
    }

    const duration = 200;
    const start = +new Date();

    const animate = () => {
      if (pid !== this.pid) {
        return;
      }

      const now = +new Date();
      const time = Math.min(1, ((now - start) / duration));
      const eased = easing(time);

      this.applier((eased * (val - initVal)) + initVal);

      if (time < 1) {
        this.pid = pid = requestAnimationFrame(animate);
      } else {
        end();
      }
    };

    this.pid = pid = requestAnimationFrame(animate);
  }

  public scrolling(e: MouseWheelEvent) {
    this.cancel();
    if (!e) {
      return;
    }

    this.inscrolling = true;

    let st: number;
    let a: number;
    let animate: any;

    const y = e.clientY;
    const bounds = this.area.getBounds();

    if (!bounds) {
      return;
    }

    const maxScrollHeight = this.area.getScrollHeight() - bounds.height;

    if (y < bounds.top + 20) {
      st = this.applier();
      a = -Math.min(Math.max(bounds.top + 20 - y, 10), 50);

      animate = () => {
        if (st <= 0) {
          return;
        }

        st += a;
        this.applier(Math.max(st, 0));

        this.pid = requestAnimationFrame(animate);
      };
    } else if (y > bounds.bottom - 20) {
      st = this.applier();
      a = Math.min(Math.max(y + 20 - bounds.bottom, 10), 50);

      animate = () => {
        if (st >= maxScrollHeight) {
          return;
        }

        st += a;
        this.applier(Math.min(st, maxScrollHeight));

        this.pid = requestAnimationFrame(animate);
      };
    }

    if (animate) {
      animate();
    }
  }

  public cancel() {
    if (this.pid) {
      cancelAnimationFrame(this.pid);
    }
    this.pid = null;
    this.inscrolling = false;
  }
}

export default Scroller;
