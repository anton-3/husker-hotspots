/**
 * Minimal stub for @mapbox/point-geometry so mapbox-gl type references resolve.
 * @mapbox/point-geometry does not ship its own types; @types/mapbox__point-geometry is deprecated and empty.
 */
declare module "@mapbox/point-geometry" {
  export default class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    clone(): Point;
    add(p: Point): Point;
    sub(p: Point): Point;
    mult(k: number): Point;
    div(k: number): Point;
    rotate(a: number): Point;
    matMult(m: number[]): Point;
    unit(): Point;
    perp(): Point;
    round(): Point;
    mag(): number;
    equals(p: Point): boolean;
    dist(p: Point): number;
    distSq(p: Point): number;
    angle(): number;
    angleTo(p: Point): number;
    angleWith(p: Point): number;
    angleWithSep(x: number, y: number): number;
  }
}
