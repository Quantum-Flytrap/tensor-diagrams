/* eslint-disable @typescript-eslint/no-use-before-define */
import * as d3 from 'd3';

interface XY {
  x: number;
  y: number
}

type Pos = 'left' | 'right' | 'up' | 'down';

type Shape = 'circle' | 'dot' | 'asterisk' | 'square' | 'triangleUp'
| 'triangleDown' | 'triangleLeft' | 'triangleRight' | 'rectangle';

export interface Indice {
  pos: Pos;
  name: string;
  showLabel: boolean;
}

export interface IndiceDrawable {
  pos: Pos;
  name: string;
  showLabel: boolean;
  source: XY;
  target: XY;
  labelPosition: XY;
}

// Interface or class, depenging what we want to do with it
export interface Tensor {
  x: number;
  y: number;
  name: string;
  shape: Shape;
  showLabel: boolean;
  labPos: Pos;
  color?: string;
  size: number;
  indices: Indice[];
  rectHeight?: number;
}

export interface Contraction {
  source: number;
  target: number;
  name: string;
  pos?: Pos;
}

export interface ContractionRef {
  source: Tensor;
  target: Tensor;
  name: string;
  pos: Pos;
}

export interface Line {
  ix: number;
  iy: number;
  fx: number;
  fy: number;
}

export type RelPos = 'start' | 'right' | 'down' | XY;

export class TensorDiagram {
  tensors: Tensor[] = [];

  contractions: ContractionRef[] = [];

  lines: Line[] = [];

  width = 300;

  height = 300;

  startColorIndex = 0; // this is interlan and should be removed

  constructor(tensors: Tensor[], contractions: Contraction[], lines: Line[]) {
    this.tensors = tensors;

    // mapping contractions and setting defaults
    this.contractions = contractions.map(({
      source, target, name, pos,
    }) => ({
      source: this.tensors[source],
      target: this.tensors[target],
      name,
      pos: pos || 'up',
    }));

    this.lines = lines;
  }

  /**
   * Create a new tensor diagram.
   * @returns A bare tensor diagram.
   */
  static new(): TensorDiagram {
    return new TensorDiagram([], [], []);
  }

  static createTensor(
    x: number,
    y: number,
    name: string,
    indices : Indice[] = [],
    shape: Shape = 'circle',
    showLabel = true,
    labPos: Pos = 'up',
    size = 20,
  ): Tensor {
    return {
      x,
      y,
      name,
      shape,
      showLabel,
      labPos,
      size,
      indices,
    };
  }

  get lastTensor(): Tensor {
    return this.tensors[this.tensors.length - 1];
  }

  /**
   * A convenient chainable way of adding tensors.
   * diagram.addTensor().addTensor("M", "right" ["i"], ["j"])
   * @param name Tensor name.
   * @param position Position { x, y } in integers, or "right"/"down" to add sequentially.
   * @param left Indice names for left.
   * @param right Indice names for right.
   * @param up Indice names for up.
   * @param down Indice names for down.
   * @returns An updated TensorDiagram, so it is chainable.
   */
  addTensor(
    name: string,
    position: RelPos,
    left: string[] = [],
    right: string[] = [],
    up: string[] = [],
    down: string[] = [],
  ): TensorDiagram {
    let pos: XY = { x: 0, y: 0 };
    switch (position) {
      case 'start':
        break;
      case 'right':
        pos = { x: this.lastTensor.x + 1, y: this.lastTensor.y };
        break;
      case 'down':
        pos = { x: this.lastTensor.x, y: this.lastTensor.y + 1 };
        break;
      default:
        pos = position;
    }
    const inds1 = left.map((s): Indice => ({ name: s, pos: 'left', showLabel: true }));
    const inds2 = right.map((s): Indice => ({ name: s, pos: 'right', showLabel: true }));
    const inds3 = up.map((s): Indice => ({ name: s, pos: 'up', showLabel: true }));
    const inds4 = down.map((s): Indice => ({ name: s, pos: 'down', showLabel: true }));
    const tensor = TensorDiagram.createTensor(pos.x, pos.y, name, inds1.concat(inds2).concat(inds3).concat(inds4));
    // : Tensor = {
    //   x: pos.x,
    //   y: pos.y,
    //   name,
    //   shape: 'circle',
    //   showLabel: true,
    //   labPos: 'up',
    //   size: 20,
    //   indices: inds1.concat(inds2).concat(inds3).concat(inds4),
    // };
    this.tensors.push(tensor);
    return this;
  }

  /**
   * A convenient chainable way of adding contractions.
   * diagram.addContraction(0, 2, "j")
   * @param i Source tensor id.
   * @param j Targer tensor id.
   * @param name Indice name.
   * @param pos
   * @returns An updated TensorDiagram, so it is chainable.
   * @todo Check if an indice exists in both tensors.
   */
  addContraction(i: number, j: number, name: string, pos: Pos = 'up'): TensorDiagram {
    const contraction: ContractionRef = {
      source: this.tensors[i],
      target: this.tensors[j],
      name,
      pos,
    };
    this.contractions.push(contraction);
    return this;
  }

  setSize(width: number, height: number): TensorDiagram {
    this.width = width;
    this.height = height;
    return this;
  }

  draw(container: string, createDiagramDiv = true, equationLabels: { name: string, label: string }[] = []): void {
    const { tensors } = this;
    const { contractions } = this;
    const { lines } = this;

    // define distance and directions for index directions
    const shifts = {
      up: [0.00, -0.75],
      down: [0.00, 0.75],
      left: [-0.75, 0.00],
      right: [0.75, 0.00],
    };

    // define a color scale to assign colors to nodes
    const colorScale = d3.scaleOrdinal<string, string, never>()
      .range(['#763E9B', '#00882B', '#C82505', '#0165C0', '#EEEEEE'].slice(this.startColorIndex));

    const xScale = d3.scaleLinear()
      .domain([0, 8])
      .range([20, 500]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([60, 500]);

    const lineFunction = d3.line<XY>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y));

    const curveFunction = d3.line()
      .curve(d3.curveBundle);

    const div = d3.select(container);

    // drawing
    if (createDiagramDiv) {
      div.append('div')
        .attr('class', 'eq-diagram');
    }

    div.selectAll('.eq-elem')
      .data(equationLabels)
      .enter()
      .append('div')
      .attr('class', (d) => `eq-elem tensor-eq-${d.name}`)
      .html((d) => d.label);

    // add same color to elements in formula as indicated w/idEqPart parameter
    tensors.forEach((d) => {
      div.selectAll(`.tensor-eq-${d.name}`).style('color', colorScale(d.name));
    });

    const svg = div.select('.eq-diagram')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // draw lines
    svg.selectAll('.contraction')
      .data(lines)
      .enter().append('path')
      .attr('class', 'contraction')
      .attr('d', (d) => lineFunction([{ x: d.ix, y: d.iy }, { x: d.fx, y: d.fy }]));

    // draw contractions

    const alreadyDrawnContraction: string[] = []; // remember indexes (indicated as contractions) already drawn

    svg.selectAll<SVGGElement, ContractionRef[]>('.contraction') // lines and 'loops'
      .data(contractions)
      .enter()
      .append('path')
      .attr('class', 'contraction')
      .attr('d', (d, i) => {
        alreadyDrawnContraction.push(d.name);

        let shiftYPerContraction = 0;
        if (d.source.shape === 'rectangle') {
          shiftYPerContraction = contractions.slice(0, i)
            .filter((o) => o.source.name === d.source.name && o.target.name === d.target.name).length;
        }

        const sourcePos = d.source.indices.filter((o) => o.name === d.name)[0].pos;
        const targetPos = d.target.indices.filter((o) => o.name === d.name)[0].pos;

        if ((sourcePos === 'right' && targetPos === 'left')
          || (sourcePos === 'down' && targetPos === 'up')) { // draw a straight line
          const source = {
            x: d.source.x,
            y: d.source.y + shiftYPerContraction,
          };
          const target = {
            x: d.target.x,
            y: d.target.y + shiftYPerContraction,
          };
          return lineFunction([source, target]); // validate if there are nodes in between
        } // draw a curve line

        const { dirX, dirY } = {
          up: { dirX: 0, dirY: 1 },
          down: { dirX: 0, dirY: -1 },
          left: { dirX: 1, dirY: 0 },
          right: { dirX: -0, dirY: 0 },
        }[d.pos];

        const { dirXOut, dirYOut } = {
          right: { dirXOut: 0, dirYOut: 1 },
          left: { dirXOut: 0, dirYOut: -1 },
          down: { dirXOut: 1, dirYOut: 0 },
          up: { dirXOut: -0, dirYOut: 0 },
        }[sourcePos];

        const { dirXIn, dirYIn } = {
          right: { dirXIn: 0, dirYIn: 1 },
          left: { dirXIn: 0, dirYIn: -1 },
          down: { dirXIn: 1, dirYIn: 0 },
          up: { dirXIn: -0, dirYIn: 0 },
        }[targetPos];

        return curveFunction([
          [xScale(d.source.x), yScale(d.source.y)],
          [xScale(d.source.x) + dirXOut * 10, yScale(d.source.y) + dirYOut * 10],
          [xScale(d.source.x - dirX * 0.2 + dirXOut * 0.5) + dirXOut * 10,
            yScale(d.source.y - dirY * 0.2 + dirYOut * 0.5) + dirYOut * 10],
          [xScale(d.source.x - dirX * 1.05 + dirXOut * 0.7), yScale(d.source.y - dirY * 1.05 + dirYOut * 0.7)],
          [xScale(d.target.x - dirX * 1.05 + dirXIn * 0.7), yScale(d.target.y - dirY * 1.05 + dirYIn * 0.7)],
          [xScale(d.target.x - dirX * 0.2 + dirXIn * 0.5) + dirXIn * 10,
            yScale(d.target.y - dirY * 0.2 + dirYIn * 0.5) + dirYIn * 10],
          [xScale(d.target.x) + dirXIn * 10, yScale(d.target.y) + dirYIn * 10],
          [xScale(d.target.x), yScale(d.target.y)],
        ]);
      });

    // draw nodes w/indices (loose ends)

    svg.selectAll('.tensor')
      .data(tensors)
      .enter()
      .each(function (d) {
        if (d.shape === 'rectangle') {
          // determine the height (in positions) of this rectangular node
          // TODO: bad pattern of param reassign, so for refactoring
          // eslint-disable-next-line no-param-reassign
          d.rectHeight = Math.max(d.indices.filter((o) => o.pos === 'right').length,
            d.indices.filter((o) => o.pos === 'left').length);
        }

        // first draw pending indices (the ones that are not drawn before, not in alreadyDrawnContraction)
        const indicesToDraw: IndiceDrawable[] = d.indices
          .filter((indice) => !alreadyDrawnContraction.includes(indice.name))
          .map((indice, j) => {
            let shiftYPerIndice = 0;
            let shiftYRectDown = 0;

            if (d.shape === 'rectangle') {
              if (indice.pos === 'right' || indice.pos === 'left') {
                // check if there is more than one indice either left or right
                shiftYPerIndice = d.indices.slice(0, j).filter((o) => o.pos === indice.pos).length;
              }

              if (indice.pos === 'down') { shiftYRectDown = d.rectHeight! - 1; }
            }

            // get how much an indice should move to any cardinal point
            const dv = shifts[indice.pos];

            return {
              pos: indice.pos,
              name: indice.name,
              showLabel: indice.showLabel,
              source: {
                x: d.x,
                y: d.y + shiftYPerIndice,
              },
              target: {
                x: d.x + dv[0],
                y: d.y + dv[1] + shiftYPerIndice + shiftYRectDown,
              },
              labelPosition: {
                x: d.x + 1.4 * dv[0],
                y: d.y + 1.4 * dv[1] + shiftYPerIndice + shiftYRectDown,
              },
            };
          });
        // identify in a particular way the indices of this node
        svg.selectAll<SVGGElement, IndiceDrawable[]>(`#idx${d.name}`)
          .data(indicesToDraw)
          .enter()
          .each(function (idx) {
            // draw loose ends
            d3.select(this)
              .append('path')
              .attr('class', 'contraction')
              .attr('d', () => lineFunction([idx.source, idx.target]));

            // draw indices names
            if (idx.showLabel) {
              d3.select(this)
                .append('text')
                .attr('class', 'contraction-label')
                .attr('x', xScale(idx.labelPosition.x))
                .attr('y', yScale(idx.labelPosition.y))
                .text(idx.name);
            }
          });

        // second draw nodes
        const selected = d3.select<d3.EnterElement, Tensor>(this);
        const shape = drawShape(selected, d, xScale, yScale);
        if (shape) {
          shape.attr('class', 'tensor')
            .style('fill', (c) => {
              if (c.shape === 'dot') return 'black';
              if (c.color) return c.color;
              return colorScale(c.name);
            })
            .on('mouseover', (_event, c) => {
              div.selectAll(`.tensor-eq-${c.name}`).classed('circle-sketch-highlight', true);
            })
            .on('mouseout', (_event, c) => {
              div.selectAll(`.tensor-eq-${c.name}`).classed('circle-sketch-highlight', false);
            });
        }

        // third draw tensor names
        if (d.showLabel) {
          selected.append('text')
            .attr('class', 'tensor-label')
            .attr('x', (c) => {
              let shiftHor = 0;
              if (c.labPos.startsWith('left')) shiftHor = -0.4;
              if (c.labPos.startsWith('right')) shiftHor = 0.4;
              return xScale(c.x + shiftHor);
            })
            .attr('y', (c) => {
              let shiftVer = 0;
              if (c.labPos.endsWith('up')) shiftVer = -0.4;
              if (c.labPos.endsWith('down')) shiftVer = 0.6;
              if (c.labPos === 'left' || c.labPos === 'right') shiftVer += 0.14;
              return yScale(c.y + shiftVer);
            })
            .text((c) => c.name);
        }
      });
  }
}

/**
* Determines the shape of the node (or tensor), appends it to the selected element (element of the svg figure),
* this figure will be of the size specified for the particular tensor, remaining within the square box
* of size d.size*d.size .
* @param selected - represents the element within the svg figure to which the shape generated in this
*     function will be added.
* @param d - tensor object, contains all the characteristics of the tensor to be drawn.
* @param xScale - callback that scales linearly on the x-axis.
* @param yScale - callback that scales linearly on the y-axis.
* @returns returns the generated shape so that it can be manipulated such as setting its fill color.
*/
function drawShape(
  selected: d3.Selection<d3.EnterElement, Tensor, null, undefined>,
  tensor: Tensor,
  xScale: d3.ScaleLinear<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>,
): d3.Selection<any, Tensor, null, undefined> {
  // the figure goes inside a box with an area equal to size*size
  // (in the case of the rectangle, its width is this size, but not its length)
  const { size } = tensor;
  // radius of the circumscribed circle in the box where the figure goes, also the center of the figures is in size/2
  const radius = size / 2;
  // projection of the radius on the diagonal with angle pi/4
  const diagonalRadius = Math.floor(Math.cos(Math.PI / 4) * radius);

  // decide what to draw according to what is specified
  const strToShapeFunction = {
    circle: drawCircle,
    dot: drawCircle,
    asterisk: drawAsterisk,
    square: drawSquare,
    triangleUp: drawTriangleUp,
    triangleDown: drawTriangleDown,
    triangleLeft: drawTriangleLeft,
    triangleRight: drawTriangleRight,
    rectangle: drawRectangle,
  };

  // internal functions that draw specific shapes

  /**
   * Generates a circle shape.
   * @returns returns the generated circle shape.
   */
  function drawCircle() {
    return selected
      .append('circle')
      .attr('r', tensor.shape === 'dot' ? radius / 2 : radius)
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y));
  }

  /**
   * Generates an asterisk shape.
   * @returns returns the generated asterisk shape.
   */
  function drawAsterisk() {
    return selected
      .append('path')
      .attr('d', (d) => {
        const sx = xScale(d.x);
        const sy = yScale(d.y);
        return ` M ${sx - diagonalRadius} ${sy - diagonalRadius
        } L ${sx + diagonalRadius} ${sy + diagonalRadius
        } M ${sx + diagonalRadius} ${sy - diagonalRadius
        } L ${sx - diagonalRadius} ${sy + diagonalRadius
        } M ${sx} ${sy - radius
        } L ${sx} ${sy + radius
        } M ${sx + radius} ${sy
        } L ${sx - radius} ${sy}`;
      });
  }

  /**
   * Generates a square shape.
   * @returns returns the generated square shape.
   */
  function drawSquare() {
    return selected
      .append('rect')
      .attr('width', size)
      .attr('height', size)
      .attr('x', (d) => xScale(d.x) - radius)
      .attr('y', (d) => yScale(d.y) - radius);
  }

  /**
   * Generates a triangle up-pointing shape.
   * @returns returns the generated triangle up-pointing shape.
   */
  function drawTriangleUp() {
    return selected
      .append('path')
      .attr('d', (d) => {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) + radius;
        return ` M ${sx} ${sy
        } L ${sx + size} ${sy
        } L ${sx + radius} ${sy - size
        } z `;
      });
  }

  /**
   * Generates a triangle down-pointing shape.
   * @returns returns the generated triangle down-pointing shape.
   */
  function drawTriangleDown() {
    return selected
      .append('path')
      .attr('d', (d) => {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) - radius;
        return ` M ${sx} ${sy
        } L ${sx + size} ${sy
        } L ${sx + radius} ${sy + size
        } z `;
      });
  }

  /**
   * Generates a triangle left-pointing shape.
   * @returns returns the generated triangle left-pointing shape.
   */
  function drawTriangleLeft() {
    return selected
      .append('path')
      .attr('d', (d) => {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y);
        return ` M ${sx} ${sy
        } L ${sx + size} ${sy + radius
        } L ${sx + size} ${sy - radius
        } z `;
      });
  }

  /**
   * Generates a triangle right-pointing shape.
   * @returns returns the generated triangle right-pointing shape.
   */
  function drawTriangleRight() {
    return selected
      .append('path')
      .attr('d', (d) => {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) - radius;
        return ` M ${sx} ${sy
        } L ${sx} ${sy + size
        } L ${sx + size} ${sy + radius} z`;
      });
  }

  /**
   * Generates a rectangle shape.
   * @returns returns the generated rectangle shape.
   */
  function drawRectangle() {
    // the height of the rectangle will depend on the number of indices it has, either on the left or on the right
    return selected
      .append('rect')
      .attr('width', size)
      .attr('height', (d) => yScale(d.rectHeight! - 2) + (radius * 1.5))
      .attr('x', (d) => xScale(d.x) - radius)
      .attr('y', (d) => yScale(d.y) - radius)
      .attr('rx', diagonalRadius)
      .attr('ry', diagonalRadius);
  }

  // return the shape to be added to the node
  return strToShapeFunction[tensor.shape]();
}
