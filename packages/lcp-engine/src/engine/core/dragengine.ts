import * as EventEmitter from 'events';
import Cursor from './cursor';
import Flags from './flags';
import { Location } from './location';

export interface ISenseAble {
  orient(dragment: any, e: MouseEvent): Location;
  isEnabled(): boolean;
  isEnter(e: MouseEvent): boolean;
  isInRange(e: MouseEvent): boolean;
}

const SHAKE_DISTANCE = 4;

/**
 * 抖动检测，只有当鼠标移动位移距离超过定值的时候才算抖动
 *
 * @param {any} e1 MouseEvent
 * @param {any} e2 MouseEvent
 * @returns Boolean
 */
function hasShake(e1: MouseEvent, e2: MouseEvent, distance = SHAKE_DISTANCE) {
  return ((e1.clientY - e2.clientY) ** 2 + (e1.clientX - e2.clientX) ** 2)
    > distance;
}

export class DragEngine {
  public emitter: EventEmitter;

  // Drag sensation detector like VE.Pages or VE.TreeCore
  public sensors: ISenseAble[];
  public boosted: boolean;
  public useHandler: boolean;

  private isMoving: boolean;
  // is Node ? false : true;
  private isNewBie: boolean;
  private lastLocation: Location;

  /**
   * Pages or TreeCore
   */
  private lastSensor: any;
  private enabled: boolean = true;

  constructor() {
    this.sensors = [];
    this.emitter = new EventEmitter();
    const prevent = (e: MouseEvent) => {
      if (!this.boosted) {
        return null;
      }

      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    document.addEventListener('selectstart', prevent, true);
    document.addEventListener('dragstart', prevent, true);
  }

  public setUseHandler(flag: boolean) {
    this.useHandler = flag;
  }

  public isUseHandler() {
    return this.useHandler;
  }

  /**
   * drag from
   * @param shell
   * @param boost (e: MouseEvent) => VE.Node
   */
  public from(shell: Element, boost: (e: MouseEvent) => any) {
    const mousedown = (e: MouseEvent) => {
      if (!this.enabled) {
        return;
      }

      this.boosted = false;

      // ESC or RightClick
      if (e.which === 3 || e.button === 2) {
        return;
      }

      // Get a new node to be dragged
      const node = boost(e);
      if (!node) {
        return;
      }

      this.boost(node, e);
    };
    shell.addEventListener('mousedown', mousedown);
    return () => {
      shell.removeEventListener('mousedown', mousedown);
    };
  }

  public boost(dragment: any, boostEvent: any) {
    this.lastLocation = null;
    this.lastSensor = null;
    this.isNewBie = !dragment.isNode;
    this.isMoving = false;
    this.boosted = true;

    const checkesc = (e: KeyboardEvent) => {
      if (e.keyCode === 27) {
        this.lastLocation = null;
        over(); // eslint-disable-line
      }
    };

    const checkcopy = (e: MouseEvent) => {
      if ((e.altKey || e.ctrlKey) && !this.isNewBie) {
        Cursor.setCopy(true);
      } else {
        Cursor.setCopy(false);
      }
    };

    const drag = (e: MouseEvent) => {
      checkcopy(e);

      // sensor 为拖动元素的可放置区域（敏感区）
      const sensor = this.chooseSensor(e);
      if (sensor) {
        this.lastLocation = sensor.orient(dragment, e);
      } else {
        this.lastLocation = null;
      }
      this.emitter.emit('drag', e, dragment, this.lastLocation);
    };

    const dragstart = () => {
      if (!this.isNewBie) {
        this.chooseSensor(boostEvent);
      }
      Cursor.setMove(true);
      // ESC cancel drag
      document.addEventListener('keydown', checkesc, false);
      Flags.setDragMode(true);
      this.emitter.emit('dragstart', boostEvent, dragment);
    };

    const move = (e: MouseEvent) => {
      if (this.isMoving) {
        drag(e);
        return;
      }

      if (hasShake(e, boostEvent)) {
        this.isMoving = true;

        boostEvent.shaked = true;

        dragstart();
        drag(e);
      }
    };

    const over = () => {
      if (this.lastSensor) {
        this.lastSensor.deactive();
      }
      this.lastSensor = null;
      this.isNewBie = false;
      this.boosted = false;

      let exception;
      if (this.isMoving) {
        try {
          this.emitter.emit('dragend', dragment, this.lastLocation, Cursor.isCopy());
        } catch (ex) {
          exception = ex;
        }
      }

      this.isMoving = false;
      this.lastLocation = null;

      document.removeEventListener('mousemove', move, true);
      document.removeEventListener('mouseup', over, true);
      document.removeEventListener('keydown', checkesc, false);
      document.removeEventListener('keydown', checkcopy, false);
      document.removeEventListener('keyup', checkcopy, false);
      Flags.setDragMode(false);
      Cursor.release();
      if (exception) {
        throw exception;
      }
    };

    document.addEventListener('mousemove', move, true);
    document.addEventListener('mouseup', over, true);
    document.addEventListener('keydown', checkcopy, false);
    document.addEventListener('keyup', checkcopy, false);
  }

  public inDragging() {
    return this.isMoving;
  }

  public addSensor(sensor: any) {
    this.sensors.push(sensor);
  }

  public removeSensor(sensor: any) {
    const i = this.sensors.indexOf(sensor);
    if (i > -1) {
      this.sensors.splice(i, 1);
    }
  }

  public chooseSensor(e: MouseEvent) {
    let useSensor;
    if (this.isNewBie && !this.lastLocation) {
      useSensor = this.sensors.find((sensor) => sensor.isEnabled() && sensor.isEnter(e));
    } else {
      useSensor = this.sensors.find((sensor) => sensor.isEnabled() && sensor.isInRange(e))
        || this.lastSensor;
    }
    if (useSensor !== this.lastSensor) {
      if (this.lastSensor) {
        this.lastSensor.deactive();
      }
      this.lastSensor = useSensor;
    }
    return useSensor;
  }

  public setEnabled(value: boolean) {
    this.enabled = value;
  }

  public onDragstart(func: (e: any, dragment: any) => any) {
    this.emitter.on('dragstart', func);
    return () => {
      this.emitter.removeListener('dragstart', func);
    };
  }

  public onDrag(func: (e: any, dragment: any, location: Location) => any) {
    this.emitter.on('drag', func);
    return () => {
      this.emitter.removeListener('drag', func);
    };
  }

  public onDragend(func: (dragment: any, location: Location, copy: any) => any) {
    this.emitter.on('dragend', func);
    return () => {
      this.emitter.removeListener('dragend', func);
    };
  }
}

export default new DragEngine();
