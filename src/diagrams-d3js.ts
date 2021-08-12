/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as d3 from 'd3';
import {
  TensorDiagramCore, IndiceDrawable, Tensor, Contraction, ContractionRef, Line, XY, LabelPos,
} from './diagrams';

export default class TensorDiagram extends TensorDiagramCore {
  colorScale = d3.scaleOrdinal<string, string, never>();

  xScale = d3.scaleLinear()
    .domain([0, 8])
    .range([20, 500]);

  yScale = d3.scaleLinear()
    .domain([0, 8])
    .range([60, 500]);

  constructor(tensors: Tensor[], contractions: Contraction[], lines: Line[]) {
    super(tensors, contractions, lines);
    this.setColorScheme(['dot', 'conv'], ['black', 'black'], 'tensornetwork');
  }

  /**
   * Create a new tensor diagram.
   * @returns A bare tensor diagram.
   */
  static new(): TensorDiagram {
    return new TensorDiagram([], [], []);
  }

  /**
   * Set color scheme for tensors without explicitly defined colors.
   * @param names Tensor names to set color for.
   * @param color Color to set for the tensors followed by the next colors for other tensors.
   * @param appendScheme Appends colors from a pre-defined color scheme.
   * @returns An updated TensorDiagram, so it is chainable.
  */
  setColorScheme(
    names: string[],
    colors: string[],
    appendScheme: 'none' | 'tensornetwork' | 'd3category10' | 'google10' = 'd3category10',
  ): TensorDiagram {
    const colorsToAppend = {
      none: [],
      tensornetwork: [
        '#763E9B', '#00882B', '#C82505', '#0165C0',
      ],
      google10: [
        '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
      ],
      d3category10: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      ],
    }[appendScheme];
    this.colorScale.domain(names);
    this.colorScale.range(colors.concat(colorsToAppend));
    return this;
  }

  /**
   * (Internal function)
   * @returns Loose indice lines.
   */
  looseIndices(): IndiceDrawable[][] {
    const shifts = {
      up: [0.00, -0.75],
      down: [0.00, 0.75],
      left: [-0.75, 0.00],
      right: [0.75, 0.00],
    };

    const contractedIndicesNames = this.contractions.map((contraction) => contraction.name);

    return this.tensors.map((tensor) => tensor.indices
      .filter((indice) => !contractedIndicesNames.includes(indice.name))
      .map((indice) => {
        let shiftYPerIndice = 0;
        let shiftYRectDown = 0;

        if (tensor.shape === 'rectangle') {
          if (indice.pos === 'right' || indice.pos === 'left') {
            // check if there is more than one indice either left or right
            shiftYPerIndice = tensor.indices.filter((ind) => ind.pos === indice.pos).indexOf(indice);
          }

          if (indice.pos === 'down') { shiftYRectDown = tensor.rectHeight - 1; }
        }

        // get how much an indice should move to any cardinal point
        const dv = shifts[indice.pos];

        return {
          pos: indice.pos,
          name: indice.name,
          showLabel: indice.showLabel,
          source: {
            x: tensor.x,
            y: tensor.y + shiftYPerIndice,
          },
          target: {
            x: tensor.x + dv[0],
            y: tensor.y + dv[1] + shiftYPerIndice + shiftYRectDown,
          },
          labelPosition: {
            x: tensor.x + 1.4 * dv[0],
            y: tensor.y + 1.4 * dv[1] + shiftYPerIndice + shiftYRectDown,
          },
        };
      }));
  }

  draw(container: string, createDiagramDiv = true, equationLabels: { name: string, label: string }[] = []): void {
    const {
      tensors, contractions, lines, xScale, yScale, colorScale,
    } = this;

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

    // add same color to elements in formula
    tensors.forEach((d) => {
      div.selectAll(`.tensor-eq-${d.name}`).style('color', d.color || colorScale(d.name));
    });

    const svg = div.select('.eq-diagram')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // draw non-connected lines
    svg.selectAll('.contraction')
      .data(lines)
      .enter().append('path')
      .attr('class', 'contraction')
      .attr('d', (d) => lineFunction([{ x: d.ix, y: d.iy }, { x: d.fx, y: d.fy }]));

    // draw contractions - lines and loops
    svg.selectAll<SVGGElement, ContractionRef[]>('.contraction')
      .data(contractions)
      .enter()
      .append('path')
      .attr('class', 'contraction')
      .attr('d', (d) => {
        const sourcePos = d.source.indices.filter((o) => o.name === d.name)[0].pos;
        const targetPos = d.target.indices.filter((o) => o.name === d.name)[0].pos;
        const sourceShiftY = d.source.indices
          .filter((ind) => ind.pos === d.pos)
          .map((ind) => ind.name)
          .indexOf(d.name);
        const targetShiftY = d.target.indices
          .filter((ind) => ind.pos === d.pos)
          .map((ind) => ind.name)
          .indexOf(d.name);

        // draw a straight line
        if ((sourcePos === 'right' && targetPos === 'left' && (d.source.x < d.target.x))
        || (sourcePos === 'left' && targetPos === 'right' && (d.source.x > d.target.x))
        || (sourcePos === 'down' && targetPos === 'up' && (d.source.y < d.target.y))
        || (sourcePos === 'up' && targetPos === 'down' && (d.source.y > d.target.y))) {
          const source = {
            x: d.source.x,
            y: d.source.y + sourceShiftY + 1,
          };
          const target = {
            x: d.target.x,
            y: d.target.y + targetShiftY + 1,
          };
          return lineFunction([source, target]);
        }

        // or draw a curved line
        const { dirX, dirY } = {
          up: { dirX: 0, dirY: 1 },
          down: { dirX: 0, dirY: -1 },
          left: { dirX: 1, dirY: 0 },
          right: { dirX: -1, dirY: 0 },
        }[d.pos];

        const { dirXOut, dirYOut } = {
          down: { dirXOut: 0, dirYOut: 1 },
          up: { dirXOut: 0, dirYOut: -1 },
          right: { dirXOut: 1, dirYOut: 0 },
          left: { dirXOut: -1, dirYOut: 0 },
        }[sourcePos];

        const { dirXIn, dirYIn } = {
          down: { dirXIn: 0, dirYIn: 1 },
          up: { dirXIn: 0, dirYIn: -1 },
          right: { dirXIn: 1, dirYIn: 0 },
          left: { dirXIn: -1, dirYIn: 0 },
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

    // tensor group
    const tensorG = svg.selectAll('.tensor-group')
      .data(tensors)
      .enter()
      .append('g')
      .attr('class', 'tensor-group');

    // loose indice lines
    const looseIndices = this.looseIndices();
    tensorG.selectAll('.contraction')
      .data((_tensor, i) => looseIndices[i])
      .enter()
      .append('path')
      .attr('class', 'contraction')
      .attr('d', (indice) => lineFunction([indice.source, indice.target]));

    // loose indice labels
    tensorG.selectAll('.contraction-label')
      .data((_tensor, i) => looseIndices[i])
      .enter()
      .append('text')
      .attr('class', 'contraction-label')
      .attr('x', (indice) => xScale(indice.labelPosition.x))
      .attr('y', (indice) => yScale(indice.labelPosition.y))
      .text((indice) => (indice.showLabel ? indice.name : ''));

    // tensorG
    tensorG.selectAll('.contraction-label');

    // tensor shapes
    const drawShape = this.drawShape.bind(this);
    tensorG
      // eslint-disable-next-line func-names
      .each(function (tensor) {
        const shape = drawShape(this, tensor);
        shape.attr('class', 'tensor')
          .style('fill', (c) => c.color || colorScale(c.name))
          .on('mouseover', (_event, c) => {
            div.selectAll(`.tensor-eq-${c.name}`).classed('circle-sketch-highlight', true);
          })
          .on('mouseout', (_event, c) => {
            div.selectAll(`.tensor-eq-${c.name}`).classed('circle-sketch-highlight', false);
          });
      });

    // tensor labels
    tensorG.append('text')
      .attr('class', 'tensor-label')
      .attr('x', (tensor) => {
        const shiftX: Record<LabelPos, number> = {
          left: -0.4,
          right: 0.4,
          up: 0,
          down: 0,
          center: 0,
          'up left': -0.4,
          'down left': -0.4,
          'up right': 0.4,
          'down right': 0.4,
        };
        return xScale(tensor.x + shiftX[tensor.labPos]);
      })
      .attr('y', (tensor) => {
        const shiftY: Record<LabelPos, number> = {
          left: 0.14,
          right: 0.14,
          up: -0.4,
          down: 0.6,
          center: 0.1,
          'up left': -0.4,
          'down left': 0.6,
          'up right': -0.4,
          'down right': 0.6,
        };
        return yScale(tensor.y + shiftY[tensor.labPos]);
      })
      .text((tensor) => (tensor.showLabel ? tensor.name : ''));
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
  drawShape(
    element: SVGGElement,
    tensor: Tensor,
  ): d3.Selection<any, Tensor, null, undefined> {
    const selected = d3.select<SVGGElement, Tensor>(element);
    const { xScale, yScale } = this;
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
        .attr('height', (d) => yScale(d.rectHeight - 2) + (radius * 1.5))
        .attr('x', (d) => xScale(d.x) - radius)
        .attr('y', (d) => yScale(d.y) - radius)
        .attr('rx', diagonalRadius)
        .attr('ry', diagonalRadius);
    }

    // return the shape to be added to the node
    return strToShapeFunction[tensor.shape]();
  }
}
