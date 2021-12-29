import * as EventEmitter from 'events';
import DragEngine from './dragengine';
import { Insertion, Location } from './location';
import { Node } from './pages/node';

export class Exchange {

  public emitter: EventEmitter;
  public draggingNode: Node;
  public droppingNode: Node;
  public selectedNode: Node;
  public hoveringNode: Node;
  public lockingNode: Node;
  public inPlaceEditingNode: Node;

  constructor() {
    this.emitter = new EventEmitter();
    this.draggingNode = null;
    this.droppingNode = null;
    this.selectedNode = null;
    this.hoveringNode = null;
    this.lockingNode = null;
    this.inPlaceEditingNode = null;

    DragEngine.onDragstart((e: any, dragment: any) => {
      this.select(null);
      this.hover(null);
      if (dragment.isNode) {
        this.dragging(dragment);
      }
    });

    DragEngine.onDrag((e: any, dragment: any, location: Location) => {
      if (location) {
        this.dropping(location.getContainer(), location.getInsertion());
      } else {
        this.dropping(null);
      }
    });

    DragEngine.onDragend((dragment: any, location: Location, copy: any) => {
      this.dragging(null);
      this.dropping(null);
      if (dragment.isMetadata) {
        return;
      }
      if (location) {
        if (copy && dragment.toData) {
          dragment = dragment.toData();
        }
        const node = location.getContainer()
          .insert(dragment, location.getInsertion());
        if (node) {
          this.select(node);
        }
      }
    });
  }

  public purge(node?: any) {
    if (node) {
      if (this.draggingNode === node) {
        this.dragging(null);
      } else if (this.droppingNode === node) {
        this.dropping(null);
      } else if (this.selectedNode === node) {
        this.select(null);
      } else if (this.hoveringNode === node) {
        this.hover(null);
      }
    } else {
      this.dragging(null);
      this.dropping(null);
      this.select(null);
      this.hover(null);
      this.lock(null);
    }
  }

  public hover(node: any) {
    while (node && !node.canHovering()) {
      node = node.getParent();
    }
    if (node === this.draggingNode || node === this.droppingNode) {
      node = null;
    }
    if (this.hoveringNode === node) {
      return;
    }
    if (this.hoveringNode) {
      this.hoveringNode.setStatus('hovering', false);
    }
    if (node) {
      node.setStatus('hovering', true);
    }
    this.hoveringNode = node;
    this.emitter.emit('hoveringchange', this.hoveringNode);
  }

  public getHovering() {
    return this.hoveringNode;
  }

  public select(node: any) {
    while (node && !node.canSelecting()) {
      node = node.getParent();
    }
    if (node) {
      this.emitter.emit('intoview', node);
    }
    if (this.lockingNode && this.lockingNode !== node) {
      this.lock(null);
    }
    if (this.selectedNode === node) {
      return;
    }
    if (this.selectedNode) {
      this.selectedNode.setStatus('selected', false);
    }

    if (node) {
      this.hoveringNode = node;
      node.setStatus('selected', true);
      node.setStatus('hovering', true);
    }
    this.selectedNode = node;
    this.emitter.emit('selectedchange', this.selectedNode);
  }

  public getSelected() {
    return this.selectedNode;
  }

  public dropping(node: any, insertion?: Insertion) {
    if (node) {
      this.emitter.emit('intoview', node, insertion);
    }
    if (this.droppingNode && this.droppingNode !== node) {
      this.droppingNode.setStatus('dropping', false);
    }
    if (node) {
      this.select(null);
      this.hover(null);
      node.setStatus('dropping', insertion);
    }
    this.droppingNode = node;
    this.emitter.emit('droppingchange', this.droppingNode);
  }

  public getDropping() {
    return this.droppingNode;
  }

  public dragging(node: any) {
    if (this.draggingNode === node) {
      return;
    }
    if (this.draggingNode) {
      this.draggingNode.setStatus('dragging', false);
    }
    if (node) {
      this.dropping(null);
      this.select(null);
      this.hover(null);
      node.setStatus('dragging', true);
    }
    this.draggingNode = node;
    this.emitter.emit('draggingchange', this.draggingNode);
  }

  public lock(node: Node) {
    this.setNodeStatus(node, 'locking');
  }

  public inPlaceEdit(node: Node) {
    this.setNodeStatus(node, 'inPlaceEditing');
  }

  public getInPlaceEditing() {
    return this.inPlaceEditingNode;
  }

  public getLocking() {
    return this.lockingNode;
  }

  public onInPlaceEditingChange(func: () => any) {
    this.emitter.on('inPlaceEditingchange', func);
    return () => {
      this.emitter.removeListener('inPlaceEditingchange', func);
    };
  }

  public onHoveringChange(func: () => any) {
    this.emitter.on('hoveringchange', func);
    return () => {
      this.emitter.removeListener('hoveringchange', func);
    };
  }

  public onSelectedChange(func: () => any) {
    this.emitter.on('selectedchange', func);
    return () => {
      this.emitter.removeListener('selectedchange', func);
    };
  }

  public onDroppingChange(func: () => any) {
    this.emitter.on('droppingchange', func);
    return () => {
      this.emitter.removeListener('droppingchange', func);
    };
  }

  public onDraggingChange(func: () => any) {
    this.emitter.on('draggingchange', func);
    return () => {
      this.emitter.removeListener('draggingchange', func);
    };
  }

  public onLockingChange(func: () => any) {
    this.emitter.on('lockingchange', func);
    return () => {
      this.emitter.removeListener('lockingchange', func);
    };
  }

  public onIntoView(func: (node: any, insertion: Insertion) => any) {
    this.emitter.on('intoview', func);
    return () => {
      this.emitter.removeListener('intoview', func);
    };
  }

  private setNodeStatus(node: Node, status: 'locking' | 'inPlaceEditing') {
    const nodeHolder: 'lockingNode' | 'inPlaceEditingNode' = (
      status === 'locking' ? 'lockingNode' : 'inPlaceEditingNode');
    if (this[nodeHolder] === node) {
      return;
    }
    if (this[nodeHolder]) {
      this[nodeHolder].setStatus(status, false);
      this[nodeHolder] = null;
    }
    if (node) {
      this.select(node);
      node.setStatus(status, true);
    }
    this[nodeHolder] = node;
    this.emitter.emit(`${status}change`, this[nodeHolder]);
  }
}

export default new Exchange();
