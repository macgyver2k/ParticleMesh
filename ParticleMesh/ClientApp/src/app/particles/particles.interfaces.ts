export interface IVector2D {
  x: number;
  y: number;
}

export interface IMeshDot {
  position: IVector2D,
  direction: IVector2D,
  speed: number,
}

export interface IDotBoundingBox extends rbush.BBox {
  dot: IMeshDot
}
