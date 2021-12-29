import HoveringCapture from './hoveringcapture';
import InsertionGhost from './insertionghost';
import OutlineSync from './outlinesync';
import Watcher from './watcher';

class Overlay {

  public hoveringLine: OutlineSync;
  public droppingLine: OutlineSync;
  public selectedLine: OutlineSync;
  public inPlaceEditingPoint: OutlineSync;

  public insertionGhost: InsertionGhost;
  public hoveringCapture: HoveringCapture;

  public touch(delay?: boolean) {
    Watcher.touch(delay);
  }

  public getHoveringLine(): OutlineSync {
    if (!this.hoveringLine) {
      this.hoveringLine = new OutlineSync('Hovering');
    }
    return this.hoveringLine;
  }

  public getDroppingLine() {
    if (!this.droppingLine) {
      this.droppingLine = new OutlineSync('Dropping');
    }
    return this.droppingLine;
  }

  public getSelectedLine(): OutlineSync{
    if (!this.selectedLine) {
      this.selectedLine = new OutlineSync('Selected');
    }
    return this.selectedLine;
  }

  public getInPlaceEditingPoint(): OutlineSync {
    if (!this.inPlaceEditingPoint) {
      this.inPlaceEditingPoint = new OutlineSync('InPlaceEditing');
    }
    return this.inPlaceEditingPoint;
  }

  public getInsertionGhost(): InsertionGhost {
    if (!this.insertionGhost) {
      this.insertionGhost = new InsertionGhost();
    }
    return this.insertionGhost;
  }

  public getHoveringCapture(): HoveringCapture {
    if (!this.hoveringCapture) {
      this.hoveringCapture = new HoveringCapture();
    }
    return this.hoveringCapture;
  }
}

export default new Overlay();
