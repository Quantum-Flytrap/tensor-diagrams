export interface XY {
  x: number;
  y: number
}

export type Pos = 'left' | 'right' | 'up' | 'down';
export type LabelPos = 'left' | 'right' | 'up' | 'down' | 'center'
| 'up left' | 'up right' | 'down left' | 'down right';

export type Shape = 'circle' | 'dot' | 'asterisk' | 'square' | 'triangleUp'
| 'triangleDown' | 'triangleLeft' | 'triangleRight' | 'rectangle';

export interface Indice {
  pos: Pos;
  name: string;
  order: number;
  showLabel: boolean;
}

export interface Tensor {
  x: number;
  y: number;
  name: string;
  shape: Shape;
  showLabel: boolean;
  labPos: LabelPos;
  color?: string;
  size: number;
  indices: Indice[];
  rectHeight: number;
}

export interface TensorOpts {
  shape?: Shape;
  showLabel?: boolean;
  labelPos?: Pos;
  color?: string;
  size?: number;
}

export interface Contraction {
  source: Tensor;
  target: Tensor;
  name: string;
  pos: Pos;
}

export interface Line {
  start: XY;
  end: XY;
}

export type RelPos = 'start' | 'right' | 'down' | XY;
