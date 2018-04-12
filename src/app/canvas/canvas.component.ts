import { selectActiveSpace } from './../store/reducers/space.reducer';
import { Space } from './../models/space';
import { skip, debounceTime, take } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { selectAllArtifacts, selectActiveArtifact, ArtifactState } from '../store/reducers/artifact.reducer';
import { Store } from '@ngrx/store';
import { Artifact } from './../models/artifact';
import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy } from '@angular/core';
import 'fabric';
import * as artifactActions from '../store/actions/artifact.actions';
import * as spaceActions from '../store/actions/space.actions';
import * as UUID from 'uuidjs';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { selectAllSpaces } from '../store/reducers/space.reducer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const fabric: any;

// Fabric w/ Angular -> https://stackoverflow.com/questions/45941730/using-fabric-js-with-angular-4

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, OnDestroy {

  //#region Config

  // left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
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

  artifactSubscription: Subscription;
  spaceSubscription: Subscription;

  fabricCanvas = null;
  domCanvas;

  lastX;
  lastY;
  dragStartPosition;
  saveProgress = 0;
  canvasViewportTransform = [];

  isSpacePressed = false;
  isSelectionEnabled = true;
  isDragOver = false;

  // splashScreen = $('.splash-screen');
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
    if (window.addEventListener) { // older FF
      window.addEventListener('DOMMouseScroll', CanvasComponent.preventDefault, false);
    }
    window.onwheel = CanvasComponent.preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel = CanvasComponent.preventDefault; // older browsers, IE
    window.ontouchmove = CanvasComponent.preventDefault; // mobile
    document.onkeydown = CanvasComponent.preventDefaultForScrollKeys;
  }

  static enableScroll() {
    if (window.removeEventListener) {
      window.removeEventListener('DOMMouseScroll', CanvasComponent.preventDefault, false);
    }
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
  }
  //#endregion

  //#region Lifecylce events
  constructor(private store: Store<ArtifactState>) { }

  ngOnInit() {
    CanvasComponent.disableScroll();
    this.initCanvas();

    // this.createDemoObjects();
    this.spaces$ = this.store.select(selectAllSpaces);
    this.activeSpace$ = this.store.select(selectActiveSpace);
    this.activeSpace$.subscribe();
    this.artifacts$ = this.store.select(selectAllArtifacts);

    this.store.dispatch(new spaceActions.Load());
    this.store.dispatch(new artifactActions.Load());

    // this.activeSpace$.pipe(take(1)).subscribe(space => {
    //   this.canvasViewportTransform = space.viewportTransform;
    //   console.log(this.canvasViewportTransform);
    // });

    this.artifactSubscription = this.artifacts$.subscribe((artifacts: Artifact[]) => {
      this.syncCanvas(artifacts);
    });

    // skip(1) as this is called initially
    // see https://stackoverflow.com/questions/42698785/ngrx-subscription-to-store-called-once-its-created
    this.spaceSubscription = this.activeSpace$.pipe(skip(1)).subscribe((space: Space) => {
      this.fabricCanvas.setViewportTransform(space.viewportTransform);
    });
  }

  ngOnDestroy() {
    CanvasComponent.enableScroll();
    this.artifactSubscription.unsubscribe();
  }
  //#endregion

  //#region Canvas initializing
  initCanvas() {
    const canvasDomWidth = document.getElementById('canvas-wrapper').clientWidth;
    const canvasDomHeight = document.getElementById('canvas-wrapper').clientHeight;

    if (this.fabricCanvas == null) {
      this.fabricCanvas = new fabric.Canvas('canvas', {
        noScaleCache: true
      });

      // extend fabricjs with show/hide functionality
      // see https://groups.google.com/d/msg/fabricjs/cbdFgTH7UXc/jj6iVoNYmVUJ
      fabric.Object.prototype.hide = function () {
        this.set({
          opacity: 0,
          selectable: false
        });
      };

      fabric.Object.prototype.show = function () {
        this.set({
          opacity: 1,
          selectable: true
        });
      };

      // this.fabricCanvas.on('selection:cleared', function (event) {
      //   // $('#btn-delete-media').addClass('hide');
      // });

      // this.fabricCanvas.on('selection:created', function (event) {
      //   // $('#btn-delete-media').removeClass('hide');
      // });

      // this.fabricCanvas.on('object:selected', function (event) {
      //   // $('#btn-delete-media').removeClass('hide');
      // });

      this.fabricCanvas.on('object:modified', (event) => {
        this.objectModified(event);
      });

      // this.fabricCanvas.on('object:added', function (event) {
      // });

      // this.fabricCanvas.on('object:removed', function (event) {
      // });

      // fromEvent(this.fabricCanvas, 'object:modified').subscribe(this.objectModified);

      // this.fabricCanvas.on('path:created', function (event) {
      //   if (this.fabricCanvas.isDrawingMode) {
      //     // console.log("free-drawing path created");

      //     // save path in array to merge when drawing finished
      //     this.drawnPathObjects.push(event.path);

      //     this.fabricCanvas.renderAll();
      //   }
      // });

      // Debounce time to prevent fireing too often
      fromEvent(this.fabricCanvas, 'after:render').pipe(debounceTime(250)).subscribe(() => {
        this.afterRender();
      });
    }

    // take index [1] since fabric.js produces an extra canvas (buffer technique?)
    this.domCanvas = document.getElementsByTagName('canvas')[1];
    this.domCanvas.width = canvasDomWidth;
    this.domCanvas.height = canvasDomHeight;
    this.fabricCanvas.setWidth(canvasDomWidth);
    this.fabricCanvas.setHeight(canvasDomHeight);

    this.lastX = this.domCanvas.width / 2,
    this.lastY = this.domCanvas.height / 2;

    // window.addEventListener('beforeunload', this.postSessionCanvas);

    // console.log('canvas initialized (w: ' + canvasDomWidth + 'px, h: ' + canvasDomHeight + 'px)');
  }
  //#endregion

  //#region Canvas manipulation
  calculateBounds(objects?) {
    objects = objects || this.fabricCanvas.getObjects();

    const xCoords = [];
    const yCoords = [];

    objects.forEach(object => {
      const c = object.oCoords;
      xCoords.push(c.tl.x);
      xCoords.push(c.tr.x);
      xCoords.push(c.br.x);
      xCoords.push(c.bl.x);
      yCoords.push(c.tl.y);
      yCoords.push(c.tr.y);
      yCoords.push(c.br.y);
      yCoords.push(c.bl.y);
    });

    const minX = fabric.util.array.min(xCoords);
    const maxX = fabric.util.array.max(xCoords);
    const width = Math.abs(minX - maxX);

    const minY = fabric.util.array.min(yCoords);
    const maxY = fabric.util.array.max(yCoords);
    const height = Math.abs(minY - maxY);

    return {
      left: minX,
      top: minY,
      width: width,
      height: height
    };
  }

  translate(x, y) {
    this.fabricCanvas.relativePan({ x: x, y: y });
    // console.log(this.fabricCanvas.viewportTransform);
  }

  zoom(originX, originY, delta) {
    const zoom = this.fabricCanvas.getZoom() + delta / 20;
    this.fabricCanvas.zoomToPoint({ x: originX, y: originY }, zoom < this.canvasMinZoom ? this.canvasMinZoom : zoom);
    // console.log(this.fabricCanvas.viewportTransform);
  }

  // scale(scale) {
  //   const vcx = this.fabricCanvas.getWidth() / 2;
  //   const vcy = this.fabricCanvas.getHeight() / 2;

  //   this.translate(-vcx, -vcy);
  //   const objects: Array<any> = this.fabricCanvas.getObjects();
  //   objects.forEach(object => {
  //     const scaleX = object.scaleX;
  //     const scaleY = object.scaleY;
  //     const left = object.left;
  //     const top = object.top;

  //     const tempScaleX = scaleX * scale;
  //     const tempScaleY = scaleY * scale;
  //     const tempLeft = left * scale;
  //     const tempTop = top * scale;

  //     object.scaleX = tempScaleX;
  //     object.scaleY = tempScaleY;
  //     object.left = tempLeft;
  //     object.top = tempTop;

  //     object.setCoords();
  //   });
  //   this.translate(vcx, vcy);
  //   this.fabricCanvas.renderAll();
  // }

  resetView() {
    // this.fabricCanvas.discardActiveObject();
    // const bound = this.calculateBounds();

    // const vw = this.fabricCanvas.getWidth();
    // const vh = this.fabricCanvas.getHeight();
    // const vr = vw / vh;

    // const bw = bound.width;
    // const bh = bound.height;
    // const bx = bound.left;
    // const by = bound.top;
    // const br = bw / bh;

    // // Translate to center
    // const dx = vw / 2 - bx - bw / 2;
    // const dy = vh / 2 - by - bh / 2;
    // this.translate(dx, dy);

    // // Scale to fit bounds
    // const s = vr < br ? vw / bw : vh / bh;
    // this.scale(s * 0.95);

    // this.updateAllMedia();
  }

  sendObject(where) {
    if (this.fabricCanvas.getActiveObjects()) {
      this.fabricCanvas.getActiveObjects().forEach((obj: any) => {
        switch (where) {
          case 'backward':
            this.fabricCanvas.sendBackwards(obj);
            break;
          case 'back':
            this.fabricCanvas.sendToBack(obj);
            break;
          case 'forward':
            this.fabricCanvas.bringForward(obj);
            break;
          case 'front':
            this.fabricCanvas.bringToFront(obj);
            break;
        }
      });
      // this.fabricCanvas.discardActiveGroup().renderAll();
      // this.fabricCanvas.discardActiveObject();
      this.updateAllMedia();
    }
    // else if (this.fabricCanvas.getActiveObject()) {
    //   const obj = this.fabricCanvas.getActiveObject();
    //   switch (where) {
    //     case 'backward':
    //       this.fabricCanvas.sendBackwards(obj);
    //       break;
    //     case 'back':
    //       this.fabricCanvas.sendToBack(obj);
    //       break;
    //     case 'forward':
    //       this.fabricCanvas.bringForward(obj);
    //       break;
    //     case 'front':
    //       this.fabricCanvas.bringToFront(obj);
    //       break;
    //   }
    //   this.updateAllMedia();
    // }
  }

  setSelection(selection) {
    this.isSelectionEnabled = selection;
    this.fabricCanvas.selection = selection;
    const objects: Array<any> = this.fabricCanvas.getObjects();
    objects.forEach(object => {
      object.hasControls = selection;
      object.hasBorders = selection;
      object.selection = selection;
    });
  }

  // http://fabricjs.com/manage-selection
  selectAllCanvasObjects() {
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.setActiveObject(new fabric.ActiveSelection(this.fabricCanvas.getObjects(), {
      canvas: this.fabricCanvas,
    }));
    this.fabricCanvas.requestRenderAll();
  }

  unselectAllCanvasObjects() {
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
  }

  syncCanvas(artifacts: Artifact[]) {
    if (artifacts.length < this.fabricCanvas.getObjects().length) {
      // Artifact was deleted
      // const deletedObjects = [];
      if (artifacts.length === 0) {
        this.fabricCanvas.forEachObject((canvasObject: any) => {
          this.fabricCanvas.remove(canvasObject);
        });
      } else {
        this.fabricCanvas.forEachObject((canvasObject: any) => {
          const tmpObjects = artifacts.filter(artifact => canvasObject ? artifact.id === canvasObject.id : true);
          if (tmpObjects.length === 0) {
            // deletedObjects.push(obj);
            this.fabricCanvas.remove(canvasObject);
            this.fabricCanvas.discardActiveObject();
          }

        });
      }
      // if (deletedObjects.length > 0) {
      //   deletedObjects.forEach(object => {
      //     console.log(`${object.name} was deleted`);
      //   });
      // }

    } else {
      artifacts.forEach((artifact: Artifact) => {
        // console.log(artifact);
        const object = this.fabricCanvas.getObjects().filter(obj => obj.id === artifact.id);
        if (object.length === 0) {
          this.addArtifactToCanvas(artifact);
        }
        // else {
        //   console.log(`update needed (${artifact._rev})`);
        //   object._rev = artifact._rev;
        // }
      });
    }
  }
  //#endregion

  //#region Data manipulation
  updateAllMedia() {
    // update all media
    // var objects = fabricCanvas.getObjects();
    // for (i in objects) {
    //   updateMedia(objects[i]);
    // }
  }

  updateMedia(media) {
    // var arr = [];
    // var isGroup = false;
    // if (media._objects) {
    //   arr = media._objects;
    //   isGroup = true;
    // } else {
    //   arr.push(media);
    // }

    // // save data
    // for (var i = 0; i < arr.length; i++) {
    //   var name = arr[i].name;
    //   var obj = fabricCanvas.toJSON().objects[fabricCanvas.getObjects().indexOf(arr[i])];
    //   if (obj != null) {
    //     socket.emit('update media', {
    //       name: name,
    //       scale: obj.scaleX,
    //       angle: obj.angle,
    //       x: arr.length > 1 ? obj.left : media.oCoords.tl.x,
    //       y: arr.length > 1 ? obj.top : media.oCoords.tl.y,
    //       order: fabricCanvas.getObjects().indexOf(arr[i])
    //     });
    //   }
    // }
  }

  deleteArtifact() {
    if (this.fabricCanvas.getActiveObjects()) {
      this.fabricCanvas.getActiveObjects().forEach((obj: any) => this.store.dispatch(new artifactActions.Delete(obj.id)));
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
            img.set({
              id: artifact.id,
              angle: artifact.transform.angle,
              left: artifact.transform.x,
              top: artifact.transform.y,
              lockUniScaling: true,
              name: artifact.name,
              centeredRotation: true,
              // PouchDB fields
              // _id: artifact.id,
              // _rev: artifact._rev
            }).scale(artifact.transform.scale).setShadow(this.artifactShadow);
            // this.fabricCanvas.centerObject(img);
            this.fabricCanvas.add(img);

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

            const id: string = UUID.generate();
            const artifact: Artifact = {
              id: id,
              name: `Artifact @${id}`,
              transform: {
                order: 0,
                x: 10,
                y: 10,
                angle: 0,
                scale: 0.1
              },
              createDate: new Date(),
              updateDate: new Date(),
              _attachments: {}
            };
            canvas.toBlob((result: Blob) => {
              artifact._attachments[`${id}${this.getExtensionFromType(result.type)}`] = {
                content_type: result.type,
                data: result
              };

              this.addArtifactToCanvas(artifact, () => {
                this.store.dispatch(new artifactActions.Create(artifact));
              });

              canvas.remove();
            }, this.attachmentImageMimeType, this.attachmentImageQuality);
          };
        } else {
          console.warn(`File type ${file.type} is not supported`);
        }
      }
    }
  }

  //#endregion

  //#region User input events
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
        this.setSelection(true);
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
          this.setSelection(false);
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
    // event.preventDefault();

    if (this.isSpacePressed) {
      // this.fabricCanvas.discardActiveObject();
      const delta = event.wheelDelta ? event.wheelDelta / 40 : event.detail ? -event.detail : 0;
      const originX = event.offsetX || (event.pageX - this.domCanvas.offsetLeft);
      const originY = event.offsetY || (event.pageY - this.domCanvas.offsetTop);

      this.zoom(originX, originY, delta);

      // save current state
      this.updateAllMedia();

      // return event.preventDefault() && false;
    }
  }

  mouseDown(event) {
    if (this.isSpacePressed) {
      document.body.style.msUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
      this.lastX = event.offsetX || (event.pageX - this.domCanvas.offsetLeft);
      this.lastY = event.offsetY || (event.pageY - this.domCanvas.offsetTop);
      this.dragStartPosition = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseMove(event) {
    if (this.dragStartPosition) {
      this.lastX = event.offsetX || (event.pageX - this.domCanvas.offsetLeft);
      this.lastY = event.offsetY || (event.pageY - this.domCanvas.offsetTop);
      this.translate(this.lastX - this.dragStartPosition.x, this.lastY - this.dragStartPosition.y);
      this.dragStartPosition = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseUp(event) {
    if (this.dragStartPosition) {
      // save current state
      this.updateAllMedia();
      this.dragStartPosition = null;
    }
  }

  uploadFile(event) {
    this.saveFiles(event.target.files);
  }

  objectModified(event) {
    // console.log(event);
    // if (event.target.id) {
    //   this.store.dispatch(new ArtifactActions.Update(event.target.id, {
    //     _id: event.target.id,
    //     // _rev: event.target._rev,
    //     transform: {
    //       scale: event.target.scaleX,
    //       angle: event.target.angle,
    //       x: event.target.left,
    //       y: event.target.top,
    //       order: 0
    //     }
    //   }));
    // } else if (event.target._objects && event.target._objects.length > 0) {
    //   event.target._objects.forEach(object => {
    //     this.store.dispatch(new ArtifactActions.Update(object.id, {
    //       _id: object.id,
    //       // _rev: object._rev,
    //       transform: {
    //         scale: object.scaleX,
    //         angle: object.angle,
    //         x: object.left,
    //         y: object.top,
    //         order: 0
    //       }
    //     }));
    //   });
    // }

    const media = event.target;
    let arr = [];
    let isGroup = false;
    if (media._objects) {
      arr = media._objects;
      isGroup = true;
    } else {
      arr.push(media);
    }

    // save data
    for (let i = 0; i < arr.length; i++) {
      const id = arr[i].id;
      const object = this.fabricCanvas.toJSON().objects[this.fabricCanvas.getObjects().indexOf(arr[i])];
      if (object) {
        this.store.dispatch(new artifactActions.Update(id, {
          // _id: id,
          // _rev: object._rev,
          transform: {
            scale: object.scaleX,
            angle: object.angle,
            x: arr.length > 1 ? object.left : media.oCoords.tl.x,
            y: arr.length > 1 ? object.top : media.oCoords.tl.y,
            order: this.fabricCanvas.getObjects().indexOf(arr[i])
          }
        }));
      }
    }
  }

  afterRender() {
    if (
      this.canvasViewportTransform.length !== this.fabricCanvas.viewportTransform.length ||
      !this.canvasViewportTransform.every((e, i) => e === this.fabricCanvas.viewportTransform[i])
    ) {
      this.canvasViewportTransform = this.fabricCanvas.viewportTransform.slice();
      this.activeSpace$.pipe(take(1)).subscribe(space => {
        // console.log(this.canvasViewportTransform);
        // console.log(space.id);
        this.store.dispatch(new spaceActions.Update(space.id, { viewportTransform: this.canvasViewportTransform }));
      });
    }
  }

  dragOver() {
    // console.log('dragover');
    this.isDragOver = true;
  }

  dragEnd() {
    // console.log('dragend');
    this.isDragOver = false;
  }

  drop(event: DragEvent) {
    // console.log('drop');
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

  clamp(num: number, min: number, max: number): number {
    return num <= min ? min : num >= max ? max : num;
  }
  //#endregion
}

