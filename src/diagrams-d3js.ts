/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as d3 from 'd3';
import TensorDiagramCore from './diagrams';
import drawShape from './shapes-d3js';
import {
  Tensor, Contraction, Line, XY, LabelPos, Pos,
} from './interfaces';

const posToShift = (pos: Pos): XY => {
  switch (pos) {
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    case 'up':
      return { x: 0, y: 1 };
    case 'down':
      return { x: 0, y: -1 };
    default:
      return { x: 0, y: 0 };
  }
};

export default class TensorDiagram extends TensorDiagramCore {
  colorScale = d3.scaleOrdinal<string, string, never>();

  xScale = d3.scaleLinear()
    .domain([0, 8])
    .range([0, 500]);

  yScale = d3.scaleLinear()
    .domain([0, 8])
    .range([0, 500]);

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
      .attr('height', this.height)
      .append('g')
      .attr('transform', 'translate(20, 50)');

    // draw non-connected lines
    svg.selectAll('.contraction')
      .data(lines)
      .enter().append('path')
      .attr('class', 'contraction')
      .attr('d', (d) => lineFunction([{ x: d.start.x, y: d.start.y }, { x: d.end.x, y: d.end.y }]));

    // draw contractions - lines and loops
    svg.selectAll<SVGGElement, Contraction[]>('.contraction')
      .data(contractions)
      .enter()
      .append('path')
      .attr('class', 'contraction')
      .attr('d', (d) => {
        const sourcePos = d.source.indices.filter((o) => o.name === d.name)[0].pos;
        const targetPos = d.target.indices.filter((o) => o.name === d.name)[0].pos;
        const sourceShiftY = d.source.indices
          .filter((ind) => ind.name === d.name)[0].order;
        const targetShiftY = d.target.indices
          .filter((ind) => ind.name === d.name)[0].order;
        // draw a straight line
        if ((sourcePos === 'right' && targetPos === 'left' && (d.source.x < d.target.x))
        || (sourcePos === 'left' && targetPos === 'right' && (d.source.x > d.target.x))
        || (sourcePos === 'down' && targetPos === 'up' && (d.source.y < d.target.y))
        || (sourcePos === 'up' && targetPos === 'down' && (d.source.y > d.target.y))) {
          const source = {
            x: d.source.x,
            y: d.source.y + sourceShiftY,
          };
          const target = {
            x: d.target.x,
            y: d.target.y + targetShiftY,
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
      .attr('class', 'tensor-group')
      .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`);

    // loose indice lines
    const looseIndices = this.looseIndices();
    tensorG.selectAll('.contraction')
      .data((_tensor, i) => looseIndices[i])
      .enter()
      .append('path')
      .attr('class', 'contraction')
      .attr('d', (indice) => {
        const lineDir = posToShift(indice.pos);
        const lineX = xScale(0.75 * lineDir.x);
        const lineY = yScale(0.75 * lineDir.y);
        return `
        M 0 ${yScale(indice.order)}
        l ${lineX} ${lineY}`;
      });

    // loose indice labels
    tensorG.selectAll('.contraction-label')
      .data((_tensor, i) => looseIndices[i])
      .enter()
      .append('text')
      .attr('class', 'contraction-label')
      .attr('x', (indice) => xScale(posToShift(indice.pos).x))
      .attr('y', (indice) => yScale(posToShift(indice.pos).y + indice.order))
      .text((indice) => (indice.showLabel ? indice.name : ''));

    // tensorG
    tensorG.selectAll('.contraction-label');

    // tensor shapes
    tensorG
      // eslint-disable-next-line func-names
      .each(function (tensor) {
        const shape = drawShape(this, tensor, yScale);
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
        return xScale(shiftX[tensor.labPos]);
      })
      .attr('y', (tensor) => {
        const shiftY: Record<LabelPos, number> = {
          left: 0,
          right: 0,
          up: -0.4,
          down: 0.4,
          center: 0,
          'up left': -0.4,
          'down left': 0.4,
          'up right': -0.4,
          'down right': 0.4,
        };
        return yScale(shiftY[tensor.labPos]);
      })
      .text((tensor) => (tensor.showLabel ? tensor.name : ''));
  }
}
