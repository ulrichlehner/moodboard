import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import 'fabric';
declare const fabric: any;

// Fabric w/ Angular -> https://stackoverflow.com/questions/45941730/using-fabric-js-with-angular-4

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, OnDestroy {

  //#region Config

  // left: 37, up: 38, right: 39, down: 40,
  // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
  static keys = { 37: 1, 38: 1, 39: 1, 40: 1 };

  // scaleFactor = 1.07;
  freeDrawingPadding = 10;
  artifactShadow = {
    color: 'rgba(0, 0, 0, 0.2)',
    blur: 10,
    offsetX: 0,
    offsetY: 0
  };
  // private readonly zoomStep = 0.10;
  //#endregion

  //#region Member variables
  fabricCanvas = null;
  domCanvas;

  // zoomLevel = 1;

  lastX;
  lastY;
  dragStart;

  spacePressed = false;
  selectionEnabled = true;

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
  constructor() { }

  ngOnInit() {
    CanvasComponent.disableScroll();
    this.initCanvas();
    this.createDemoObjects();
  }

  ngOnDestroy() {
    CanvasComponent.enableScroll();
  }
  //#endregion

  //#region Canvas initializing
  initCanvas() {
    const canvasDomWidth = document.getElementById('canvas-wrapper').clientWidth;
    const canvasDomHeight = document.getElementById('canvas-wrapper').clientHeight;

    if (this.fabricCanvas == null) {
      this.fabricCanvas = new fabric.Canvas('canvas');

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

      this.fabricCanvas.on('selection:cleared', function (event) {
        // $('#btn-delete-media').addClass('hide');
      });

      this.fabricCanvas.on('selection:created', function (event) {
        // $('#btn-delete-media').removeClass('hide');
      });

      this.fabricCanvas.on('object:selected', function (event) {
        // $('#btn-delete-media').removeClass('hide');
      });

      this.fabricCanvas.on('object:modified', function (event) {
        // this.updateMedia(event.target);
        console.log('object:modified');
      });

      this.fabricCanvas.on('object:added', function (event) {
      });

      this.fabricCanvas.on('object:removed', function (event) {
      });

      this.fabricCanvas.on('path:created', function (event) {
        if (this.fabricCanvas.isDrawingMode) {
          // console.log("free-drawing path created");

          // save path in array to merge when drawing finished
          this.drawnPathObjects.push(event.path);

          this.fabricCanvas.renderAll();
        }
      });

      this.fabricCanvas.on('after:render', function () {
        // draw bounding box for free-drawn objects
        // if (this.fabricCanvas.isDrawingMode) {
        //   drawFreeDrawingBoundingBox();
        // }
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

  createDemoObjects() {
    const circle = new fabric.Circle({
      radius: 50, fill: 'green', left: 80, top: 80
    });

    const triangle = new fabric.Triangle({
      width: 50, height: 50, fill: 'blue', left: 50, top: 50
    });

    const rect = new fabric.Rect({
      width: 50, height: 50, fill: 'red', left: 20, top: 20
    });

    this.fabricCanvas.add(circle, triangle, rect);
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
    this.fabricCanvas.relativePan({ x: x, y: y});
  }

  zoom(originX, originY, delta) {
    this.fabricCanvas.zoomToPoint({ x: originX, y: originY}, this.fabricCanvas.getZoom() + delta / 20);
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
      this.fabricCanvas.getActiveObjects().forEach( (obj: any) => {
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
    this.selectionEnabled = selection;
    this.fabricCanvas.selection = selection;
    const objects: Array<any> = this.fabricCanvas.getObjects();
    objects.forEach(object => {
      object.hasControls = selection;
      object.hasBorders = selection;
      object.selection = selection;
    });
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

  deleteMedia() {
    console.log('todo');
  }
  //#endregion

  //#region User events
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.initCanvas();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event) {
    // console.log('keyup');
    switch (event.keyCode) {
      case 32:
        // SPACE
        this.spacePressed = false;
        this.dragStart = null;
        this.setSelection(true);
        break;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event) {
    // console.log('keydown');
    // prevent browser shortcuts to interfer with app
    if (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 33 || event.keyCode === 34 || event.keyCode === 8) {
      event.preventDefault();
    }

    switch (event.keyCode) {
      case 32: // SPACE
        this.spacePressed = true;
        this.setSelection(false);
        break;
      case 88: // 'x'
        this.deleteMedia();
        break;
      case 8: // BACKSPACE
        if (this.fabricCanvas.isDrawingMode) {
          // this.undoDrawing();
        } else {
          this.deleteMedia();
        }
        break;
      case 46: // DELETE
        this.deleteMedia();
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

  // @HostListener('window:scroll', ['$event'])
  mouseWheel(event: any) {
    // console.log('mousewheel');
    // event.preventDefault();

    if (this.spacePressed) {
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
    // console.log('mouse down');
    // console.log(event);
    if (this.spacePressed) {
      document.body.style.msUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
      this.lastX = event.offsetX || (event.pageX - this.domCanvas.offsetLeft);
      this.lastY = event.offsetY || (event.pageY - this.domCanvas.offsetTop);
      this.dragStart = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseMove(event) {
    // console.log('mouse move');
    if (this.dragStart) {
      this.lastX = event.offsetX || (event.pageX - this.domCanvas.offsetLeft);
      this.lastY = event.offsetY || (event.pageY - this.domCanvas.offsetTop);
      this.translate(this.lastX - this.dragStart.x, this.lastY - this.dragStart.y);
      this.dragStart = {
        x: this.lastX,
        y: this.lastY
      };
    }
  }

  mouseUp(event) {
    // console.log('mouse up');
    if (this.dragStart) {
      // save current state
      this.updateAllMedia();
      this.dragStart = null;
    }
  }

  uploadFile(event) {
    // PouchDB -> https://pouchdb.com/guides/attachments.html

    // console.log(event.target.result);
    if (event.target.files.length) {
      for (let i = 0; i < event.target.files.length; i++) {
        const file: File = event.target.files[i];
        // console.log(file);

        const imgObj = new Image();
        imgObj.src = URL.createObjectURL(file);
        imgObj.onload = () => {
          // console.log('img loaded');
          const img = new fabric.Image(imgObj);
          img.set({
            angle: 0,
            left: 10,
            top: 10,
            lockUniScaling: true,
            name: 'test',
            centeredRotation: true
          }).scale(0.1).setShadow(this.artifactShadow);
          this.fabricCanvas.add(img);

          // Release image object
          imgObj.remove();
        };
      }
    }
  }
  //#endregion
}

