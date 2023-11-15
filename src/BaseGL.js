import WebGLVis from "epiviz.gl";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft, axisRight, axisTop } from "d3-axis";
import {
  isObject,
  getMinMax,
  parseMargins,
  getTextWidth,
  createTooltip,
  removeTooltip,
} from "./utils";
import {
  DEFAULT_COLUMN_LABEL_FONT_SIZE,
  DEFAULT_COLUMN_LABEL_SLINT_ANGLE,
  DEFAULT_COLUMN_MAX_LABEL_LENGTH_ALLOWED,
  DEFAULT_ROW_LABEL_FONT_SIZE,
  DEFAULT_ROW_LABEL_SLINT_ANGLE,
  DEFAULT_ROW_MAX_LABEL_LENGTH_ALLOWED,
  LABELS_MARGIN_BUFFER_IN_PX,
  INTENSITY_LEGEND_LABEL_SIZE_IN_PX,
  INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX,
  INTENSITY_LEGEND_SIZE_IN_PX,
  GROUPING_LEGEND_SIZE_IN_PX,
  DEFAULT_MARGINS,
} from "./constants";

/**
 * Base class for all matrix like layout plots.
 * This class is not to be used directly.
 *
 * Developers should implement `generateSpec`
 * method in their extensions.
 *
 * @class BaseGL
 */
class BaseGL {
  /**
   * Creates an instance of BaseGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof BaseGL
   */
  constructor(selectorOrElement) {
    this.elem = selectorOrElement;
    // Default legend position
    this.legendPosition = "bottom";
    if (
      typeof selectorOrElement === "string" ||
      selectorOrElement instanceof String
    ) {
      this.elem = document.querySelector(selectorOrElement);
    }

    if (!(this.elem instanceof HTMLElement)) {
      throw `${selectorOrElement} is neither a valid dom selector not an element on the page`;
    }

    this.plot = new WebGLVis(this.elem);
    this.plot.addToDom();

    // input properties
    this.input = {
      x: null,
      y: null,
      xlabels: null,
      ylabels: null,
    };

    // Plot domain
    this.xAxisRange = null;
    this.yAxisRange = null;

    // state
    this.state = {
      size: 20,
      opacity: 1,
      color: "#3182bd",
      xgap: 0.3,
      ygap: 0.3,
    };

    this.margins = DEFAULT_MARGINS;

    //Default Data for labelOptions
    this.labelOptions = {
      rowLabelsSvgXOffset: -1.05,
      rowLabelsSvgYOffset: -1.02,
      columnLabelsSvgXOffset: -1.02,
      columnLabelsSvgYOffset: 1.05,
      rowLabelMaxCharacters: DEFAULT_ROW_MAX_LABEL_LENGTH_ALLOWED,
      columnLabelMaxCharacters: DEFAULT_COLUMN_MAX_LABEL_LENGTH_ALLOWED,
      rowLabelSlintAngle: DEFAULT_ROW_LABEL_SLINT_ANGLE,
      columnLabelSlintAngle: DEFAULT_COLUMN_LABEL_SLINT_ANGLE,
      rowLabelFontSize: DEFAULT_ROW_LABEL_FONT_SIZE,
      columnLabelFontSize: DEFAULT_COLUMN_LABEL_FONT_SIZE,
    };

    // private properties
    this._renderCount = 0;

    // add events
    var self = this;
    this.plot.addEventListener("onSelectionEnd", (e) => {
      e.preventDefault();
      const sdata = e.detail.data;
      if (
        this.highlightEnabled &&
        sdata &&
        sdata.selection.indices.length > 0
      ) {
        this.highlightIndices(sdata.selection.indices, null, true);
      }

      self.selectionCallback(e.detail.data);
    });

    this.plot.addEventListener("zoomIn", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();

      this.viewportChangeCallback(viewport);
    });

    this.plot.addEventListener("zoomOut", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();

      this.viewportChangeCallback(viewport);
    });

    this.plot.addEventListener("pan", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();

      this.viewportChangeCallback(viewport);
    });

    this.highlightedIndices = [];
    this.indexStates = {};
  }

  /**
   * abstract generateSpec method
   *
   * Developers should implement `generateSpec`
   * method in their extensions.
   *
   * @memberof BaseGL
   */
  generateSpec() {
    throw `Method: generateSpec() not implemented, can't use Heatmap directly, use either dotplot, rectplot or tickplot`;
  }

  /**
   * Internal method that defines the spec for each encoding
   *
   * @param {object} spec, the specification object
   * @param {string} attribute, attribute to set in the specification
   * @param {Array|int|string} value, value can be either an array of values or singular (int, string).
   * @memberof BaseGL
   */
  _generateSpecForEncoding(spec, attribute, value) {
    if (Array.isArray(value)) {
      if (
        value.length !==
        spec.defaultData[Object.keys(spec.defaultData)[0]].length
      ) {
        throw `length of ${value} not the same as the length of data: needs to be ${
          spec.defaultData[Object.keys(spec.defaultData)[0]].length
        }`;
      }

      spec.defaultData[attribute] = value;
      spec.tracks[0][attribute] = {
        attribute: attribute,
        type: "inline",
      };
    } else {
      spec.tracks[0][attribute] = {
        value: value ? value : this.state[attribute],
      };
    }
  }

  _generateSpecForLabels(spec) {
    const {
      rowLabelsSvgXOffset,
      rowLabelsSvgYOffset,
      columnLabelsSvgXOffset,
      columnLabelsSvgYOffset,
      rowLabelMaxCharacters,
      columnLabelMaxCharacters,
      rowLabelSlintAngle,
      columnLabelSlintAngle,
      rowLabelFontSize,
      columnLabelFontSize,
    } = this.labelOptions;

    let labels = null;
    let maxWidth = 0;

    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];
      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        const truncatedLabel =
          this.input["xlabels"][ilx].length > columnLabelMaxCharacters
            ? this.input["xlabels"][ilx].substring(
                0,
                columnLabelMaxCharacters - 3
              ) + "..."
            : this.input["xlabels"][ilx];
        const truncatedLabelWidth = getTextWidth(
          truncatedLabel,
          columnLabelFontSize
        );

        maxWidth = Math.max(maxWidth, truncatedLabelWidth);
        labels.push({
          x: columnLabelsSvgXOffset + (2 * ilx + 1) / xlabels_len,
          y: columnLabelsSvgYOffset,
          type: "row",
          index: ilx,
          text: truncatedLabel,
          fixedY: true,
          "text-anchor": "center",
          "font-size": columnLabelFontSize,
          transformRotate: columnLabelSlintAngle,
        });
      }
    }

    const topMarginToAccountForLabels = maxWidth + LABELS_MARGIN_BUFFER_IN_PX;

    if ("ylabels" in this.input && this.input["ylabels"] !== null) {
      if (labels === null) {
        labels = [];
      }
      const ylabels_len = this.input["ylabels"].length;
      for (let ily = 0; ily < ylabels_len; ily++) {
        const truncatedLabel =
          this.input["ylabels"][ily].length > rowLabelMaxCharacters
            ? this.input["ylabels"][ily].substring(
                0,
                rowLabelMaxCharacters - 3
              ) + "..."
            : this.input["ylabels"][ily];
        const truncatedLabelWidth = getTextWidth(
          truncatedLabel,
          rowLabelFontSize
        );
        maxWidth = Math.max(maxWidth, truncatedLabelWidth);
        labels.push({
          x: rowLabelsSvgXOffset,
          y: rowLabelsSvgYOffset + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: truncatedLabel,
          fixedX: true,
          "text-anchor": "end",
          "font-size": rowLabelFontSize,
          transformRotate: rowLabelSlintAngle,
        });
      }
    }

    const leftMarginToAccountForLabels = maxWidth + LABELS_MARGIN_BUFFER_IN_PX;

    if (labels !== null) {
      spec["labels"] = labels;
    }

    spec["margins"] = {
      ...spec["margins"],
      top: `${topMarginToAccountForLabels}px`,
      left: `${leftMarginToAccountForLabels}px`,
      right: `${GROUPING_LEGEND_SIZE_IN_PX}px`,
    };
  }

  /**
   * Calculate bounds for the visualization.
   *
   * @return {object} object containing x and y bounds.
   * @memberof BaseGL
   */
  calcBounds() {
    let xBound = [-0.5, this.xDomain[1] + 0.5];
    // Math.max(...this.xDomain.map((a) => Math.abs(a)));
    let yBound = [-0.5, this.yDomain[1] + 0.5];

    return { xBound, yBound };
  }

  /**
   * Set the input data for the visualization
   *
   * @param {object} data, input data to set
   * @param {Array} data.x, x coordinates
   * @param {Array} data.y, y coordinates
   * @param {Array} data.xlabels, labels along the x-axis
   * @param {Array} data.ylabels, labels along the y-axis
   * @memberof BaseGL
   */
  setInput(data) {
    if (
      isObject(data) &&
      "x" in data &&
      "y" in data &&
      data.x.length === data.y.length
    ) {
      if (data?.xlabels && data?.ylabels) {
        this.ncols = data.xlabels?.length;
        this.nrows = data.ylabels?.length;
      }

      this.input = { ...this.input, ...data };

      // calc min and max
      let xMinMax = getMinMax(this.input.x);
      let yMinMax = getMinMax(this.input.y);

      // if (xMinMax[0] !== 0) {
      //   throw `x must start from 0`;
      // }

      // if (yMinMax[0] !== 0) {
      //   throw `y must start from 0`;
      // }

      this.xDomain = [0, 0.5];
      if (xMinMax[0] !== xMinMax[1]) {
        xMinMax = xMinMax.map((x, i) =>
          x === 0 ? Math.pow(-1, i + 1) * (xMinMax[i + (1 % 2)] * 0.05) : x
        );

        this.xDomain = [
          xMinMax[0] - Math.abs(0.05 * xMinMax[0]),
          xMinMax[1] + Math.abs(0.05 * xMinMax[1]),
        ];
      }

      this.yDomain = [0, 0.5];
      if (yMinMax[0] !== yMinMax[1]) {
        yMinMax = yMinMax.map((x, i) =>
          x === 0 ? Math.pow(-1, i + 1) * (yMinMax[i + (1 % 2)] * 0.05) : x
        );

        this.yDomain = [
          yMinMax[0] - Math.abs(0.05 * yMinMax[0]),
          yMinMax[1] + Math.abs(0.05 * yMinMax[1]),
        ];
      }

      // if ("xlabels" in data) {
      //   if (data.xlabels.length !== xMinMax[1] + 1) {
      //     throw `Number of x labels provided must be the same as max(x), starting from 0`;
      //   }
      // }

      // if ("ylabels" in data) {
      //   if (data.ylabels.length !== yMinMax[1] + 1) {
      //     throw `Number of y labels provided must be the same as max(y), starting from 0`;
      //   }
      // }
    } else {
      throw `input data must contain x and y attributes`;
    }
  }

  /**
   * Set the state of the visualization.
   *
   * @param {object} encoding, a set of attributes that modify the rendering
   * @param {Array|number} encoding.size, an array of size for each x-y cell or a singular size to apply for all cells.
   * @param {Array|number} encoding.color, an array of colors for each x-y cell or a singular color to apply for all cells.
   * @param {Array|number} encoding.opacity, same as size, but sets the opacity for each cell.
   * @param {Array|number} encoding.xgap, same as size, but sets the gap along x-axis.
   * @param {Array|number} encoding.ygap, same as size, but sets the gap along y-axis.
   * @param {Array} encoding.intensityLegendData - an array of objects containing the color, intensity and label for the legend.
   * @param {Array} encoding.rowGroupingData - an array of objects containing the startIndex, endIndex, color and label for the row grouping.
   * @param {Array} encoding.columnGroupingData - an array of objects containing the startIndex, endIndex, color and label for the column grouping.
   * @memberof BaseGL
   */
  setState(encoding) {
    if ("size" in encoding) {
      // scale size between 5 - 20
      // let tsize = encoding["size"];
      // if (Array.isArray(encoding["size"])) {
      //   let sMinMax = getMinMax(encoding["size"]);
      //   tsize = encoding["size"].map(
      //     (e) => 15 * ((e - sMinMax[0]) / (sMinMax[1] - sMinMax[0])) + 5
      //   );
      // }
      this.state["size"] = encoding["size"];
    }

    if ("color" in encoding) {
      this.state["color"] = encoding["color"];
    }

    if ("opacity" in encoding) {
      this.state["opacity"] = encoding["opacity"];
    }

    if ("xgap" in encoding) {
      this.state["xgap"] = encoding["xgap"];
    }

    if ("ygap" in encoding) {
      this.state["ygap"] = encoding["ygap"];
    }

    if ("intensityLegendData" in encoding) {
      this.intensityLegendData = encoding["intensityLegendData"];
    }

    if ("groupingRowData" in encoding) {
      this.groupingRowData = encoding["groupingRowData"];
    }

    if ("groupingColumnData" in encoding) {
      this.groupingColumnData = encoding["groupingColumnData"];
    }
  }

  /**
   * Set the interaction mode for the rendering.
   * possible values are
   * lasso - make  a lasso selection
   * box - make a box selection
   * pan - pan the plot
   *
   * @param {string} mode, must be either `lasso`, `pan` or `box`
   * @memberof BaseGL
   */
  setInteraction(mode) {
    if (!["lasso", "pan", "box"].includes(mode)) {
      throw `${mode} needs to be one of lasso, pan or box selection`;
    }

    this.plot.setViewOptions({ tool: mode });
  }

  /**
   * Set the legend options for the visualization.
   * @param {string} legentPosition, position of the legend, can be `top`, `bottom`, `left` or `right`
   * @param {DOMElement} legendDomElement, the DOM element to use for the legend
   **/
  setIntensityLegendOptions(legentPosition, legendDomElement, width, height) {
    this.isLegendDomElementProvided = !!legendDomElement;
    this.legendPosition = legentPosition;
    this.legendWidth = width;
    this.legendHeight = height;

    if (!legendDomElement) {
      this.legendDomElement = this.elem.lastChild;
    } else this.legendDomElement = legendDomElement;
  }

  setRowGroupingLegendOptions(
    legendPosition,
    legendDomElement,
    labelDomElement,
    labelOrientation
  ) {
    this.isRowGroupingLegendDomElementProvided = !!legendDomElement;
    this.rowGroupingLegendPosition = legendPosition;
    this.rowGroupingLabelDomElement = labelDomElement;
    this.rowGroupingLabelOrientation = labelOrientation;

    if (!legendDomElement) {
      this.rowGroupingLegendDomElement = this.elem.lastChild;
    } else this.rowGroupingLegendDomElement = legendDomElement;
  }

  setColumnGroupingLegendOptions(
    legendPosition,
    legendDomElement,
    labelDomElement,
    labelOrientation
  ) {
    this.isColumnGroupingLegendDomElementProvided = !!legendDomElement;
    this.columnGroupingLegendPosition = legendPosition;
    this.columnGroupingLabelDomElement = labelDomElement;
    this.columnGroupingLabelOrientation = labelOrientation;

    if (!legendDomElement) {
      this.columnGroupingLegendDomElement = this.elem.lastChild;
    } else this.columnGroupingLegendDomElement = legendDomElement;
  }

  /**
   * Set the label options for the visualization.
   * @param {object} labelOptions, an object containing the label options
   * @param {number} labelOptions.rowLabelMaxCharacters, maximum number of characters to show for row labels
   * @param {number} labelOptions.columnLabelMaxCharacters, maximum number of characters to show for column labels
   * @param {number} labelOptions.rowLabelSlintAngle, slint angle for row labels (default: 0)
   * @param {number} labelOptions.columnLabelSlintAngle, slint angle for column labels (default: 0)
   * @param {string | number} labelOptions.rowLabelFontSize, font size for row labels (default: 7px)
   * @param {string | number} labelOptions.columnLabelFontSize, font size for column labels (default: 7px)
   *
   * @memberof BaseGL
   * @example
   * this.labelOptions = {
   * rowLabelsSvgXOffset: 0,
   * rowLabelsSvgYOffset: 0,
   * columnLabelsSvgXOffset: 0,
   * columnLabelsSvgYOffset: 0,
   * rowLabelMaxCharacters: 10,
   * columnLabelMaxCharacters: 10,
   * rowLabelSlintAngle: 0,
   * columnLabelSlintAngle: 0,
   * rowLabelFontSize: 7,
   * columnLabelFontSize: 7,
   * }
   * @example
   * this.setLabelOptions({
   * rowLabelsSvgXOffset: 0,
   * rowLabelsSvgYOffset: 0,
   * columnLabelsSvgXOffset: 0,
   * columnLabelsSvgYOffset: 0,
   * rowLabelMaxCharacters: 10,
   * columnLabelMaxCharacters: 10,
   * rowLabelSlintAngle: 0,
   * columnLabelSlintAngle: 0,
   * rowLabelFontSize: "7px",
   * columnLabelFontSize: "7em",
   * })
   **/
  setLabelOptions(labelOptions) {
    this.labelOptions = {
      ...this.labelOptions,
      ...labelOptions,
    };
  }

  /**
   * Set the margins for the visualization.
   * all properties are optional, if not provided, the default values will be used.
   * @param {object} margins, an object containing the margins
   * @param {number} margins.top, top margin
   * @param {number} margins.bottom, bottom margin
   * @param {number} margins.left, left margin
   * @param {number} margins.right, right margin
   * @memberof BaseGL
   * @example
   * this.setMargins({
   * top: '10px',
   * bottom: '10px',
   * left: '10px',
   * right: '10px',
   * })
   **/
  setMargins(margins) {
    this.margins = {
      ...this.margins,
      ...margins,
    };
  }

  /**
   * resize the plot, without having to send the data to the GPU.
   *
   * @param {number} width
   * @param {number} height
   * @memberof BaseGL
   */
  resize(width, height) {
    this.plot.setCanvasSize(width, height);

    // this.render();

    // this.plot.setSpecification(spec);
  }

  /**
   * Attach a callback for window resize events
   *
   * @memberof BaseGL
   */
  attachResizeEvent() {
    var self = this;
    // set window timesize event once
    let resizeTimeout;
    window.addEventListener("resize", () => {
      // similar to what we do in epiviz
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        self.resize(
          self.elem.parentNode.clientWidth,
          self.elem.parentNode.clientHeight
        );
      }, 500);
    });
  }

  /**
   * Render the plot. Optionally provide a height and width.
   *
   * @param {?number} width, width of the canvas to render the plot.
   * @param {?number} height, height of the canvas to render the plot.
   * @memberof BaseGL
   */
  render(width, height) {
    var self = this;
    this._spec = this.generateSpec();

    if (width) {
      this._spec.width = width;
    }

    if (height) {
      this._spec.height = height;
    }

    this.updateMarginsToAccountForLegend();

    // Render the legend
    if (this.intensityLegendData && this.legendDomElement) {
      this.renderLegend();
    }

    if (this.groupingRowData && this.rowGroupingLegendDomElement) {
      this.renderRowGroupingLegend();
      this.renderGroupingLabels(
        this.rowGroupingLabelDomElement,
        this.groupingRowData,
        this.rowGroupingLabelOrientation || "vertical"
      );
    }

    if (this.groupingColumnData && this.columnGroupingLegendDomElement) {
      this.renderColumnGroupingLegend();
      this.renderGroupingLabels(
        this.columnGroupingLabelDomElement,
        this.groupingColumnData,
        this.columnGroupingLabelOrientation || "horizontal"
      );
    }

    if (this._renderCount == 0) {
      this.plot.setSpecification(this._spec);
    } else {
      this.plot.updateSpecification(this._spec);
    }

    this.plot.addEventListener("pointHovered", (e) => {
      const hdata = e.detail.data;
      e.preventDefault();

      self.hoverCallback(hdata);
    });

    this.plot.addEventListener("pointClicked", (e) => {
      e.preventDefault();

      const hdata = e.detail.data;

      // Only run this code if hi
      if (hdata && hdata.indices.length > 0 && this.nrows) {
        const index = hdata.indices[0]; // handle only one point
        const col = Math.floor(index / this.nrows);
        const row = index % this.nrows;

        // Invert row, considering X axis starts from bottom up
        const rowInverted = this.nrows - 1 - row;
        hdata["row"] = rowInverted;
        hdata["col"] = col;
      }

      if (this.highlightEnabled && hdata && hdata.indices.length > 0) {
        const index = hdata.indices[0];
        const shouldHighlight = !this.indexStates[index]; // reverse the current state
        this.indexStates[index] = shouldHighlight;
        this.highlightIndices([index], shouldHighlight);
      }

      self.clickCallback(hdata);
    });

    this.plot.addEventListener("labelClicked", (e) => {
      e.preventDefault();
      if (this.highlightEnabled && e && e.detail && e.detail.labelObject) {
        const type = e.detail.labelObject.type;
        const index = e.detail.labelObject.index;
        const indices = [];
        if (type === "column") {
          for (let i = index; i < this.ncols * this.nrows; i += this.nrows) {
            indices.push(i);
          }
        } else if (type === "row") {
          for (let i = index * this.nrows; i < (index + 1) * this.nrows; i++) {
            indices.push(i);
          }
        }

        // Decide whether to highlight or unhighlight
        const shouldHighlight = indices.some(
          (index) => !this.indexStates[index]
        );
        indices.forEach((index) => (this.indexStates[index] = shouldHighlight));

        this.highlightIndices(indices, shouldHighlight);
      }
    });

    this.plot.addEventListener("labelHovered", (e) => {
      const hoveredIndex = e.detail.labelObject.index;
      const labelType = e.detail.labelObject.type;
      e.preventDefault();

      createTooltip(
        document.body,
        labelType === "row"
          ? this.input.xlabels[hoveredIndex]
          : this.input.ylabels[hoveredIndex],
        e.detail.event.pageX,
        e.detail.event.pageY
      );
      this.labelHoveredCallback(e.detail);
    });

    this.plot.addEventListener("labelUnhovered", (e) => {
      e.preventDefault();
      removeTooltip(document.body);
      this.labelUnhoveredCallback(e.detail);
    });
  }

  /**
   * Render the legend for the intensity plot.
   * This is used to render the legend for the intensity plot.
   **/
  renderLegend() {
    const position = this.legendPosition;
    // Only render the legend if we have the legend data and the legend dom element
    if (!this.legendDomElement || !this.intensityLegendData) return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerWidth =
      this.legendWidth ||
      this.elem.clientWidth - parsedMargins.left - parsedMargins.right;
    const containerHeight =
      this.legendHeight ||
      this.elem.clientHeight - parsedMargins.top - parsedMargins.bottom;

    const averageCharWidth = 6; // rough estimation of the width of a single character
    const legendWidth = containerWidth - 2 * averageCharWidth;
    const legendHeight = containerHeight - 2 * averageCharWidth;

    // Adjust the SVG size and the legend position according to the position parameter
    let svgWidth, svgHeight, transformX, transformY;
    if (position === "left" || position === "right") {
      svgWidth = INTENSITY_LEGEND_SIZE_IN_PX;
      svgHeight = containerHeight;
      transformY = averageCharWidth;
    } else {
      svgWidth = containerWidth;
      svgHeight = INTENSITY_LEGEND_SIZE_IN_PX;
      transformX = averageCharWidth;
    }

    const svgContainer = select(this.legendDomElement)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const defs = svgContainer.append("defs");

    const gradientId = `linear-gradient-${(Math.random() * 1000).toFixed()}`;

    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", position === "left" || position === "right" ? "0%" : "100%")
      .attr("y2", position === "left" || position === "right" ? "100%" : "0%");

    gradient
      .selectAll("stop")
      .data(this.intensityLegendData)
      .enter()
      .append("stop")
      .attr("offset", (d) => d.intensity * 100 + "%")
      .attr("stop-color", (d) => d.color);

    // Create a mapping from intensity to label
    const intensityToLabel = {};
    this.intensityLegendData.forEach((d) => {
      if (d.label !== "") {
        intensityToLabel[d.intensity] = d.label;
      }
    });

    const intensityScale = scaleLinear()
      .range([
        0,
        position === "left" || position === "right"
          ? legendHeight
          : legendWidth,
      ])
      .domain([0, 1]);

    let legendAxis;
    if (position === "left") {
      legendAxis = axisLeft(intensityScale);
      transformX = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "top") {
      legendAxis = axisTop(intensityScale);
      transformY = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "right") {
      transformX = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = axisRight(intensityScale);
    } else {
      transformY = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = axisBottom(intensityScale);
    }

    legendAxis
      .tickValues(Object.keys(intensityToLabel).map(Number)) // Only use intensities that have labels
      .tickFormat((d) => intensityToLabel[d]); // Use the intensity to label mapping

    svgContainer
      .append("g")
      .attr("transform", `translate(${transformX}, ${transformY})`)
      .call(legendAxis);

    const maxLabelChars = Math.max(
      ...this.intensityLegendData.map((d) => d.label.toString().length)
    ); // length of the longest label

    let rectX, rectY;
    if (position === "top") {
      rectX = averageCharWidth;
      rectY = maxLabelChars * averageCharWidth + 8; // Offset to move gradient down
    } else if (position === "left") {
      rectX = maxLabelChars * averageCharWidth + 8; // Offset to move gradient right
      rectY = averageCharWidth;
    } else if (position === "right") {
      rectY = averageCharWidth;
      rectX = 0;
    } else if (position === "bottom") {
      rectX = averageCharWidth;
      rectY = 0;
    }

    svgContainer
      .append("rect")
      .attr(
        "width",
        position === "left" || position === "right"
          ? INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX
          : legendWidth
      )
      .attr(
        "height",
        position === "left" || position === "right"
          ? legendHeight
          : INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX
      )
      .style("fill", `url(#${gradientId})`)
      .attr("x", rectX)
      .attr("y", rectY);

    // Update margins to account for the legend only if dom element is not provided
    if (!this.isLegendDomElementProvided) {
      // set svg container to position absolute and position value to 0
      svgContainer.style("position", "absolute").style(position, "0px");

      if (position === "right" || position === "left") {
        svgContainer.style("margin-top", parsedMargins.top);
      } else if (position === "top" || position === "bottom") {
        svgContainer.style("margin-left", parsedMargins.left);
      }
    }
  }

  /**
   * Render the row grouping legend.
   * This is used to render the row grouping legend.
   **/
  renderRowGroupingLegend() {
    const position = this.rowGroupingLegendPosition;
    const visibleRange = this.viewport?.yRange || this.yAxisRange;

    if (
      !this.rowGroupingLegendDomElement ||
      !this.groupingRowData ||
      position === "top" ||
      position === "bottom" ||
      !visibleRange ||
      !visibleRange.length
    )
      return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerHeight =
      this.elem.clientHeight - parsedMargins.top - parsedMargins.bottom;

    const legendWidth = GROUPING_LEGEND_SIZE_IN_PX;
    const totalData = this.nrows; // total number of rows

    const svgWidth = legendWidth;
    const svgHeight = containerHeight;

    select(this.rowGroupingLegendDomElement).select("#row-group").remove();

    const svgContainer = select(this.rowGroupingLegendDomElement)
      .append("svg")
      .attr("id", "row-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const yScale = scaleLinear()
      .domain(visibleRange) // Input range is currently visible range
      .range([svgHeight, 0]); // Output range is SVG height
    const maxYRange = this.yAxisRange[1] - this.yAxisRange[0];
    const minY = this.yAxisRange[0];

    this.groupingRowData.forEach((group, idx) => {
      const normalizedStart = (group.startIndex / totalData) * maxYRange + minY;
      const normalizedEnd =
        ((group.endIndex + 1) / totalData) * maxYRange + minY;

      if (
        normalizedEnd >= visibleRange[0] &&
        normalizedStart <= visibleRange[1]
      ) {
        const rectStartInView = Math.max(normalizedStart, visibleRange[0]);
        const rectEndInView = Math.min(normalizedEnd, visibleRange[1]);

        const rectY = yScale(rectEndInView);
        const rectHeight = Math.abs(
          yScale(rectEndInView) - yScale(rectStartInView)
        );

        svgContainer
          .append("rect")
          .attr("x", 0)
          .attr("y", rectY)
          .attr("width", legendWidth)
          .attr("height", rectHeight)
          .style("fill", group.color)
          .on("mouseover", (e) => {
            const text = group.label;
            createTooltip(document.body, text, e.pageX, e.pageY);
          })
          .on("mouseout", (e) => {
            removeTooltip(document.body);
          });
      }
    });

    if (!this.isRowGroupingLegendDomElementProvided) {
      svgContainer.style("position", "absolute").style(position, "0px");
      svgContainer.style("margin-top", parsedMargins.top);
    }
  }

  /**
   * Render the column grouping legend.
   * This is used to render the column grouping legend.
   * */
  renderColumnGroupingLegend() {
    const position = this.columnGroupingLegendPosition; // should be 'top' or 'bottom'
    const visibleRange = this.viewport?.xRange || this.xAxisRange;

    // Only render the legend if we have the legend data, the dom element,
    // the position is either 'top' or 'bottom' and visibleRange exists
    if (
      !this.columnGroupingLegendDomElement ||
      !this.groupingColumnData ||
      position === "left" ||
      position === "right" ||
      !visibleRange ||
      !visibleRange.length
    )
      return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerWidth =
      this.elem.clientWidth - parsedMargins.left - parsedMargins.right;
    const legendHeight = GROUPING_LEGEND_SIZE_IN_PX;
    const totalData = this.ncols; // total number of columns

    // Adjust the SVG size and the legend position according to the position parameter
    const svgWidth = containerWidth;
    const svgHeight = legendHeight;

    // Clear the svg if it already exists
    select(this.columnGroupingLegendDomElement)
      .select("#column-group")
      .remove();

    const svgContainer = select(this.columnGroupingLegendDomElement)
      .append("svg")
      .attr("id", "column-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const xScale = scaleLinear()
      .domain(visibleRange) // Input range is currently visible range
      .range([0, svgWidth]); // Output range is SVG width

    const maxXRange = this.xAxisRange[1] - this.xAxisRange[0];
    const minX = this.xAxisRange[0];

    this.groupingRowData.forEach((group, idx) => {
      const normalizedStart = (group.startIndex / totalData) * maxXRange + minX;
      const normalizedEnd =
        ((group.endIndex + 1) / totalData) * maxXRange + minX;

      if (
        normalizedEnd >= visibleRange[0] &&
        normalizedStart <= visibleRange[1]
      ) {
        const rectStartInView = Math.max(normalizedStart, visibleRange[0]);
        const rectEndInView = Math.min(normalizedEnd, visibleRange[1]);

        const rectX = xScale(rectStartInView);
        const rectWidth = Math.abs(
          xScale(rectEndInView) - xScale(rectStartInView)
        );

        svgContainer
          .append("rect")
          .attr("x", rectX)
          .attr("y", 0)
          .attr("width", rectWidth)
          .attr("height", legendHeight)
          .style("fill", group.color)
          .on("mouseover", (e) => {
            const text = group.label;
            createTooltip(document.body, text, e.pageX, e.pageY);
          })
          .on("mouseout", (e) => {
            removeTooltip(document.body);
          });
      }
    });

    // Update margins to account for the legend only if dom element is not provided
    if (!this.isColumnGroupingLegendDomElementProvided) {
      // set svg container to position absolute and position value to 0
      svgContainer.style("position", "absolute").style(position, "0px");

      if (position === "right" || position === "left") {
        svgContainer.style("margin-top", parsedMargins.top);
      } else if (position === "top" || position === "bottom") {
        svgContainer.style("margin-left", parsedMargins.left);
      }
    }
  }

  /**
   * Renders the grouping labels for the grouping legend
   * @param {HTMLElement} parentElement - The parent element to render the grouping labels in
   * @param {Array} groupingRowData - The data to render the grouping labels with
   * @param {string} orientation - The orientation of the grouping labels
   * @returns {void}
   **/
  renderGroupingLabels(parentElement, groupingData, orientation) {
    // Filter out duplicate labels in the grouping data
    groupingData = groupingData.reduce(
      (acc, obj) => {
        if (!acc.seen[obj.label]) {
          acc.seen[obj.label] = true;
          acc.result.push(obj);
        }
        return acc;
      },
      { seen: {}, result: [] }
    ).result;

    const parent = select(parentElement);
    const svg = parent.append("svg");

    svg.attr("width", "100%").style("overflow", "inherit");
    if (orientation === "horizontal") {
      svg.attr("height", 25);
    } else {
      svg.attr("height", groupingData.length * 25);
    }

    const labelHeight = 25;
    let xOffset = 0;
    let yOffset = 0;

    groupingData.forEach((data) => {
      const group = svg.append("g");

      group
        .append("rect")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", data.color);

      group
        .append("text")
        .attr("x", xOffset + 25)
        .attr("y", yOffset + 15)
        .text(data.label);

      if (orientation === "horizontal") {
        xOffset += 25 + data.label.length * 8 + 20;
      } else {
        yOffset += labelHeight;
      }
    });
  }

  /**
   * Update the margins to account for the legend
   */
  updateMarginsToAccountForLegend() {
    const parsedMargins = parseMargins(this._spec.margins);

    const marginsToAddIn = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    if (this.groupingRowData && !this.isRowGroupingLegendDomElementProvided) {
      marginsToAddIn[this.rowGroupingLegendPosition] =
        GROUPING_LEGEND_SIZE_IN_PX;
    }

    if (
      this.groupingColumnData &&
      !this.isColumnGroupingLegendDomElementProvided
    ) {
      marginsToAddIn[this.columnGroupingLegendPosition] =
        GROUPING_LEGEND_SIZE_IN_PX;
    }

    if (this.intensityLegendData && !this.isLegendDomElementProvided) {
      marginsToAddIn[this.legendPosition] = INTENSITY_LEGEND_SIZE_IN_PX;
    }

    this._spec.margins = {
      top: parsedMargins.top + marginsToAddIn.top + "px",
      bottom: parsedMargins.bottom + marginsToAddIn.bottom + "px",
      left: parsedMargins.left + marginsToAddIn.left + "px",
      right: parsedMargins.right + marginsToAddIn.right + "px",
    };
  }

  /**
   * Highlight the indices on the plot.
   * @memberof BaseGL
   * @param {Array} indices, indices to be highlighted.
   * @param {boolean} forceSet, if true, set the indices to be highlighted, else toggle the indices.
   * @example
   * // Highlight indices
   * plot.highlightIndices([1, 2, 3]);
   **/
  highlightIndices(indices, shouldHighlight, forceSet = false) {
    if (forceSet) {
      this.highlightedIndices = [...indices];
      indices.forEach((index) => (this.indexStates[index] = true));
    } else {
      indices.forEach((index) => {
        const foundIndex = this.highlightedIndices.indexOf(index);
        if (!shouldHighlight && foundIndex > -1) {
          this.highlightedIndices.splice(foundIndex, 1);
        } else if (shouldHighlight && foundIndex === -1) {
          this.highlightedIndices.push(index);
        }
      });
    }
    this.highlightedIndicesCallback(this.highlightedIndices);
    this.reRenderOnHighlight();
  }

  /**
   * Enable highlight for the plot. This is useful when the plot is rendered with
   * a subset of data and we want to highlight the points that are not rendered.
   * @memberof BaseGL
   * @example
   * // Enable highlight
   * plot.enableHighlight();
   */
  enableHighlight() {
    this.highlightEnabled = true;
  }

  /**
   * Disable highlight for the plot. This is useful when the plot is rendered with
   * a subset of data and we want to highlight the points that are not rendered.
   * @memberof BaseGL
   * @example
   * // Disable highlight
   * plot.disableHighlight();
   */
  disableHighlight() {
    this.highlightEnabled = false;
    this.clearHighlight();
  }

  /**
   * Clear the highlight for the plot.
   * @memberof BaseGL
   * @example
   * // Clear highlight
   * plot.clearHighlight();
   **/
  clearHighlight() {
    this.highlightedIndices = [];
    this.indexStates = {};
    this.highlightedIndicesCallback(this.highlightedIndices);
    this.reRenderOnHighlight();
  }

  /**
   * Re-render the plot. This is useful when the highlight data is updated.
   * @memberof BaseGL
   */
  reRenderOnHighlight() {
    const opacityData = this.createOpacityArray(
      this._spec.defaultData.color.length,
      this.highlightedIndices
    );
    this._generateSpecForEncoding(this._spec, "opacity", opacityData);
    this.plot.updateSpecification(this._spec);
  }

  /**
   * Create an array of length `length` with the specified indexes set to 1
   * @memberof BaseGL
   * @param {number} length, length of the array
   * @param {Array} indexes, indexes to be set to 1
   * @return {Array} an array of length `length` with the specified indexes set to 1
   **/
  createOpacityArray(length, indexes) {
    // Create an array of length `length` with all values set to 0.4 if indexes are specified else 1
    const arr = new Array(length).fill(indexes.length ? 0.4 : 1);
    for (let i of indexes) {
      arr[i] = 1; // Set the specified indexes to 1
    }
    return arr;
  }

  /**
   * Clear the highlighted indices
   * @memberof BaseGL
   * @return {void}
   * @example
   * clearHighlightedIndices()
   * // clears all the highlighted indices
   */
  clearHighlightedIndices() {
    this.highlightedIndices = [];
    this.reRenderOnHighlight();
  }

  /**
   * Default callback handler when a lasso or box selection is made on the plot
   *
   * @param {object} pointIdxs, an object with points within the selection
   * @return {object} an object with points within the selection
   * @memberof BaseGL
   */
  selectionCallback(pointIdxs) {
    return pointIdxs;
  }

  /**
   * Default callback handler when a point is clicked
   *
   * @param {object} pointIdx, an object with the nearest point to the click event.
   * @return {object} an object with the nearest point to the click event.
   * @memberof BaseGL
   */
  clickCallback(pointIdx) {
    return pointIdx;
  }

  /**
   * Default callback handler when mouse if hovered over the rending
   * provides information on nearest points and their distance.
   *
   * @param {object} pointIdx, points close to range from the mouse
   * @return {object} points close to range from the mouse
   * @memberof BaseGL
   */
  hoverCallback(pointIdx) {
    return pointIdx;
  }

  /**
   * Default callback handler when highlighted indices are updated
   * @return {array} highlighted indices
   * @memberof BaseGL
   * @example
   * highlightedIndicesCallback()
   * // returns highlighted indices
   * // [1, 2, 3]
   * // [4, 5, 6]
   * // [7, 8, 9]
   */
  highlightedIndicesCallback(highlightedIndices) {
    return highlightedIndices;
  }

  /**
   *  Default callback handler when a label is hovered
   * @param {object} label, label hovered
   * @return {object} label hovered
   * @memberof BaseGL
   * @example
   * labelHoveredCallback()
   **/
  labelHoveredCallback(label) {
    return label;
  }

  /**
   * Default callback handler when a label is unhovered
   * @param {object} label, label unhovered
   * @return {object} label unhovered
   * @memberof BaseGL
   * @example
   * labelUnHoveredCallback()
   **/
  labelUnhoveredCallback(label) {
    return label;
  }

  /**
   *
   * Default callback handler when viewport is changed
   * @param {object} viewport
   */
  viewportChangeCallback(viewport) {
    return viewport;
  }
}

export default BaseGL;
