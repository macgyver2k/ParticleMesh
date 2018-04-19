import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { Observable } from 'rxjs/observable';
import "rxjs/add/operator/map";
import { timer } from "rxjs/observable/timer";

import * as rbush from "rbush";
import { IMeshDot, IDotBoundingBox, IVector2D } from './particles.interfaces';



@Component({
  selector: 'app-particles-component',
  templateUrl: './particles.component.html'
})
export class ParticlesComponent {
  @ViewChild('canvas') public canvas: ElementRef;

  public dotCount: number = 180;
  public dotSize: number = 140.0;
  public dotSpeedMaximum: number = 41.0;
  public searchRadius: number = 105.0;
  
  private canvasContext: CanvasRenderingContext2D;
  private meshDots: IMeshDot[] = [];
  private timer: Observable<number>;
  private rbush: rbush.RBush<IDotBoundingBox> = rbush();

  public ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.canvasContext = canvasEl.getContext('2d');

    canvasEl.width = canvasEl.getBoundingClientRect().width;
    canvasEl.height = canvasEl.getBoundingClientRect().height;
    
    this.canvasContext.lineWidth = 1;
    this.canvasContext.lineJoin = 'bevel';
    this.canvasContext.lineCap = 'round';
    this.canvasContext.strokeStyle = '#999';

    this.timer = timer(0, 1000 / 60);
    this.timer.subscribe(value => {
      this.initializeMeshDots();
      this.updateMeshDots();
      this.updateMeshIndex();
      this.drawSzene();
    });
  } 
  
  private initializeMeshDots() {
    if (!this.meshDots) {
      this.meshDots = [];
    }

    let amount = this.dotCount - this.meshDots.length;

    if (amount < 0) {
      this.meshDots.splice(this.dotCount);
      return;
    }

    const maxWidth = this.canvasContext.canvas.width;
    const maxHeight = this.canvasContext.canvas.height;

    for (let index = 0; index < amount; index++) {
      const randomX = Math.random();
      const randomY = Math.random();

      const randomDirectionX = Math.random();
      const randomDirectionY = Math.random();
      const randomSpeed = Math.random();

      this.meshDots.push( {
        position: {
          x: maxWidth * randomX,
          y: maxHeight * randomY,
        },
        direction: {
          x: (-1) + randomDirectionX * 2,
          y: (-1) + randomDirectionY * 2,
        },
        speed: randomSpeed
      } );
    }
  }

  private updateMeshDots() {
    const maxWidth = this.canvasContext.canvas.width;
    const maxHeight = this.canvasContext.canvas.height;

    this.meshDots = this.meshDots.map((dot: IMeshDot) => {
      let insideBoundsX = dot.position.x > 0 && dot.position.x < maxWidth;
      let insideBoundsY = dot.position.y > 0 && dot.position.y < maxHeight;

      let speed = dot.speed;
      let effectiveSpeed = speed * (this.dotSpeedMaximum / 100 );

      let direction: IVector2D = {
        x: insideBoundsX ? dot.direction.x : dot.direction.x * -1,
        y: insideBoundsY ? dot.direction.y : dot.direction.y * -1
    };

      let position : IVector2D = {
        x: dot.position.x + direction.x * effectiveSpeed,
        y: dot.position.y + direction.y * effectiveSpeed
      };

      let newDot : IMeshDot = {
        position: position,
        direction: direction,
        speed: speed
      };

      return newDot;
    });
  }

  private drawSzene() {
    const maxWidth = this.canvasContext.canvas.width;
    const maxHeight = this.canvasContext.canvas.height;
    
    let gradient = this.canvasContext.createLinearGradient(0, 0, maxWidth, 0);
    gradient.addColorStop(0, "#8400ad");
    gradient.addColorStop(1.0, "#009dcc");
    this.canvasContext.fillStyle = gradient;

    this.canvasContext.fillRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);

    const radius = this.searchRadius;

    for (let currentMeshDot of this.meshDots) {
      const nearestDots = this.rbush.search( {
        maxX: currentMeshDot.position.x + radius,
        minX: currentMeshDot.position.x - radius,
        maxY: currentMeshDot.position.y + radius,
        minY: currentMeshDot.position.y - radius
      });
      
      for (let currentNearest of nearestDots) {
        var distance = Math.sqrt(Math.pow((currentMeshDot.position.x - currentNearest.dot.position.x), 2) +
          Math.pow((currentMeshDot.position.y - currentNearest.dot.position.y), 2));

        let maximumDistance = this.searchRadius;
        var cleanDistance = Math.max(0, Math.min(maximumDistance, distance));
        
        let ration = cleanDistance / maximumDistance;
        let hue = 255 - 255 * ration;

        let rounded = Math.round( hue );
        let hueString = rounded.toString(16).padStart(2, "0");

        this.canvasContext.strokeStyle = "#a6a6a6" + hueString;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(currentMeshDot.position.x, currentMeshDot.position.y);
        this.canvasContext.lineTo(currentNearest.dot.position.x, currentNearest.dot.position.y);
        this.canvasContext.stroke();
        this.canvasContext.closePath();
      }
    };
  }

  public updateMeshCount(count: number) {
    this.dotCount = count;
    this.initializeMeshDots();
  }

  public updateMaximumDotSpeed(speed: number) {
    this.dotSpeedMaximum = speed;
  }

  public updateSearchRadius(searchRadius: number) {
    this.searchRadius = searchRadius;
  }

  public updateDotSize(dotSize: number) {
    this.dotSize = dotSize;
  }

  private updateMeshIndex() {
    const radius = this.dotSize;

    const items = this.meshDots.map(dot => <IDotBoundingBox>{
      maxX: dot.position.x + radius,
      minX: dot.position.x - radius,
      maxY: dot.position.y + radius,
      minY: dot.position.y - radius,
      dot: dot
    });

    this.rbush.clear();
    this.rbush.load(items);
  }
}
