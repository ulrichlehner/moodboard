import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Store } from '@ngrx/store';
import 'fabric';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { debounceTime, skip, take } from 'rxjs/operators';
import * as UUID from 'uuidjs';
import * as artifactActions from '../store/actions/artifact.actions';
import * as spaceActions from '../store/actions/space.actions';
import {
  ArtifactState,
  selectAllArtifacts
} from '../store/reducers/artifact.reducer';
import { selectAllSpaces } from '../store/reducers/space.reducer';
import { Artifact } from './../models/artifact';
import { Space } from './../models/space';
import { selectActiveSpace } from './../store/reducers/space.reducer';

declare const fabric: any;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, OnDestroy {
  //#region Config

  /* left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36 */
  private static readonly keys = { 37: 1, 38: 1, 39: 1, 40: 1 };

  private readonly attachmentImageMimeType = 'image/webp';
  private readonly attachmentImageQuality = 0.6;
  private readonly attachmentImageMaxSide = 1600;

  private readonly canvasMinZoom = 0.05;

  private readonly acceptedMimeTypes = {
    'image/png': true,
    'image/jpeg': true,
    'image/gif': true
  };

  private readonly artifactShadow = {
    color: 'rgba(0, 0, 0, 0.4)',
    blur: 30,
    offsetX: 0,
    offsetY: 5
  };

  //#endregion

  //#region Member variables
  spaces$: Observable<Space[]>;
  activeSpace$: Observable<Space>;
  artifacts$: Observable<Artifact[]>;

  artifacts: Artifact[];
  activeSpace: Space;

  artifactSubscription: Subscription;
  spaceSubscription: Subscription;

  fabricCanvas = null;
  domCanvas;

  lastX;
  lastY;
  dragStartPosition;
  saveProgress = 0;
  lastCanvasViewportTransform = [];

  isSpacePressed = false;
  isDragOver = false;

  drawnPathObjects = new Array();
  activeSession;

  //#endregion

  //#region Disable scrolling

  // Based on http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-

  static preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  }

  static preventDefaultForScrollKeys(e) {
    if (CanvasComponent.keys[e.keyCode]) {
      CanvasComponent.preventDefault(e);
      return false;
    }
  }

  static disableScroll() {
    if (window.addEventListener) {
      // older FF
      window.addEventListener(
        'DOMMouseScroll',
        CanvasComponent.preventDefault,
        false
      );
    }
    window.onwheel = CanvasComponent.preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel =
      CanvasComponent.preventDefault; // older browsers, IE
    window.ontouchmove = CanvasComponent.preventDefault; // mobile
    document.onkeydown = CanvasComponent.preventDefaultForScrollKeys;
  }

  static enableScroll() {
    if (window.removeEventListener) {
      window.removeEventListener(
        'DOMMouseScroll',
        CanvasComponent.preventDefault,
        false
      );
    }
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
  }
  //#endregion

  //#region Component lifecylce event handlers
  constructor(private store: Store<ArtifactState>) {}

  ngOnInit() {
    CanvasComponent.disableScroll();
    this.initCanvas();

    this.spaces$ = this.store.select(selectAllSpaces);
    this.activeSpace$ = this.store.select(selectActiveSpace);
    this.artifacts$ = this.store.select(selectAllArtifacts);

    this.store.dispatch(new spaceActions.Load());
    this.store.dispatch(new artifactActions.Load());

    this.artifactSubscription = this.artifacts$.subscribe(
      (artifacts: Artifact[]) => {
        this.artifacts = artifacts;
        this.syncCanvas(artifacts);
      }
    );

    // skip(1) as this is called initially
    // see https://stackoverflow.com/questions/42698785/ngrx-subscription-to-store-called-once-its-created
    this.spaceSubscription = this.activeSpace$
      .pipe(skip(1))
      .subscribe((space: Space) => {
        this.activeSpace = space;
        this.lastCanvasViewportTransform = space.viewportTransform;
        this.fabricCanvas.setViewportTransform(space.viewportTransform);
      });
  }

  ngOnDestroy() {
    CanvasComponent.enableScroll();
    this.artifactSubscription.unsubscribe();
    this.spaceSubscription.unsubscribe();
  }
  //#endregion

  //#region Canvas initializing
  initCanvas() {
    const canvasDomWidth = document.getElementById('canvas-wrapper')
      .clientWidth;
    const canvasDomHeight = document.getElementById('canvas-wrapper')
      .clientHeight;

    if (!this.fabricCanvas) {
      this.fabricCanvas = new fabric.Canvas('canvas', {
        noScaleCache: true
      });

      this.fabricCanvas.setBackgroundColor(
        {
          source: '/assets/img/background-pattern/background-pattern-14.png',
          repeat: 'repeat'
        },
        this.fabricCanvas.renderAll.bind(this.fabricCanvas)
      );

      this.fabricCanvas.on('object:modified', event => {
        this.updateArtifact(event.target);
      });

      // Debounce time to prevent fireing too often
      fromEvent(this.fabricCanvas, 'after:render')
        .pipe(debounceTime(250))
        .subscribe(() => {
          this.updateCanvasViewportTransform();
        });
    }

    // take index [1] since fabric.js produces an extra canvas (buffer technique?)
    this.domCanvas = document.getElementsByTagName('canvas')[1];
    this.domCanvas.width = canvasDomWidth;
    this.domCanvas.height = canvasDomHeight;
    this.fabricCanvas.setWidth(canvasDomWidth);
    this.fabricCanvas.setHeight(canvasDomHeight);

    this.lastX = this.domCanvas.width / 2;
    this.lastY = this.domCanvas.height / 2;
  }
  //#endregion

  //#region Canvas manipulation
  translate(x, y) {
    this.fabricCanvas.relativePan({ x: x, y: y });
  }

  zoom(originX, originY, delta) {
    const zoom = this.fabricCanvas.getZoom() + delta / 20;
    this.fabricCanvas.zoomToPoint(
      { x: originX, y: originY },
      zoom < this.canvasMinZoom ? this.canvasMinZoom : zoom
    );
  }

  resetView() {}

  setCanvasObjectsSelectable(isSelectable: boolean) {
    this.fabricCanvas.selection = isSelectable;
  }

  // http://fabricjs.com/manage-selection
  selectAllCanvasObjects() {
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.setActiveObject(
      new fabric.ActiveSelection(this.fabricCanvas.getObjects(), {
        canvas: this.fabricCanvas
      })
    );
    this.fabricCanvas.requestRenderAll();
  }

  unselectAllCanvasObjects() {
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
  }

  syncCanvas(artifacts: Artifact[]) {
    if (artifacts.length < this.fabricCanvas.getObjects().length) {
      if (artifacts.length === 0) {
        this.fabricCanvas.forEachObject((canvasObject: any) => {
          this.fabricCanvas.remove(canvasObject);
        });
      } else {
        this.fabricCanvas.forEachObject((canvasObject: any) => {
          const tmpObjects = artifacts.filter(
            artifact => (canvasObject ? artifact.id === canvasObject.id : true)
          );

          if (tmpObjects.length === 0) {
            this.fabricCanvas.remove(canvasObject);
            this.fabricCanvas.discardActiveObject();
          }
        });
      }
    } else {
      artifacts.forEach((artifact: Artifact) => {
        const object = this.fabricCanvas
          .getObjects()
          .filter(obj => obj.id === artifact.id);

        if (object.length === 0) {
          this.addArtifactToCanvas(artifact);
        }
      });
    }
  }
  //#endregion

  //#region Data manipulation

  deleteArtifact() {
    if (this.fabricCanvas.getActiveObjects()) {
      this.fabricCanvas
        .getActiveObjects()
        .forEach((obj: any) =>
          this.store.dispatch(new artifactActions.Delete(obj.id))
        );
    }
  }

  addArtifactToCanvas(artifact: Artifact, next?: Function) {
    if (artifact._attachments) {
      for (const key in artifact._attachments) {
        if (artifact._attachments[key]) {
          let imgObj = new Image();
          imgObj.src = URL.createObjectURL(artifact._attachments[key].data);
          imgObj.onload = () => {
            const img = new fabric.Image(imgObj);
            img
              .set({
                id: artifact.id,
                angle: artifact.transform.angle,
                left: artifact.transform.x,
                top: artifact.transform.y,
                lockUniScaling: true,
                name: artifact.name,
                centeredRotation: true
              })
              .scale(artifact.transform.scale)
              .setShadow(this.artifactShadow);
            this.fabricCanvas.insertAt(img, artifact.transform.order);

            // Release image object
            imgObj.remove();
            imgObj = null;

            if (next) {
              next();
            }
          };
        }
      }
    }
  }

  saveFiles(fileList: FileList) {
    if (fileList.length) {
      let artifactCnt = 0;
      const startOffsetY = this.artifacts.filter(
        (a: Artifact) =>
          a.updateDate > this.activeSpace.updateDate &&
          a.updateDate === a.createDate
      ).length;
      for (let i = 0; i < fileList.length; i++) {
        const file: File = fileList[i];
        if (this.acceptedMimeTypes[file.type]) {
          const imgEl: HTMLImageElement = new Image();
          imgEl.src = URL.createObjectURL(file);
          imgEl.onload = () => {
            // Resize image
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (imgEl.width > imgEl.height) {
              canvas.width = this.attachmentImageMaxSide;
              canvas.height = canvas.width * (imgEl.height / imgEl.width);
            } else {
              canvas.height = this.attachmentImageMaxSide;
              canvas.width = canvas.height * (imgEl.width / imgEl.height);
            }

            ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

            const bounds = this.fabricCanvas.calcViewportBoundaries();
            const id: string = UUID.generate();
            const date = new Date();
            const distance = 10 / this.fabricCanvas.getZoom();
            const artifact: Artifact = {
              id: id,
              name: `Artifact @${id}`,
              transform: {
                order: this.artifacts.length + artifactCnt,
                x: bounds.tl.x + distance,
                y:
                  bounds.tl.y +
                  (startOffsetY + artifactCnt++) * distance +
                  distance,
                angle: 0,
                scale: 0.1 / this.fabricCanvas.getZoom()
              },
              createDate: date,
              updateDate: date,
              _attachments: {}
            };
            canvas.toBlob(
              (result: Blob) => {
                artifact._attachments[
                  `${id}${this.getExtensionFromType(result.type)}`
                ] = {
                  content_type: result.type,
                  data: result
                };

                this.addArtifactToCanvas(artifact, () => {
                  this.store.dispatch(new artifactActions.Create(artifact));
                });

                canvas.remove();
              },
              this.attachmentImageMimeType,
              this.attachmentImageQuality
            );
          };
        } else {
          console.warn(`File type ${file.type} is not supported`);
        }
      }
    }
  }

  sendObject(where) {
    if (this.fabricCanvas.getActiveObjects()) {
      let sendingPerformed = false;
      this.fabricCanvas.getActiveObjects().forEach((obj: any) => {
        switch (where) {
          case 'backward':
            this.fabricCanvas.sendBackwards(obj);
            sendingPerformed = true;
            break;
          case 'back':
            this.fabricCanvas.sendToBack(obj);
            sendingPerformed = true;
            break;
          case 'forward':
            this.fabricCanvas.bringForward(obj);
            sendingPerformed = true;
            break;
          case 'front':
            this.fabricCanvas.bringToFront(obj);
            sendingPerformed = true;
            break;
        }
      });

      if (sendingPerformed) {
        this.updateArtifact(this.fabricCanvas.getObjects());
      }
    }
  }

  updateArtifact(selection: any | Array<any>) {
    let objects = [];
    if (selection._objects) {
      objects = selection._objects;
    } else if (selection.id) {
      objects.push(selection);
    } else {
      objects = selection;
    }

    // save data
    const currentObjects = this.fabricCanvas.toJSON().objects; // needed for correct coordinates
    for (let i = 0; i < objects.length; i++) {
      const id = objects[i].id;
      const object =
        currentObjects[this.fabricCanvas.getObjects().indexOf(objects[i])];
      if (object) {
        this.store.dispatch(
          new artifactActions.Update(id, {
            transform: {
              scale: object.scaleX,
              angle: object.angle,
              x: object.left,
              y: object.top,
              order: this.fabricCanvas.getObjects().indexOf(objects[i])
            }
          })
        );
      }
    }
  }

  updateCanvasViewportTransform() {
    if (
      this.lastCanvasViewportTransform.length !==
        this.fabricCanvas.viewportTransform.length ||
      !this.isArrayEqual(
        this.lastCanvasViewportTransform,
        this.fabricCanvas.viewportTransform
      )
    ) {
      this.lastCanvasViewportTransform = this.fabricCanvas.viewportTransform.slice();
      this.activeSpace$.pipe(take(1)).subscribe(space => {
        if (space) {
          this.store.dispatch(
            new spaceActions.Update(space.id, {
              viewportTransform: this.lastCanvasViewportTransform,
              updateDate: new Date()
            })
          );
        } else {
          console.warn('No space found');
        }
      });
    }
  }
  //#endregion

  //#region Event handlers
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.initCanvas();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event) {
    switch (event.keyCode) {
      case 32:
        // SPACE
        this.isSpacePressed = false;
        this.dragStartPosition = null;
        this.setCanvasObjectsSelectable(true);
        break;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event) {
    // prevent browser shortcuts to interfer with app
    event.preventDefault();

    // Key-combos
    if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      this.selectAllCanvasObjects();
    } else if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
      this.unselectAllCanvasObjects();
    } else {
      switch (event.keyCode) {
        case 32: // SPACE
          this.isSpacePressed = true;
          this.setCanvasObjectsSelectable(false);
          break;
        case 88: // 'x'
          this.deleteArtifact();
          break;
        case 8: // BACKSPACE
          if (this.fabricCanvas.isDrawingMode) {
            // this.undoDrawing();
          } else {
            this.deleteArtifact();
          }
          break;
        case 46: // DELETE
          this.deleteArtifact();
          break;
        case 38: // UP ARROW
          this.sendObject('forward');
          break;
        case 40: // DOWN ARROW
          this.sendObject('backward');
          break;
        case 33: // PAGE UP
          this.sendObject('front');
          break;
        case 34: // PAGE DOWN
          this.sendObject('back');
          break;
        case 13: // ENTER
          if (this.fabricCanvas.isDrawingMode) {
            // disableDrawing();
            // saveDrawing();
          }
          break;
        case 27: // ESCAPE
          if (this.fabricCanvas.isDrawingMode) {
            // cancelDrawing();
            // disableDrawing();
          }
          break;
        case 68: // 'D'
          if (!this.fabricCanvas.isDrawingMode) {
            // enableDrawing();
          }
          break;
      }
    }
  }

  // @HostListener('window:scroll', ['$event'])
  mouseWheel(event: any) {
    if (this.isSpacePressed) {
      const delta = event.wheelDelta
        ? event.wheelDelta / 40
        : event.detail ? -event.detail : 0;
      const originX = event.offsetX || event.pageX - this.domCanvas.offsetLeft;
      const originY = event.offsetY || event.pageY - this.domCanvas.offsetTop;

      this.zoom(originX, originY, delta);
    }
  }

  mouseDown(event) {
    if (this.isSpacePressed) {
      document.body.style.msUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect =
        'none';
      this.lastX = event.offsetX || event.pageX - this.domCanvas.offsetLeft;
      this.lastY = event.offsetY || event.pageY - this.domCanvas.offsetTop;
      this.dragStartPosition = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseMove(event) {
    if (this.dragStartPosition) {
      this.lastX = event.offsetX || event.pageX - this.domCanvas.offsetLeft;
      this.lastY = event.offsetY || event.pageY - this.domCanvas.offsetTop;
      this.translate(
        this.lastX - this.dragStartPosition.x,
        this.lastY - this.dragStartPosition.y
      );
      this.dragStartPosition = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseUp(event) {
    if (this.dragStartPosition) {
      this.dragStartPosition = null;
    }
  }

  uploadFile(event) {
    this.saveFiles(event.target.files);
  }

  dragOver() {
    this.isDragOver = true;
  }

  dragEnd() {
    this.isDragOver = false;
  }

  // See also https://stackoverflow.com/questions/45941730/using-fabric-js-with-angular-4
  drop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.saveFiles(event.dataTransfer.files);
    this.isDragOver = false;
  }
  //#endregion

  //#region Helper methods
  getExtensionFromType(type: string) {
    switch (type) {
      case 'image/gif':
        return '.gif';
      case 'image/png':
        return '.png';
      case 'image/jpeg':
        return '.jpeg';
      case 'image/webp':
        return '.webp';
      default:
        return '';
    }
  }

  isArrayEqual(a: Array<any>, b: Array<any>): boolean {
    return a.every((e, i) => e === b[i]);
  }
  //#endregion
}
