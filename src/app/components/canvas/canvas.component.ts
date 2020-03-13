import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import 'fabric';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { debounceTime, skip, take } from 'rxjs/operators';
import { ImageClusterService } from 'src/app/image-cluster.service';
import { activateSpace } from 'src/app/store/actions/moodboard.actions';
import { ArtifactService } from 'src/app/store/artifact.service';
import {
  AppState,
  selectActiveSpace
} from 'src/app/store/reducers/moodboard.reducers';
import { SpaceService } from 'src/app/store/space.service';
import { Artifact } from '../../models/artifact';
import { Space } from '../../models/space';

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

  activeSpace: Space;
  isSpacePressed = false;
  isDragOver = false;

  private readonly attachmentImageMimeType = 'image/webp';
  private readonly attachmentImageQuality = 0.6;
  private readonly attachmentImageMaxSide = 1600;
  private readonly attachmentImageInitialPositionOffsetY = 40;

  private readonly canvasBackgroundImage =
    '/assets/img/background-pattern/background-pattern-14.png';
  private readonly canvasMinZoom = 0.05;

  private readonly acceptedMimeTypes = {
    'image/png': true,
    'image/jpeg': true,
    'image/gif': true
  };

  private readonly artifactInitialSize = 200;
  private readonly artifactShadow = {
    color: 'rgba(0, 0, 0, 0.4)',
    blur: 30,
    offsetX: 0,
    offsetY: 5
  };

  //#endregion

  //#region Member variables
  private activeSpace$: Observable<Space | null>;
  private artifacts$: Observable<Artifact[]>;

  private artifacts: Artifact[];

  private artifactsSubscription: Subscription;
  private activeSpaceSubscription: Subscription;

  private fabricCanvas: any | null = null;
  private domCanvas;

  //#endregion

  //#region State variables
  private lastX: number;
  private lastY: number;
  private dragStartPosition: { x: number; y: number } | null;
  // saveProgress = 0;
  private lastCanvasViewportTransform: number[] = [];
  //#endregion

  @ViewChild('blankDialogTemplate')
  private blankDialogTemplate: TemplateRef<any>;

  //#region Disable scrolling

  // Based on http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-

  // static preventDefault(e) {
  //   e = e || window.event;
  //   if (e.preventDefault) {
  //     e.preventDefault();
  //   }
  //   e.returnValue = false;
  // }

  // static preventDefaultForScrollKeys(e) {
  //   if (CanvasComponent.keys[e.keyCode]) {
  //     CanvasComponent.preventDefault(e);
  //     return false;
  //   }
  // }

  // static disableScroll() {
  //   if (window.addEventListener) {
  //     // older FF
  //     window.addEventListener(
  //       'DOMMouseScroll',
  //       CanvasComponent.preventDefault,
  //       false
  //     );
  //   }
  //   window.onwheel = CanvasComponent.preventDefault; // modern standard
  //   window.onmousewheel = document.onmousewheel =
  //     CanvasComponent.preventDefault; // older browsers, IE
  //   window.ontouchmove = CanvasComponent.preventDefault; // mobile
  //   document.onkeydown = CanvasComponent.preventDefaultForScrollKeys;
  // }

  // static enableScroll() {
  //   if (window.removeEventListener) {
  //     window.removeEventListener(
  //       'DOMMouseScroll',
  //       CanvasComponent.preventDefault,
  //       false
  //     );
  //   }
  //   window.onmousewheel = document.onmousewheel = null;
  //   window.onwheel = null;
  //   window.ontouchmove = null;
  //   document.onkeydown = null;
  // }
  //#endregion

  //#region Lifecycle hooks
  constructor(
    private spaceService: SpaceService,
    private artifactService: ArtifactService,
    private imageCluster: ImageClusterService,
    private store: Store<AppState>,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: HTMLDocument
  ) {}

  async ngOnInit() {
    // CanvasComponent.disableScroll();
    this.initCanvas();

    this.activeSpace$ = this.store.pipe(select(selectActiveSpace));
    this.artifacts$ = this.artifactService.entities$;

    // Load artifacts when active space is set
    this.activeSpaceSubscription = this.activeSpace$
      // skip(1) as this is called initially
      // see https://stackoverflow.com/questions/42698785/ngrx-subscription-to-store-called-once-its-created
      .pipe(skip(1))
      .subscribe((space: Space) => {
        if (space) {
          if (!this.activeSpace || space.id !== this.activeSpace.id) {
            this.removeAllCanvasObjects();
            this.artifactService.clearCache();
            this.artifactService.getWithQuery({ spaceId: space.id });
          }
          this.activeSpace = space;
          this.lastCanvasViewportTransform = space.viewportTransform;
          this.fabricCanvas.setViewportTransform(space.viewportTransform);
        } else {
          console.warn('No space found');
        }
      });

    // Sync canvas when artifacts change
    this.artifactsSubscription = this.artifacts$.subscribe(
      (artifacts: Artifact[]) => {
        this.artifacts = artifacts;
        this.syncCanvas(artifacts);
      }
    );

    // Activate first space or show onboarding message when no space exists
    try {
      const [spaces] = await Promise.all([
        this.spaceService
          .getAll()
          .pipe(take(1))
          .toPromise(),
        this.spaceService.loaded$.pipe(take(1)).toPromise()
      ]);
      if (spaces.length > 0) {
        this.store.dispatch(activateSpace({ space: spaces[0] }));
      } else {
        this.dialog.open(this.blankDialogTemplate, {
          disableClose: true
        });
      }
    } catch (e) {
      console.error('Error loading spaces', e);
    }
  }

  ngOnDestroy() {
    // CanvasComponent.enableScroll();
    this.artifactsSubscription.unsubscribe();
    this.activeSpaceSubscription.unsubscribe();
  }
  //#endregion

  //#region Canvas initializing
  initCanvas() {
    const canvasDomWidth = this.document.getElementById('canvas-wrapper')
      ?.clientWidth;
    const canvasDomHeight = this.document.getElementById('canvas-wrapper')
      ?.clientHeight;

    if (!this.fabricCanvas) {
      this.fabricCanvas = new fabric.Canvas('canvas', {
        noScaleCache: true,
        backgroundVpt: false
      });

      this.fabricCanvas.setBackgroundColor(
        {
          source: this.canvasBackgroundImage,
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
    this.fabricCanvas.relativePan({ x, y });
  }

  zoom(originX, originY, delta) {
    const zoom = this.fabricCanvas.getZoom() + delta / 20;
    this.fabricCanvas.zoomToPoint(
      { x: originX, y: originY },
      zoom < this.canvasMinZoom ? this.canvasMinZoom : zoom
    );
  }

  onZoomToFitClick() {
    const bounds = this.calculateBounds();
    const padding = 10;
    if (bounds) {
      const vw = this.fabricCanvas.getWidth();
      const vh = this.fabricCanvas.getHeight();
      const vr = vw / vh;

      const bw = bounds.width;
      const bh = bounds.height;
      const bx = bounds.left;
      const by = bounds.top;
      const br = bw / bh;

      // Calculate translation to center
      const dx = vw / 2 - bx - bw / 2;
      const dy = vh / 2 - by - bh / 2;

      // Calculate scale to fit bounds
      const s =
        vr < br
          ? (vw / bw) * (1 - (2 * padding) / vw)
          : (vh / bh) * (1 - (2 * padding) / vh);

      // Apply transform
      this.fabricCanvas.setZoom(1);
      this.fabricCanvas.absolutePan(new fabric.Point(-dx, -dy));
      this.fabricCanvas.zoomToPoint(
        {
          x: this.fabricCanvas.getWidth() / 2,
          y: this.fabricCanvas.getHeight() / 2
        },
        s
      );
    }
  }

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

  removeAllCanvasObjects() {
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas._objects = [];
  }

  syncCanvas(artifacts: Artifact[]) {
    const canvasObjectsLength = this.fabricCanvas.getObjects().length;
    if (artifacts.length < canvasObjectsLength) {
      if (artifacts.length === 0) {
        this.removeAllCanvasObjects();
      } else {
        this.fabricCanvas.forEachObject((canvasObject: any) => {
          const tmpObjects = artifacts.filter(artifact =>
            canvasObject ? artifact.id === canvasObject.id : true
          );

          if (tmpObjects.length === 0) {
            this.fabricCanvas.remove(canvasObject);
            this.fabricCanvas.discardActiveObject();
          }
        });
      }
    } else if (artifacts.length > canvasObjectsLength) {
      artifacts.forEach((artifact: Artifact) => {
        const object = this.fabricCanvas
          .getObjects()
          .filter(obj => obj.id === artifact.id);

        if (object.length === 0) {
          this.addArtifactToCanvas(artifact);
        }
      });
    } else {
      artifacts.forEach((artifact: Artifact) => {
        const object = this.fabricCanvas
          .getObjects()
          .filter(obj => obj.id === artifact.id)[0];

        if (!object) {
          return;
        }

        object.angle = artifact.transform.angle;
        object.left = artifact.transform.x;
        object.top = artifact.transform.y;
        object.scaleX = artifact.transform.scale;
        object.scaleY = artifact.transform.scale;
      });
    }
    this.fabricCanvas.renderAll();
  }
  //#endregion

  //#region Data manipulation

  deleteSelectedArtifacts() {
    if (this.fabricCanvas.getActiveObjects()) {
      this.fabricCanvas
        .getActiveObjects()
        .forEach((obj: any) => this.artifactService.delete(obj as Artifact));
    }
  }

  private addArtifactToCanvas(artifact: Artifact) {
    return new Promise<void>((resolve, reject) => {
      if (!artifact._attachments) {
        reject('No attachments provided');
      }

      for (const key in artifact._attachments) {
        if (artifact._attachments[key]) {
          let imgObj: HTMLImageElement | null = new Image();
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
            imgObj?.remove();
            imgObj = null;

            resolve();
          };
        }
      }
    });
  }

  saveFiles(fileList: FileList) {
    if (!fileList.length) {
      console.warn('No files provided');
      return;
    }

    let artifactCnt = 0;
    const startOffsetY = this.artifacts.filter(
      (a: Artifact) =>
        a.updateDate > this.activeSpace.updateDate &&
        a.updateDate === a.createDate
    ).length;

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList.item(i);

      if (!file) {
        console.warn(`Cannot access file`);
        continue;
      }

      if (!this.acceptedMimeTypes[file.type]) {
        console.warn(`File type ${file.type} is not supported`);
        continue;
      }

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

        if (!ctx) {
          console.warn('Cannot render image');
        }

        ctx?.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

        const bounds = this.fabricCanvas.calcViewportBoundaries();
        const id: string = ArtifactService.generateId(this.activeSpace.id);
        const date = new Date();
        const distance = 10 / this.fabricCanvas.getZoom();
        const artifact: Artifact = {
          id,
          name: `Artifact @${id}`,
          spaceId: this.activeSpace.id,
          transform: {
            order: this.artifacts.length + artifactCnt,
            x: bounds.tl.x + distance,
            y:
              bounds.tl.y +
              (startOffsetY + artifactCnt++) * distance +
              this.attachmentImageInitialPositionOffsetY +
              distance,
            angle: 0,
            scale:
              this.artifactInitialSize /
              this.attachmentImageMaxSide /
              this.fabricCanvas.getZoom()
          },
          createDate: date,
          updateDate: date,
          _attachments: {}
        };
        canvas.toBlob(
          async (result: Blob) => {
            artifact._attachments[
              `${id}${this.getExtensionFromType(result.type)}`
            ] = {
              content_type: result.type,
              data: result
            };
            canvas.remove();
            this.artifactService.add(artifact);
          },
          this.attachmentImageMimeType,
          this.attachmentImageQuality
        );
      };
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
    let objects: any[] = [];
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
        this.artifactService.update({
          id,
          transform: {
            scale: object.scaleX,
            angle: object.angle,
            x: object.left,
            y: object.top,
            order: this.fabricCanvas.getObjects().indexOf(objects[i])
          }
        });
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
    }
  }
  //#endregion

  //#region Event handlers
  async onCreateSpaceClick(name?: string) {
    const date = new Date();
    const space: Space = {
      id: SpaceService.generateId(),
      name: name
        ? name
        : `Inspirespace (${date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})`,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      createDate: date,
      updateDate: date
    };
    this.store.dispatch(
      activateSpace({
        space: await this.spaceService
          .add(space)
          .pipe(take(1))
          .toPromise()
      })
    );
  }

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
    // Key-combos
    if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      // prevent browser shortcuts to interfer with app
      event.preventDefault();
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
          this.deleteSelectedArtifacts();
          break;
        case 8: // BACKSPACE
          if (this.fabricCanvas.isDrawingMode) {
            // this.undoDrawing();
          } else {
            this.deleteSelectedArtifacts();
          }
          break;
        case 46: // DELETE
          this.deleteSelectedArtifacts();
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
        // case 13: // ENTER
        //   if (this.fabricCanvas.isDrawingMode) {
        //     // disableDrawing();
        //     // saveDrawing();
        //   }
        //   break;
        // case 27: // ESCAPE
        //   if (this.fabricCanvas.isDrawingMode) {
        //     // cancelDrawing();
        //     // disableDrawing();
        //   }
        //   break;
        // case 68: // 'D'
        //   if (!this.fabricCanvas.isDrawingMode) {
        //     // enableDrawing();
        //   }
        //   break;
      }
    }
  }

  // @HostListener('window:scroll', ['$event'])
  mouseWheel(event: any) {
    if (this.isSpacePressed) {
      const delta = event.wheelDelta
        ? event.wheelDelta / 40
        : event.detail
        ? -event.detail
        : 0;
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

  onUploadFileChange(event) {
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

    if (event.dataTransfer) {
      this.saveFiles(event.dataTransfer.files);
    }

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

  calculateBounds() {
    const xCoords: number[] = [];
    const yCoords: number[] = [];

    this.fabricCanvas.forEachObject((object: any) => {
      const c = object.aCoords;
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

    if (minX && minY && width && height) {
      return {
        left: minX,
        top: minY,
        width,
        height
      };
    } else {
      return null;
    }
  }

  async onClusterImagesClick() {
    console.warn('EXPERIMENTAL image clustering');

    if (this.artifacts.length > 0) {
      const bounds = this.calculateBounds();
      console.log('bounds', bounds);

      if (!bounds) {
        console.warn('Cannot get bounds');
        return;
      }

      const result = await this.imageCluster.build(this.artifacts);
      console.log('result', result);

      const clusterSize = result.cluster.centroids.length;
      const xStep = bounds.width / clusterSize;
      const yStep = (bounds.height / clusterSize) * 0.2;
      const artifactsInCluster = Array<number>(clusterSize).fill(0);
      console.log(artifactsInCluster);

      let idx = 0;
      result.data.forEach((item, artifactId) => {
        const clusterLabel = result.cluster.clusters[idx];

        this.artifactService.update({
          id: artifactId,
          transform: {
            x: bounds.left + xStep * clusterLabel,
            y: bounds.top + yStep * artifactsInCluster[clusterLabel],
            order: idx,
            angle: 0,
            scale: 0.2
          }
        });

        artifactsInCluster[clusterLabel]++;
        console.log(
          `${artifactId}: ${clusterLabel} (${artifactsInCluster[clusterLabel]})`
        );
        idx++;
      });
    }
  }
  //#endregion
}
