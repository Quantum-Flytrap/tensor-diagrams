import { select } from 'd3';
import { Tensor } from './interfaces';

/**
  * Determines the shape of the node (or tensor), appends it to the selected element (element of the svg figure),
  * this figure will be of the size specified for the particular tensor, remaining within the square box
  * of size d.size*d.size .
  * @param selected - represents the element within the svg figure to which the shape generated in this
  *     function will be added.
  * @param d - tensor object, contains all the characteristics of the tensor to be drawn.
  * @param yScale - callback that scales linearly on the y-axis.
  * @returns returns the generated shape so that it can be manipulated such as setting its fill color.
  */
export default function drawShape(
  element: SVGGElement,
  tensor: Tensor,
  yScale: d3.ScaleLinear<number, number, never>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): d3.Selection<any, Tensor, null, undefined> {
  const selected = select<SVGGElement, Tensor>(element);
  // the figure goes inside a box with an area equal to size*size
  // (in the case of the rectangle, its width is this size, but not its length)
  const { size } = tensor;
  // radius of the circumscribed circle in the box where the figure goes, also the center of the figures is in size/2
  const radius = size / 2;
  // projection of the radius on the diagonal with angle pi/4
  const diagonalRadius = Math.floor(Math.cos(Math.PI / 4) * radius);

  // internal functions that draw specific shapes

  /**
   * Generates a circle shape.
   * @returns returns the generated circle shape.
   */
  function drawCircle() {
    return selected
      .append('circle')
      .attr('r', tensor.shape === 'dot' ? radius / 2 : radius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  /**
   * Generates an asterisk shape.
   * @returns returns the generated asterisk shape.
   */
  function drawAsterisk() {
    return selected
      .append('path')
      .attr('d', `
      M ${-diagonalRadius} ${-diagonalRadius}
      L ${+diagonalRadius} ${+diagonalRadius}
      M ${+diagonalRadius} ${-diagonalRadius}
      L ${-diagonalRadius} ${+diagonalRadius}
      M 0 ${-radius}
      L 0 ${+radius}
      M ${+radius} 0
      L ${-radius} 0`);
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
      .attr('x', -radius)
      .attr('y', -radius);
  }

  /**
   * Generates a triangle up-pointing shape.
   * @returns returns the generated triangle up-pointing shape.
   */
  function drawTriangleUp() {
    return selected
      .append('path')
      .attr('d', () => {
        const sx = -radius;
        const sy = +radius;
        return `
        M ${sx} ${sy}
        L ${sx + size} ${sy}
        L ${sx + radius} ${sy - size} z`;
      });
  }

  /**
   * Generates a triangle down-pointing shape.
   * @returns returns the generated triangle down-pointing shape.
   */
  function drawTriangleDown() {
    return selected
      .append('path')
      .attr('d', () => {
        const sx = -radius;
        const sy = -radius;
        return `
        M ${sx} ${sy}
        L ${sx + size} ${sy}
        L ${sx + radius} ${sy + size} z`;
      });
  }

  /**
   * Generates a triangle left-pointing shape.
   * @returns returns the generated triangle left-pointing shape.
   */
  function drawTriangleLeft() {
    return selected
      .append('path')
      .attr('d', () => {
        const sx = -radius;
        return `
        M ${sx} 0
        L ${sx + size} ${radius}
        L ${sx + size} ${-radius}
        z`;
      });
  }

  /**
   * Generates a triangle right-pointing shape.
   * @returns returns the generated triangle right-pointing shape.
   */
  function drawTriangleRight() {
    return selected
      .append('path')
      .attr('d', () => {
        const sx = -radius;
        const sy = -radius;
        return `
        M ${sx} ${sy}
        L ${sx} ${sy + size}
        L ${sx + size} ${sy + radius} z`;
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
      .attr('height', (d) => yScale(d.rectHeight - 1) + (radius * 1.5))
      .attr('x', -radius)
      .attr('y', -radius)
      .attr('rx', diagonalRadius)
      .attr('ry', diagonalRadius);
  }

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

  // return the shape to be added to the node
  return strToShapeFunction[tensor.shape]();
}
