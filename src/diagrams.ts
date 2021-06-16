import * as d3 from 'd3';


interface XY {
  x: number;
  y: number
}

export interface Indice {
  pos: "left" | "right" | "up" | "down";
  name: string;
  showLabel: boolean;
  source?: XY;
  target?: XY;
  labelPosition?: XY;
}

// Interface or class, depenging what we want to do with it
export interface Tensor {
  x: number;
  y: number;
  name: string;
  shape: "circle" | "dot" | "asterisk" | "square" | "triangleUp" | "triangleDown" | "triangleLeft" | "triangleRight" | "rectangle",
  idEqPart?: string;
  showLabel: boolean;
  labPos: "left" | "right" | "up" | "down";
  color: string;
  size: number;
  indices: Indice[];
  rectHeight?: number;
}

export interface Contraction {
  source: number;
  target: number;
  name: string;
  pos?: "left" | "right" | "up" | "down";
}

export interface ContractionRef {
  source: Tensor;
  target: Tensor;
  name: string;
  pos: "left" | "right" | "up" | "down";
}

export interface Line {
  ix: number;
  iy: number;
  fx: number;
  fy: number;
}

export class TensorDiagram {
  tensors: Tensor[] = []
  contractions: ContractionRef[] = []
  lines: Line[] = []
  width = 300
  height = 300
  startColorIndex = 0 // this is interlan and should be removed

  constructor(tensors: Tensor[], contractions: Contraction[], lines: Line[]) {
    this.tensors = tensors;

    // setting defaults
    this.tensors.forEach((t) => {
      t.shape = t.shape || "circle";
      t.labPos = t.labPos || "up";
      t.size = t.size || 20;
      t.showLabel = t.showLabel === undefined ? (t.shape === "dot" || t.shape === "asterisk" ? false : true) : t.showLabel;

      t.indices.forEach((i) => {
        i.pos = i.pos || "left";
        i.showLabel = i.showLabel === undefined ? true : i.showLabel;
      });
    });

    // mapping contractions and setting defaults
    this.contractions = contractions.map(({ source, target, name, pos }) => ({
      source: this.tensors[source],
      target: this.tensors[target],
      name,
      pos: pos || "up"
    }));

    this.lines = lines;
  }

  setSize(width: number, height: number): TensorDiagram {
    this.width = width;
    this.height = height;
    return this;
  }

  draw(container: string): void {
    const tensors = this.tensors;
    const contractions = this.contractions;
    const lines = this.lines;


    // define distance and directions for index directions
    const shifts = {
      up: [0.00, -0.75],
      down: [0.00, 0.75],
      left: [-0.75, 0.00],
      right: [0.75, 0.00]
    };

    // define a color scale to assign colors to nodes
    const colorScale = d3.scaleOrdinal<string, string, never>()
      .range(["#763E9B", "#00882B", "#C82505", "#0165C0", "#EEEEEE"].slice(this.startColorIndex));

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


    // add same color to elements in formula as indicated w/idEqPart parameter
    tensors.forEach((d) => {
      d3.selectAll('#' + d.idEqPart).style("color", colorScale(d.name));
    });

    // drawing
    const svg = d3.select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    // draw lines
    svg.selectAll(".contraction")
      .data(lines)
      .enter().append("path")
      .attr("class", "contraction")
      .attr("d", (d) => lineFunction([{ x: d.ix, y: d.iy }, { x: d.fx, y: d.fy }]));

    // draw contractions

    const already_drawn_contraction: string[] = []; // remember indexes (indicated as contractions) already drawn

    svg.selectAll<SVGGElement, ContractionRef[]>(".contraction") // lines and 'loops'
      .data(contractions)
      .enter()
      .append("path")
      .attr("class", "contraction")
      .attr("d", function (d, i) {

        already_drawn_contraction.push(d.name);

        let shift_y_per_contraction = 0;
        if (d.source.shape == "rectangle") {
          shift_y_per_contraction = contractions.slice(0, i)
            .filter((o) =>
              o.source.name == d.source.name && o.target.name == d.target.name
            ).length;
        }

        const source_pos = d.source.indices.filter((o) => o.name == d.name)[0].pos;
        const target_pos = d.target.indices.filter((o) => o.name == d.name)[0].pos;

        if ((source_pos == "right" && target_pos == "left") ||
          (source_pos == "down" && target_pos == "up")) {    // draw a straight line
          const source = {
            x: d.source.x,
            y: d.source.y + shift_y_per_contraction
          };
          const target = {
            x: d.target.x,
            y: d.target.y + shift_y_per_contraction
          };
          return lineFunction([source, target]); //validate if there are nodes in between

        } else {                                              // draw a curve line


          let dir_x = 0;     // d.pos: "left", "right"
          let dir_y = 0;     // d.pos: "up", "down"
          let dir_x_out = 0; // source_pos = "right", "left"
          let dir_x_in = 0;  // target_pos = "right", "left"
          let dir_y_out = 0; // source_pos = "down", "up"
          let dir_y_in = 0;  // target_pos = "down", "up


          const posDir = {
            "up": () => dir_y = 1,
            "down": () => dir_y = -1,
            "left": () => dir_x = 1,
            "right": () => dir_x = -1,
            "default": () => { throw ".:. Position in loop contractions must be specified" }, //cannot continue
          };
          (posDir[d.pos] || posDir['default'])();

          const sourcePosDir = {
            "right": () => dir_x_out = 1,
            "left": () => dir_x_out = -1,
            "down": () => dir_y_out = 1,
            "up": () => dir_y_out = -1,
            "default": () => { throw ".:. Position in source index must be specified" }, //cannot continue
          };
          (sourcePosDir[source_pos] || sourcePosDir['default'])();

          const targetPosDir = {
            "right": () => dir_x_in = 1,
            "left": () => dir_x_in = -1,
            "down": () => dir_y_in = 1,
            "up": () => dir_y_in = -1,
            "default": () => { throw ".:. Position in target index must be specified" }, //cannot continue
          };
          (targetPosDir[target_pos] || targetPosDir['default'])();


          return curveFunction([
            [xScale(d.source.x), yScale(d.source.y)],
            [xScale(d.source.x) + dir_x_out * 10, yScale(d.source.y) + dir_y_out * 10],
            [xScale(d.source.x - dir_x * 0.2 + dir_x_out * 0.5) + dir_x_out * 10, yScale(d.source.y - dir_y * 0.2 + dir_y_out * 0.5) + dir_y_out * 10],
            [xScale(d.source.x - dir_x * 1.05 + dir_x_out * 0.7), yScale(d.source.y - dir_y * 1.05 + dir_y_out * 0.7)],
            [xScale(d.target.x - dir_x * 1.05 + dir_x_in * 0.7), yScale(d.target.y - dir_y * 1.05 + dir_y_in * 0.7)],
            [xScale(d.target.x - dir_x * 0.2 + dir_x_in * 0.5) + dir_x_in * 10, yScale(d.target.y - dir_y * 0.2 + dir_y_in * 0.5) + dir_y_in * 10],
            [xScale(d.target.x) + dir_x_in * 10, yScale(d.target.y) + dir_y_in * 10],
            [xScale(d.target.x), yScale(d.target.y)]
          ]);

        }

      });


    // draw nodes w/indices (loose ends)

    svg.selectAll(".tensor")
      .data(tensors)
      .enter()
      .each(function (d, _i) {

        if (d.shape == "rectangle") {
          // determine the height (in positions) of this rectangular node
          d.rectHeight = Math.max(d.indices.filter((o) => o.pos == "right").length,
            d.indices.filter((o) => o.pos == "left").length)
        }

        // first draw pending indices (the ones that are not drawn before, not in already_drawn_contraction)
        const indicesToDraw: Indice[] = []
        d.indices.forEach(function (index, j) {
          if (!already_drawn_contraction.includes(index.name)) {

            let shift_y_per_index = 0;
            let shift_y_rect_down = 0;

            if (d.shape == "rectangle") {

              if (index.pos == "right" || index.pos == "left") {
                // check if there is more than one index either left or right
                shift_y_per_index = d.indices.slice(0, j).filter((o) => o.pos == index.pos).length;
              }

              if (index.pos == "down") { shift_y_rect_down = d.rectHeight! - 1; }
            }

            // get how much an index should move to any cardinal point
            const dv = shifts[index.pos];

            index.source = {
              x: d.x,
              y: d.y + shift_y_per_index
            };
            index.target = {
              x: d.x + dv[0],
              y: d.y + dv[1] + shift_y_per_index + shift_y_rect_down
            };
            index.labelPosition = {
              x: d.x + 1.4 * dv[0],
              y: d.y + 1.4 * dv[1] + shift_y_per_index + shift_y_rect_down
            };
            indicesToDraw.push(index);
          }
        });
        svg.selectAll<SVGGElement, Indice[]>("#idx" + d.name) // identify in a particular way the indices of this node
          .data(indicesToDraw)
          .enter()
          .each(function (idx, _i) {
            // draw loose ends
            d3.select(this)
              .append("path")
              .attr("class", "contraction")
              .attr("d", lineFunction([idx.source!, idx.target!])!);

            //draw indices names
            if (idx.showLabel) {
              d3.select(this)
                .append("text")
                .attr("class", "contraction-label")
                .attr("x", xScale(idx.labelPosition!.x))
                .attr("y", yScale(idx.labelPosition!.y))
                .text(idx.name);
            }
          });

        // second draw nodes
        const selected = d3.select<d3.EnterElement, Tensor>(this);
        const shape = drawShape(selected, d, xScale, yScale);
        if (shape)
          shape.attr("class", "tensor")
            .style("fill", function (d) {
              if (d.shape === "dot") return "black";
              if (d.color) return d.color;
              return colorScale(d.name);
            })
            .on("mouseover", (_event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', true))
            .on("mouseout", (_event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', false));

        // third draw tensor names
        if (d.showLabel) {
          selected.append("text")
            .attr("class", "tensor-label")
            .attr("x", function (d) {
              let shiftHor = 0;
              if (d.labPos.startsWith("left")) shiftHor = -0.4;
              if (d.labPos.startsWith("right")) shiftHor = 0.4;
              return xScale(d.x + shiftHor);
            })
            .attr("y", function (d) {
              let shiftVer = 0;
              if (d.labPos.endsWith("up")) shiftVer = -0.4;
              if (d.labPos.endsWith("down")) shiftVer = 0.6;
              if (d.labPos == "left" || d.labPos == "right") shiftVer += 0.14;
              return yScale(d.y + shiftVer);
            })
            .text((d) => d.name);
        }

      });

  }
}

/**
* Determines the shape of the node (or tensor), appends it to the selected element (element of the svg figure),
* this figure will be of the size specified for the particular tensor, remaining within the square box
* of size d.size*d.size .
* @param {Object} selected - represents the element within the svg figure to which the shape generated in this
*     function will be added.
* @param {Object} d - tensor object, contains all the characteristics of the tensor to be drawn.
* @param {xScale} xScale - callback that scales linearly on the x-axis.
* @param {yScale} yScale - callback that scales linearly on the y-axis.
* @returns {Object} - returns the generated shape so that it can be manipulated such as setting its fill color.
*/
function drawShape(selected: d3.Selection<d3.EnterElement, Tensor, null, undefined>, d: Tensor, xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>): d3.Selection<any, Tensor, null, undefined> {
  // the figure goes inside a box with an area equal to size*size
  // (in the case of the rectangle, its width is this size, but not its length)
  const size = d.size;
  // radius of the circumscribed circle in the box where the figure goes, also the center of the figures is in size/2
  const radius = size / 2;
  // projection of the radius on the diagonal with angle pi/4
  const diagonalRadius = Math.floor(Math.cos(Math.PI / 4) * radius);


  // decide what to draw according to what is specified
  const drawShape = {
    "circle": drawCircle,
    "dot": drawCircle,
    "asterisk": drawAsterisk,
    "square": drawSquare,
    "triangleUp": drawTriangleUp,
    "triangleDown": drawTriangleDown,
    "triangleLeft": drawTriangleLeft,
    "triangleRight": drawTriangleRight,
    "rectangle": drawRectangle,
  }


  // internal functions that draw specific shapes

  /**
   * Generates a circle shape.
   * @returns {Object} - returns the generated circle shape.
   */
  function drawCircle() {
    return selected
      .append("circle")
      .attr("r", d.shape === "dot" ? radius / 2 : radius)
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y));
  }

  /**
   * Generates an asterisk shape.
   * @returns {Object} - returns the generated asterisk shape.
   */
  function drawAsterisk() {
    return selected
      .append("path")
      .attr("d", function (d) {
        const sx = xScale(d.x);
        const sy = yScale(d.y);
        return ' M ' + (sx - diagonalRadius) + ' ' + (sy - diagonalRadius) +
          ' L ' + (sx + diagonalRadius) + ' ' + (sy + diagonalRadius) +
          ' M ' + (sx + diagonalRadius) + ' ' + (sy - diagonalRadius) +
          ' L ' + (sx - diagonalRadius) + ' ' + (sy + diagonalRadius) +
          ' M ' + (sx) + ' ' + (sy - radius) +
          ' L ' + (sx) + ' ' + (sy + radius) +
          ' M ' + (sx + radius) + ' ' + (sy) +
          ' L ' + (sx - radius) + ' ' + (sy);
      });
  }

  /**
   * Generates a square shape.
   * @returns {Object} - returns the generated square shape.
   */
  function drawSquare() {
    return selected
      .append("rect")
      .attr("width", size)
      .attr("height", size)
      .attr("x", (d) => xScale(d.x) - radius)
      .attr("y", (d) => yScale(d.y) - radius);
  }

  /**
   * Generates a triangle up-pointing shape.
   * @returns {Object} - returns the generated triangle up-pointing shape.
   */
  function drawTriangleUp() {
    return selected
      .append("path")
      .attr("d", function (d) {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) + radius;
        return ' M ' + sx + ' ' + sy +
          ' L ' + (sx + size) + ' ' + (sy) +
          ' L ' + (sx + radius) + ' ' + (sy - size) +
          ' z ';
      });
  }

  /**
   * Generates a triangle down-pointing shape.
   * @returns {Object} - returns the generated triangle down-pointing shape.
   */
  function drawTriangleDown() {
    return selected
      .append("path")
      .attr("d", function (d) {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) - radius;
        return ' M ' + sx + ' ' + sy +
          ' L ' + (sx + size) + ' ' + (sy) +
          ' L ' + (sx + radius) + ' ' + (sy + size) +
          ' z ';
      });
  }

  /**
   * Generates a triangle left-pointing shape.
   * @returns {Object} - returns the generated triangle left-pointing shape.
   */
  function drawTriangleLeft() {
    return selected
      .append("path")
      .attr("d", function (d) {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y);
        return ' M ' + sx + ' ' + sy +
          ' L ' + (sx + size) + ' ' + (sy + radius) +
          ' L ' + (sx + size) + ' ' + (sy - radius) +
          ' z ';
      });
  }

  /**
   * Generates a triangle right-pointing shape.
   * @returns {Object} - returns the generated triangle right-pointing shape.
   */
  function drawTriangleRight() {
    return selected
      .append("path")
      .attr("d", function (d) {
        const sx = xScale(d.x) - radius;
        const sy = yScale(d.y) - radius;
        return ' M ' + sx + ' ' + sy +
          ' L ' + (sx) + ' ' + (sy + size) +
          ' L ' + (sx + size) + ' ' + (sy + radius) + ' z';
      });
  }

  /**
   * Generates a rectangle shape.
   * @returns {Object} - returns the generated rectangle shape.
   */
  function drawRectangle() {
    // the height of the rectangle will depend on the number of indices it has, either on the left or on the right
    return selected
      .append("rect")
      .attr("width", size)
      .attr("height", (d) => yScale(d.rectHeight! - 2) + (radius * 1.5))
      .attr("x", (d) => xScale(d.x) - radius)
      .attr("y", (d) => yScale(d.y) - radius)
      .attr("rx", diagonalRadius)
      .attr("ry", diagonalRadius);
  }

  // return the shape to be added to the node
  return drawShape[d.shape]();
}
