import * as d3 from 'd3';

// by Piotr Migdał, https://p.migdal.pl/
// and Claudia Zendejas-Morales, https://claudiazm.xyz/
// inspiration from http://tensornetwork.org/diagrams/


/**
 * Draw a diagram, with the indicated parameters (nodes, contractions and lines), within the specified
 * HTML DOM Element Object (div, span, etc), creating the image of the indicated size.
 *
 * The nodes (or tensors), the contractions, and the lines are specified in lists of elements that describe each
 * type of component. These lists can be null (no elements), but restricted to the following combination of null lists.
 *
 * Valid combinations of null lists:
 * <pre>
 *        valid?   ✓      ✓      ✓      ✓      ✖      ✖      ✓      ✖
 *       tensors  []     []     []     []    null   null   null   null
 *  contractions  []     []    null   null    []     []    null   null
 *         lines  []    null    []    null    []    null    []    null
 * </pre>
 *
 * The generated image will have a size of [widthContainer x heightContainer] and will be placed inside the
 * HTML element with identifier ('id' parameter) 'idContainer'.
 *
 * By default, colors from a list are assigned to each node (or tensor) sequentially and in the same order in each
 * execution, but if you want the first color to be assigned to each node to be different from that of position 0 ,
 * then it must be specified with 'startColorIndex'.
 *
 * The diagram is drawn using a main grid, which is defined with positions indicated with integers and the distances
 * between points are fixed, (these positions are not in pixels), examples of the grid (uppercase is for nodes and
 * lowercase is for indices):
 *
 * <pre>
 *    i-----F-----j                  // tensor 'F' is in position (x,y) = (1,0)
 *
 *
 *    i-----A-----B-----j            // tensor 'A' is in position (x,y) = (1,0)
 *          |     |                  // tensor 'B' is in position (x,y) = (2,0)
 *          |     |                  // tensor 'C' is in position (x,y) = (1,1)
 *          C-----D-----k            // tensor 'D' is in position (x,y) = (2,1)
 *
 *
 *          m
 *          |
 *          |
 *    i-----G-----k                  // tensor 'G' is in position (x,y) = (1,1)
 *          |
 *          |
 *          j
 * </pre>
 *
 *
 * @param {?Object[]} tensors - list of nodes (or tensors) that are part of the diagram to be drawn, each element
 *     of this list is an object with the following structure:
 * <pre>
 *     {
 *       x: 1,
 *       y: 1,
 *       name: "A",
 *       shape: "circle"(default)|"dot"|"asterisk"|"square"|"triangleUp"|"triangleDown"|"triangleLeft"|"triangleRight"|"rectangle",
 *       labPos: "up"(default)|"rightup"|"right"|"rightdown"|"down"|"leftdown"|"left"|"leftup",
 *       idEqPart: "id_div_to_highlight"(optional),
 *       showLabel: true(default)|false,
 *       color: "#FFFFFF"(optional),
 *       size: 35(optional),
 *
 *       indices: [
 *         {
 *           pos: "left"(default)|"right"|"up"|"down"|,
 *           name: "j",
 *           showLabel: true(default)|false,
 *         },
 *       ]
 *     },
 * </pre>
 *
 * @param {number} tensors[].x - Position on the x-axis of the node (or tensor) in the main grid where the elements
 *     are placed, positive values go to the right.
 * @param {number} tensors[].y - Position on the y-axis of the node (or tensor) in the main grid where the elements
 *     are placed, positive values go down.
 * @param {string} tensors[].name - Name of the node (or tensor), the same one used when displaying its label.
 * @param {'circle'|'do'|'asterisk'|'square'|'triangleUp'|'triangleDown'|'triangleLeft'|'triangleRight'|'rectangle'} [tensors[].shape = 'circle'] - Shape
 *     of the drawing that represents the node (or tensor) in the diagram. If this parameter is not specified,
 *     the default value will be 'circle'.
 * @param {'up'|'rightup'|'right'|'rightdown'|'down'|'leftdown'|'left'|'leftup'} [tensors[].labPos = "up"] - Indicates
 *     the position in which the label of the node (or tensor) will be placed with respect to the node.
 * @param {string} [tensors[].idEqPart] - Identifier of the HTML element that this node refers to, for example a
 *     part of a formula, in order to make a highlight when hovering over the node.
 * @param {boolean} [tensors[].showLabel = true] - Indicates whether or not the label of this node (or tensor)
 *     should be displayed.
 * @param {string} [tensors[].color] - It helps to specify the color of the node fill in hexadecimal code, it must
 *     include the symbol '#', if not specified, then the color will be chosen from a list of predetermined colors.
 * @param {number} [tensors[].size] - Size in pixels of one side of the square box containing the figure representing
 *     this node.
 * @param {Object[]} [tensors[].indices] - List of indices for this node, all the indices that correspond to this tensor
 *     must be specified, whether they are part of the contractions or not.
 * @param {'left'|'right'|'up'|'down'} [tensors[].indices[].pos = 'left'] - Indicates in which direction this index
 *     should go out from the node (or tensor).
 * @param {string} tensors[].indices[].name - Name of this index that identifies it, it will be this same string that
 *     is shown as its label. Consistency must be maintained in the names of the indexes and contractions that use
 *     the desired index, since this is how it is known whether or not the index belongs to a contraction.
 * @param {boolean} [tensors[].indices[].showLabel = true] - Indicates whether or not the label of this index should
 *     be displayed.
 * @param {?Object[]} contractions - list of indices that form contractions, that is, that join nodes, each element
 *     of this list is an object with the following structure:
 * <pre>
 *     {
 *        source: 0,
 *        target: 1,
 *        name: "i",
 *        pos: "up"(default)|"down"|"left"|"right"
 *      },
 * </pre>
 *
 * @param {number} contractions[].source - node where this contraction will come from, specified as the index in the
 *     node list (previous parameter), for example, the first node (in the list of nodes) has the index 0 and is thus
 *     referred to in this parameter.
 * @param {number} contractions[].target - node where this contraction will arrive, specified as the index in the
 *     node list.
 * @param {number} contractions[].name - Nnme of the contraction, it must match the name of a single index in the
 *     list of indices of both the source and the target.
 * @param {'up'|'down'|'left'|'right'} [contractions[].pos = 'up'] - direction in which the contraction should be drawn.
 * @param {?Object[]} lines - list of lines that are part of the diagram, these lines do not join the nodes,
 *     they are independent, and they are drawn behind the nodes, each element of this list is an object with the
 *     following structure:
 * <pre>
 *     {
 *        ix: 0,
 *        iy: 0,
 *        fx: 4,
 *        fy: 0
 *      },
 * </pre>
 *
 * @param {number} lines[].ix - position on the x axis of the starting point of the line, specified in the main grid.
 * @param {number} lines[].iy - position on the y axis of the starting point of the line, specified in the main grid.
 * @param {number} lines[].fx - position on the x axis of the end point of the line, specified in the main grid.
 * @param {number} lines[].fy - position on the y axis of the end point of the line, specified in the main grid.
 * @param {string} idContainer - identifier of the HTML element in which the diagram drawing will be placed.
 * @param {number} widthContainer - width of diagram drawing specified in pixels.
 * @param {number} heightContainer - height of diagram drawing specified in pixels.
 * @param {number} [startColorIndex] - index of the list of predefined colors to start with, the default value is 0.
 */
export function drawDiagram(tensors, contractions, lines, idContainer, widthContainer, heightContainer, startColorIndex = 0) {


    // **********************************************************
    //                      Validations
    // **********************************************************


    // valid combinations:
    //     validity   ✓      ✓      ✓      ✓      ✖      ✖      ✓      ✖
    //      tensors  []     []     []     []    null   null   null   null
    // contractions  []     []    null   null    []     []    null   null
    //        lines  []    null    []    null    []    null    []    null

    if (invalidVar(tensors)) {
        if (!invalidVar(contractions)) {
            throw ".:. Cannot specify contractions without nodes"; //cannot continue
        } else { //contractions is invalid
            if (invalidVar(lines)) {
                throw ".:. Cannot generate a diagram without any element specification"; //cannot continue
            }
        }
    }

    if (invalidVar(idContainer)) {
        throw ".:. The id of the 'div' where the diagram will be drawn must be specified"; //cannot continue
    }

    if (invalidVar(widthContainer) || invalidVar(heightContainer)) {
        throw ".:. The size in pixels of the diagram must be specified"; //cannot continue
    }


    // **********************************************************
    //                      Definitions
    // **********************************************************


    // define distance and directions for index directions
    const shifts = {
        up: [0.00, -0.75],
        down: [0.00, 0.75],
        left: [-0.75, 0.00],
        right: [0.75, 0.00]
    };

    // define a color scale to assign colors to nodes
    const colorScale = d3.scaleOrdinal()
        .range(["#763E9B", "#00882B", "#C82505", "#0165C0", "#EEEEEE"].slice(startColorIndex));

    const xScale = d3.scaleLinear()
        .domain([0, 8])
        .range([20, 500]);

    const yScale = d3.scaleLinear()
        .domain([0, 8])
        .range([60, 500]);

    const lineFunction = d3.line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

    const curveFunction = d3.line()
        .curve(d3.curveBundle);


    // **********************************************************
    //                 Fill with Default Values
    // **********************************************************


    [tensors, contractions, lines] = fillDefaults(tensors, contractions, lines);  // here the empty lists are assigned


    // **********************************************************
    //                      Rearrangements
    // **********************************************************


    // add source/target by id or name, also determine the shift according to the position specified
    contractions.forEach((d) => {
        if (typeof d.source !== "number" || typeof d.target !== "number") {
            throw ".:. Source and target in contractions must be numbers"; //cannot continue
        }
        if (typeof d.source === "number") {
            d.source = tensors[d.source]
        }
        if (typeof d.target === "number") {
            d.target = tensors[d.target]
        }
    });


    // **********************************************************
    //                    Elements in formula
    // **********************************************************


    // add same color to elements in formula as indicated w/idEqPart parameter
    tensors.forEach((d) => {
        d3.selectAll('#' + d.idEqPart).style("color", colorScale(d.name));
    });


    // **********************************************************
    //                   Container for diagram
    // **********************************************************


    // select the container in which the diagram will be drawn
    const svg = d3.select("#" + idContainer)
        .append("svg")
        .attr("width", widthContainer)
        .attr("height", heightContainer);


    // **********************************************************
    //                         Drawing
    // **********************************************************


    // draw lines

    svg.selectAll(".contraction")
        .data(lines)
        .enter().append("path")
        .attr("class", "contraction")
        .attr("d", (d) => lineFunction([{ x: d.ix, y: d.iy }, { x: d.fx, y: d.fy }]));


    // draw contractions

    let already_drawn_contraction = []; // remember indexes (indicated as contractions) already drawn

    svg.selectAll(".contraction") // lines and 'loops'
        .data(contractions)
        .enter()
        .each(function (d, i) {

            already_drawn_contraction.push(d.name);

            let shift_y_per_contraction = 0;
            if (d.source.shape == "rectangle") {
                shift_y_per_contraction = contractions.slice(0, i)
                    .filter((o) =>
                        o.source.name == d.source.name && o.target.name == d.target.name
                    ).length;
            }

            let source = {
                x: d.source.x,
                y: d.source.y + shift_y_per_contraction
            };
            let target = {
                x: d.target.x,
                y: d.target.y + shift_y_per_contraction
            };

            d3.select(this)
                .append("path")
                .attr("class", "contraction")
                .attr("d", function (d) {

                    const source_pos = d.source.indices.filter((o) => o.name == d.name)[0].pos;
                    const target_pos = d.target.indices.filter((o) => o.name == d.name)[0].pos;

                    if ((source_pos == "right" && target_pos == "left") ||
                        (source_pos == "down" && target_pos == "up")) {    // draw a straight line

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
        });


    // draw nodes w/indices (loose ends)

    svg.selectAll(".tensor")
        .data(tensors)
        .enter()
        .each(function (d, i) {

            if (d.shape == "rectangle") {
                // determine the height (in positions) of this rectangular node
                d.rectHeight = Math.max(d.indices.filter((o) => o.pos == "right").length,
                    d.indices.filter((o) => o.pos == "left").length)
            }

            // first draw pending indices (the ones that are not drawn before, not in already_drawn_contraction)
            const indicesToDraw = []
            d.indices.forEach(function (index, j) {
                if (!already_drawn_contraction.includes(index.name)) {

                    let shift_y_per_index = 0;
                    let shift_y_rect_down = 0;

                    if (d.shape == "rectangle") {

                        if (index.pos == "right" || index.pos == "left") {
                            // check if there is more than one index either left or right
                            shift_y_per_index = d.indices.slice(0, j).filter((o) => o.pos == index.pos).length;
                        }

                        if (index.pos == "down") { shift_y_rect_down = d.rectHeight - 1; }
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
            svg.selectAll("#idx" + d.name) // identify in a particular way the indices of this node
                .data(indicesToDraw)
                .enter()
                .each(function (idx, i) {

                    // draw loose ends
                    d3.select(this)
                        .append("path")
                        .attr("class", "contraction")
                        .attr("d", (idx) => lineFunction([idx.source, idx.target]));

                    //draw indices names
                    if (idx.showLabel) {
                        d3.select(this)
                            .append("text")
                            .attr("class", "contraction-label")
                            .attr("x", (idx) => xScale(idx.labelPosition.x))
                            .attr("y", (idx) => yScale(idx.labelPosition.y))
                            .text((idx) => idx.name);
                    }
                });

            // second draw nodes
            let selected = d3.select(this);
            let shape = drawShape(selected, d, xScale, yScale);
            if (shape)
                shape.attr("class", "tensor")
                    .style("fill", function (d) {
                        if (d.shape === "dot") return "black";
                        if (d.color) return d.color;
                        return colorScale(d.name);
                    })
                    .on("mouseover", (event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', true))
                    .on("mouseout", (event, d) => d3.selectAll('#' + d.idEqPart).classed('circle-sketch-highlight', false));

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


/**
 * Fills the default values of the optional parameters for the lists of main elements that compose the diagram.
 * @param {?Object[]} tensors - list of nodes (or tensors) that are part of the diagram to be drawn.
 * @param {?Object[]} contractions - list of indices that form contractions, that is, that join nodes.
 * @param {?Object[]} lines - list of lines that are part of the diagram, these lines do not join the nodes,
 *     they are independent
 */
function fillDefaults(tensors, contractions, lines) {

    tensors = tensors || [];
    tensors.forEach((t) => {
        t.shape = t.shape || "circle";
        t.labPos = t.labPos || "up";
        t.size = t.size || 20;
        t.showLabel = t.showLabel === undefined ? (t.shape === "dot" || t.shape === "asterisk" ? false : true) : t.showLabel;

        t.indices = t.indices || [];
        t.indices.forEach((i) => {
            i.pos = i.pos || "left";
            i.showLabel = i.showLabel === undefined ? true : i.showLabel;
        });
    });

    contractions = contractions || [];
    contractions.forEach((c) => {
        c.pos = c.pos || "up";
    });

    lines = lines || [];
    // lines.forEach((l) => {
    // });

    return [tensors, contractions, lines];
}


/**
 * This callback is responsible for linearly scaling the values in terms of positions on the x-axis in the main grid
 * to pixels.
 *
 * @callback xScale
 * @param {number} x - value to be scaled.
 */

/**
 * This callback is responsible for linearly scaling the values in terms of positions on the y-axis in the main grid
 * to pixels.
 *
 * @callback yScale
 * @param {number} y - value to be scaled.
 */

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
function drawShape(selected, d, xScale, yScale) {

    let shape;

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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
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
        return shape = selected
            .append("rect")
            .attr("width", size)
            .attr("height", (d) => yScale(d.rectHeight - 2) + (radius * 1.5))
            .attr("x", (d) => xScale(d.x) - radius)
            .attr("y", (d) => yScale(d.y) - radius)
            .attr("rx", diagonalRadius)
            .attr("ry", diagonalRadius);
    }

    // return the shape to be added to the node
    return drawShape[d.shape]();
}

/**
 * Checks if the received variable is null or 'undefined'.
 * @param {+} variable - variable to be checked.
 * @returns {boolean}- true if the variable is null or 'undefined', false otherwise.
 */
function invalidVar(variable) {
    return typeof variable === 'undefined' || variable === null;
}