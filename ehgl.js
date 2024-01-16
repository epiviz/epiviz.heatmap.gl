'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3Array = require('d3-array');
var d3Scale = require('d3-scale');
var d3Selection = require('d3-selection');
var WebGLVis = _interopDefault(require('epiviz.gl'));
var d3Axis = require('d3-axis');

const DEFAULT_ROW_MAX_LABEL_LENGTH_ALLOWED = 15;
const DEFAULT_COLUMN_MAX_LABEL_LENGTH_ALLOWED = 30;
const DEFAULT_ROW_LABEL_SLINT_ANGLE = 0;
const DEFAULT_COLUMN_LABEL_SLINT_ANGLE = 0;
const DEFAULT_ROW_LABEL_FONT_SIZE = "7px";
const DEFAULT_COLUMN_LABEL_FONT_SIZE = "7px";

const LABELS_MARGIN_BUFFER_IN_PX = 20;
const INTENSITY_LEGEND_LABEL_SIZE_IN_PX = 25;
const INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX = 20;
const INTENSITY_LEGEND_SIZE_IN_PX =
  INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX + INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
const GROUPING_LEGEND_SIZE_IN_PX = 20;
const TOOLTIP_IDENTIFIER = "ehgl-tooltip";

const DEFAULT_SIZE_LEGEND_SVG_PADDING = 10;
const DEFAULT_SIZE_LEGEND_CIRCLE_GAP = 10;
const DEFAULT_SIZE_LEGEND_CIRCLE_TEXT_GAP = 10;

const DEFAULT_MIN_RADIUS_FOR_DOTPLOT = 3;
const DEFAULT_MARGIN_BETWEEN_DOTS = 2;

const DEFAULT_MARGINS = {
  top: "25px",
  bottom: "50px",
  left: "50px",
  right: "10px",
};

/**
 * Check if a given variable is an object and not an array.
 *
 * @param {any} object - The variable to check.
 * @returns {boolean} - Returns true if the variable is an object, and not an array.
 */
function isObject(object) {
  return typeof object === "object" && Array.isArray(object) === false;
}

/**
 * Get the minimum and maximum values from an array.
 *
 * @param {Array<number>} arr - An array of numbers.
 * @returns {Array<number>} - An array containing the minimum and maximum values, in that order.
 */
const getMinMax = (arr) => {
  var max = -Number.MAX_VALUE,
    min = Number.MAX_VALUE;
  arr.forEach(function (x) {
    if (max < x) max = x;
    if (min > x) min = x;
  });
  return [min, max];
};

/**
 * Parses an object of margins and returns an object with top, bottom, left, and right margins as integers.
 *
 * @param {Object} margins - An object with potential margin properties.
 * @returns {Object} - An object with top, bottom, left, and right margins as integers.
 */
const parseMargins = (margins) => {
  const parsedMargins = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  for (let key in margins) {
    if (margins.hasOwnProperty(key)) {
      const value = margins[key];
      const parsedValue = parseInt(value, 10);

      if (!isNaN(parsedValue)) {
        parsedMargins[key] = parsedValue;
      }
    }
  }

  return parsedMargins;
};

/**
 * Measure the width of a text string for a given font size using SVG.
 *
 * @param {string} text - The text to measure.
 * @param {string} fontSize - The font size to use for the measurement, e.g., '16px'.
 * @returns {number} - The width of the text in pixels.
 */
const getTextWidth = (text, fontSize = "16px") => {
  // Create a temporary SVG to measure the text width
  const svg = d3Selection.select("body").append("svg");
  const textNode = svg.append("text").style("font-size", fontSize).text(text);
  const width = textNode.node().getBBox().width;
  svg.remove();
  return width;
};

/**
 * Create a tooltip on a specified container at the given position.
 *
 * @param {HTMLElement} container - The container element.
 * @param {string} text - The text for the tooltip.
 * @param {number} posX - The x-coordinate for the tooltip.
 * @param {number} posY - The y-coordinate for the tooltip.
 */
const createTooltip = (container, text, posX, posY) => {
  let tooltip = d3Selection.select(container)
    .append("div")
    .attr("id", TOOLTIP_IDENTIFIER)
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("z-index", "1000")
    .style("visibility", "hidden");

  tooltip
    .style("visibility", "visible")
    .text(text)
    .style("left", posX + 10 + "px")
    .style("top", posY - 10 + "px");
};

/**
 * Remove a tooltip from the specified container.
 *
 * @param {HTMLElement} container - The container from which to remove the tooltip.
 */
const removeTooltip = (container) => {
  const tooltip = d3Selection.select(container).select(`#${TOOLTIP_IDENTIFIER}`);

  if (tooltip) {
    tooltip.remove();
  }
};

const getMaxRadiusForDotplot = (xlen, ylen, padding) => {
  return Math.max(
    Math.min(198 / (xlen + 1), 198 / (ylen + 1)) - padding,
    DEFAULT_MIN_RADIUS_FOR_DOTPLOT
  );
};

const getScaledRadiusForDotplot = (
  radius,
  maxRadiusScaled,
  minRadiusOriginal,
  maxRadiusOriginal,
  defaultMinRadius = DEFAULT_MIN_RADIUS_FOR_DOTPLOT
) => {
  return (
    defaultMinRadius +
    (maxRadiusScaled - defaultMinRadius) *
      ((radius - minRadiusOriginal) / (maxRadiusOriginal - minRadiusOriginal))
  );
};

/**
 * A function to map over both regular JavaScript arrays and typed arrays.
 *
 * @param {Array|TypedArray} array - The input array or typed array.
 * @param {Function} callback - A function that produces an element of the new array,
 *      taking three arguments:
 *      currentValue - The current element being processed in the array.
 *      index - The index of the current element being processed in the array.
 *      array - The array map was called upon.
 * @returns {Array|TypedArray} - A new array or typed array with each element being the result
 *      of the callback function.
 * @throws {Error} - Throws an error if the input is neither a regular array nor a typed array.
 */
const mapArrayOrTypedArray = (array, callback) => {
  // Check if the input is a regular JavaScript array.
  if (Array.isArray(array)) {
    return array.map(callback);
  }
  // Check if the input is a typed array.
  else if (
    array instanceof Int8Array ||
    array instanceof Uint8Array ||
    array instanceof Uint8ClampedArray ||
    array instanceof Int16Array ||
    array instanceof Uint16Array ||
    array instanceof Int32Array ||
    array instanceof Uint32Array ||
    array instanceof Float32Array ||
    array instanceof Float64Array
  ) {
    // Create a new typed array of the same type and size as the input.
    let result = new array.constructor(array.length);

    // Use forEach to emulate the map functionality for typed arrays.
    array.forEach((value, index) => {
      result[index] = callback(value, index);
    });

    return result;
  }
  // Handle the case where the input is neither a regular array nor a typed array.
  else {
    throw new Error("Input is neither a normal array nor a typed array.");
  }
};

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

    //Clear the legend dom element
    d3Selection.select(this.legendDomElement).select("svg").remove();

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

    const svgContainer = d3Selection.select(this.legendDomElement)
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

    const intensityScale = d3Scale.scaleLinear()
      .range([
        0,
        position === "left" || position === "right"
          ? legendHeight
          : legendWidth,
      ])
      .domain([0, 1]);

    let legendAxis;
    if (position === "left") {
      legendAxis = d3Axis.axisLeft(intensityScale);
      transformX = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "top") {
      legendAxis = d3Axis.axisTop(intensityScale);
      transformY = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "right") {
      transformX = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = d3Axis.axisRight(intensityScale);
    } else {
      transformY = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = d3Axis.axisBottom(intensityScale);
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

    d3Selection.select(this.rowGroupingLegendDomElement).select("#row-group").remove();

    const svgContainer = d3Selection.select(this.rowGroupingLegendDomElement)
      .append("svg")
      .attr("id", "row-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const yScale = d3Scale.scaleLinear()
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
    d3Selection.select(this.columnGroupingLegendDomElement)
      .select("#column-group")
      .remove();

    const svgContainer = d3Selection.select(this.columnGroupingLegendDomElement)
      .append("svg")
      .attr("id", "column-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const xScale = d3Scale.scaleLinear()
      .domain(visibleRange) // Input range is currently visible range
      .range([0, svgWidth]); // Output range is SVG width

    const maxXRange = this.xAxisRange[1] - this.xAxisRange[0];
    const minX = this.xAxisRange[0];

    this.groupingColumnData.forEach((group, idx) => {
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

    const parent = d3Selection.select(parentElement);
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

/**
 * Make a DotPlot like plot
 *
 * @class DotplotGL
 * @extends {BaseGL}
 */
class DotplotGL extends BaseGL {
  /**
   * Creates an instance of DotplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof DotplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    this.sizeLegendOptions = {
      orientation: "horizontal", // horizontal, horizontal-inverted, vertical, vertical-inverted
      position: "top-right", // top-left, top-right, bottom-left, bottom-right
      circleColor: "gray",
      fontSize: "12px",
      fontColor: "black",
      svgPadding: DEFAULT_SIZE_LEGEND_SVG_PADDING,
      circleGap: DEFAULT_SIZE_LEGEND_CIRCLE_GAP,
      circleTextGap: DEFAULT_SIZE_LEGEND_CIRCLE_TEXT_GAP,
    };

    this.sizeLegendSvgNode = null;
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
   * @param {Array} encoding.sizeLegendData - an object containing minSize, maxSize, steps and maxSizeInPx for the legend.
   * @param {Array} encoding.rowGroupingData - an array of objects containing the startIndex, endIndex, color and label for the row grouping.
   * @param {Array} encoding.columnGroupingData - an array of objects containing the startIndex, endIndex, color and label for the column grouping.
   * @memberof BaseGL
   */
  setState(encoding) {
    super.setState(encoding);

    if (encoding.sizeLegendData) {
      this.sizeLegendData = encoding.sizeLegendData;
    }
  }

  /**
   * Generate the specification for Dot Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof DotplotGL
   */
  generateSpec() {

    let spec_inputs = {};
    const [, maxX] = getMinMax(this.input.x);
    const [, maxY] = getMinMax(this.input.y);
    let xlen = maxX + 1,
      ylen = maxY + 1;

    spec_inputs.x = mapArrayOrTypedArray(
      this.input.x,
      (e, i) => -1 + (2 * e + 1) / xlen
    );
    spec_inputs.y = mapArrayOrTypedArray(
      this.input.y,
      (e, i) => -1 + (2 * e + 1) / ylen
    );

    // Setting X and Y Axis Domains
    this.xAxisRange = [-1, 1];
    this.yAxisRange = [-1, 1];

    let spec = {
      margins: this.margins,
      defaultData: {
        x: spec_inputs.x,
        y: spec_inputs.y,
      },
      xAxis: "none",
      yAxis: "none",
      tracks: [
        {
          mark: "point",
          x: {
            attribute: "x",
            type: "quantitative",
            domain: this.xAxisRange,
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: this.yAxisRange,
          },
          opacity: { value: this.state.opacity },
        },
      ],
    };

    // scale size of dots
    const maxRadiusScaled = getMaxRadiusForDotplot(
      xlen,
      ylen,
      DEFAULT_MARGIN_BETWEEN_DOTS
    );

    let tsize = this.state["size"];
    if (Array.isArray(this.state["size"])) {
      let [minRadiusOriginal, maxRadiusOriginal] = getMinMax(
        this.state["size"]
      );
      tsize = this.state["size"].map((radius) =>
        getScaledRadiusForDotplot(
          radius,
          maxRadiusScaled,
          minRadiusOriginal,
          maxRadiusOriginal
        )
      );
    }

    this._generateSpecForLabels(spec);
    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", tsize);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
  }

  /**
   * Render the plot. Optionally provide a height and width.
   *
   * @param {?number} width, width of the canvas to render the plot.
   * @param {?number} height, height of the canvas to render the plot.
   * @memberof BaseGL
   */
  render(width, height) {
    super.render(width, height);
    this.renderSizeLegend();
  }

  /**
   * Adjusts the margins of the plot to account for the size legend.
   * It calculates the margins based on the size of the size legend
   * and its orientation and position.
   */
  updateMarginsToAccountForSizeLegend() {
    const { height: svgHeight, width: svgWidth } = this.sizeLegendSvgNode
      .node()
      .getBBox();
    const parsedMargins = parseMargins(this._spec.margins);

    const marginsToAddIn = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    const { orientation, position } = this.sizeLegendOptions;

    if (this.sizeLegendData && !this.isSizeLegendDomElementProvided) {
      if (
        orientation === "horizontal" ||
        orientation === "horizontal-inverted"
      ) {
        if (position === "top-left" || position === "top-right") {
          marginsToAddIn.top = svgHeight;
        } else if (position === "bottom-left" || position === "bottom-right") {
          marginsToAddIn.bottom = svgHeight;
        }
      } else if (
        orientation === "vertical" ||
        orientation === "vertical-inverted"
      ) {
        if (position === "top-left" || position === "bottom-left") {
          marginsToAddIn.left = svgWidth;
        } else if (position === "top-right" || position === "bottom-right") {
          marginsToAddIn.right = svgWidth;
        }
      }
    }

    this._spec.margins = {
      top: parsedMargins.top + marginsToAddIn.top + "px",
      bottom: parsedMargins.bottom + marginsToAddIn.bottom + "px",
      left: parsedMargins.left + marginsToAddIn.left + "px",
      right: parsedMargins.right + marginsToAddIn.right + "px",
    };
  }

  /**
   * Renders the size legend based on provided data and orientation.
   * It creates circles and text elements to represent the size legend
   * and places them in the specified position.
   */
  renderSizeLegend() {
    if (!this.sizeLegendData) return;
    let { minSize, maxSize, steps, maxSizeInPx, minSizeInPx } =
      this.sizeLegendData;
    const [, maxX] = getMinMax(this.input.x);
    const [, maxY] = getMinMax(this.input.y);
    let xlen = maxX + 1,
      ylen = maxY + 1;

    const [minRadiusOriginal, maxRadiusOriginal] = getMinMax(
      this.state["size"]
    );
    const maxRadiusAsPerPlot = getMaxRadiusForDotplot(
      xlen,
      ylen,
      DEFAULT_MARGIN_BETWEEN_DOTS
    );
    minSize = getScaledRadiusForDotplot(
      minSize || minRadiusOriginal, // if minSize is not provided, use minRadiusOriginal
      maxRadiusAsPerPlot,
      minRadiusOriginal,
      maxRadiusOriginal
    );
    maxSize = getScaledRadiusForDotplot(
      maxSize || maxRadiusOriginal, // if maxSize is not provided, use maxRadiusOriginal
      maxRadiusAsPerPlot,
      minRadiusOriginal,
      maxRadiusOriginal
    );

    // Desired max size in pixels
    const maxPx = maxSizeInPx || maxSize;

    // Desired min size in pixels
    const minPx = minSizeInPx || minSize;

    // Create a linear scale
    const sizeScale = d3Scale.scaleLinear()
      .domain([minSize, maxSize])
      .range([minPx, maxPx]);

    minSize = sizeScale(minSize);
    maxSize = sizeScale(maxSize);
    const orientation = this.sizeLegendOptions.orientation;

    // Calculate step size
    const stepSize = (maxSize - minSize) / (steps - 1);

    // SVG container for the legend
    this.sizeLegendSvgNode = d3Selection.select(this.sizeLegendDomElement).append("svg");
    const circleGroup = this.sizeLegendSvgNode.append("g");
    const textGroup = this.sizeLegendSvgNode.append("g");

    const textCoordinates = this.constructCoordinatesForSizeLegendText(
      orientation,
      minSize,
      maxSize,
      stepSize
    );

    const isOrientationHorizontal =
      orientation === "horizontal" || orientation === "horizontal-inverted";

    textGroup
      .selectAll("text")
      .data(d3Array.range(steps))
      .enter()
      .append("text")
      .attr("x", textCoordinates.x)
      .attr("y", textCoordinates.y)
      .text((d) => (minSize + d * stepSize).toFixed(1))
      .attr("font-size", this.sizeLegendOptions.fontSize)
      .attr("color", this.sizeLegendOptions.fontColor)
      .attr(
        "text-anchor",
        isOrientationHorizontal || orientation === "vertical"
          ? "middle"
          : "start"
      )
      .attr(
        "alignment-baseline",
        orientation === "horizontal" ? "before-edge" : "central"
      );

    const textGroupBBox = textGroup.node().getBBox();

    const circleCoordinates = this.constructCoordinatesForSizeLegendCircles(
      orientation,
      minSize,
      maxSize,
      stepSize,
      textGroupBBox.width,
      textGroupBBox.height
    );

    circleGroup
      .selectAll("circle")
      .data(d3Array.range(steps))
      .enter()
      .append("circle")
      .attr("cx", circleCoordinates.x)
      .attr("cy", circleCoordinates.y)
      .attr("r", (d) => minSize + d * stepSize)
      .attr("fill", this.sizeLegendOptions.circleColor);

    const circleGroupBBox = circleGroup.node().getBBox();

    if (isOrientationHorizontal) {
      this.sizeLegendSvgNode.attr(
        "width",
        circleGroupBBox.width + this.sizeLegendOptions.svgPadding * 2
      );
      this.sizeLegendSvgNode.attr(
        "height",
        circleGroupBBox.height +
          textGroupBBox.height +
          this.sizeLegendOptions.circleTextGap +
          this.sizeLegendOptions.svgPadding * 2
      );
    } else {
      this.sizeLegendSvgNode
        .attr(
          "height",
          circleGroupBBox.height + this.sizeLegendOptions.svgPadding * 2
        )
        .attr(
          "width",
          circleGroupBBox.width +
            this.sizeLegendOptions.circleTextGap +
            textGroupBBox.width +
            this.sizeLegendOptions.svgPadding * 2
        );
    }

    if (!this.isSizeLegendDomElementProvided) {
      this.sizeLegendSvgNode.style("position", "absolute");
      switch (this.sizeLegendOptions.position) {
        case "top-left":
          this.sizeLegendSvgNode.style("top", "0px").style("left", "0px");
          break;
        case "top-right":
          this.sizeLegendSvgNode.style("top", "0px").style("right", "0px");
          break;
        case "bottom-left":
          this.sizeLegendSvgNode
            .style("bottom", this._spec.margins.bottom)
            .style("left", "0px");
          break;
        case "bottom-right":
          this.sizeLegendSvgNode
            .style("bottom", this._spec.margins.bottom)
            .style("right", "0px");
          break;
      }

      this.updateMarginsToAccountForSizeLegend();
      this.plot.setSpecification(this._spec);
    }
  }

  /**
   * Constructs the coordinates for the text elements of the size legend based on the orientation.
   *
   * @param {string} orientation - Orientation of the legend (e.g., 'horizontal', 'horizontal-inverted', etc.).
   * @param {number} minSize - Minimum size value for the legend.
   * @param {number} maxSize - Maximum size value for the legend.
   * @param {number} stepSize - Step size between each size value.
   * @returns {Object} An object containing x and y functions for computing the text element's position.
   */
  constructCoordinatesForSizeLegendText(
    orientation,
    minSize,
    maxSize,
    stepSize
  ) {
    let nextX = this.sizeLegendOptions.svgPadding;
    let nextY = this.sizeLegendOptions.svgPadding;
    switch (orientation) {
      case "horizontal":
        return {
          x: (d, i) => {
            const radius = minSize + d * stepSize;
            const x = nextX + radius + this.sizeLegendOptions.circleGap;
            nextX = x + radius;
            return x;
          },
          y: () => this.sizeLegendOptions.svgPadding,
        };
      case "horizontal-inverted":
        return {
          x: (d, i) => {
            const radius = minSize + d * stepSize;
            const x = nextX + radius + this.sizeLegendOptions.circleGap;
            nextX = x + radius;
            return x;
          },
          y: (d, i) =>
            maxSize * 2 +
            this.sizeLegendOptions.circleTextGap +
            this.sizeLegendOptions.svgPadding,
        };
      case "vertical-inverted":
        return {
          x: () => this.sizeLegendOptions.svgPadding,
          y: (d, i) => {
            const radius = minSize + d * stepSize;
            const y = nextY + radius + this.sizeLegendOptions.circleGap;
            nextY = y + radius;
            return y;
          },
        };
      case "vertical":
        return {
          x: (d, i) =>
            maxSize * 2 +
            this.sizeLegendOptions.circleTextGap +
            this.sizeLegendOptions.svgPadding,
          y: (d, i) => {
            const radius = minSize + d * stepSize;
            const y = nextY + radius + this.sizeLegendOptions.circleGap;
            nextY = y + radius;
            return y;
          },
        };
    }
  }

  /**
   * Constructs the coordinates for the circle elements of the size legend based on the orientation.
   *
   * @param {string} orientation - Orientation of the legend (e.g., 'horizontal', 'horizontal-inverted', etc.).
   * @param {number} minSize - Minimum size value for the legend.
   * @param {number} maxSize - Maximum size value for the legend.
   * @param {number} stepSize - Step size between each size value.
   * @param {number} [xBuffer=0] - Optional buffer space in the x-axis.
   * @param {number} [yBuffer=0] - Optional buffer space in the y-axis.
   * @returns {Object} An object containing x and y functions for computing the circle element's position.
   */
  constructCoordinatesForSizeLegendCircles(
    orientation,
    minSize,
    maxSize,
    stepSize,
    xBuffer = 0,
    yBuffer = 0
  ) {
    let nextX = this.sizeLegendOptions.svgPadding;
    let nextY = this.sizeLegendOptions.svgPadding;
    switch (orientation) {
      case "horizontal":
        return {
          x: (d, i) => {
            const radius = minSize + d * stepSize;
            const x = nextX + radius + this.sizeLegendOptions.circleGap;
            nextX = x + radius;
            return x;
          },
          y: () =>
            maxSize +
            this.sizeLegendOptions.svgPadding +
            this.sizeLegendOptions.circleTextGap +
            yBuffer,
        };
      case "horizontal-inverted":
        return {
          x: (d, i) => {
            const radius = minSize + d * stepSize;
            const x = nextX + radius + this.sizeLegendOptions.circleGap;
            nextX = x + radius;
            return x;
          },
          y: () => maxSize + this.sizeLegendOptions.svgPadding,
        };
      case "vertical-inverted":
        return {
          x: () =>
            maxSize +
            this.sizeLegendOptions.svgPadding +
            this.sizeLegendOptions.circleTextGap +
            xBuffer,
          y: (d, i) => {
            const radius = minSize + d * stepSize;
            const y = nextY + radius + this.sizeLegendOptions.circleGap;
            nextY = y + radius;
            return y;
          },
        };
      case "vertical":
        return {
          x: () => maxSize + this.sizeLegendOptions.svgPadding,
          y: (d, i) => {
            const radius = minSize + d * stepSize;
            const y = nextY + radius + this.sizeLegendOptions.circleGap;
            nextY = y + radius;
            return y;
          },
        };
    }
  }

  /**
   * Sets the options for the size legend. This method configures the size legend's appearance
   * and position, and optionally accepts a DOM element for rendering the legend.
   *
   * @param {Object} legendOptions - Configuration options for the size legend.
   * @param {HTMLElement} [legendDomElement] - Optional DOM element to use for the legend.
   */
  setSizeLegendOptions(legendOptions, legendDomElement) {
    this.isSizeLegendDomElementProvided = !!legendDomElement;

    if (legendOptions) {
      this.sizeLegendOptions = {
        ...this.sizeLegendOptions,
        ...legendOptions,
      };
    }

    if (!legendDomElement) {
      this.sizeLegendDomElement = this.elem.lastChild;
    } else this.sizeLegendDomElement = legendDomElement;
  }
}

/**
 * Class to create traditional heatmap plots
 *
 * @class RectplotGL
 * @extends {BaseGL}
 */
class RectplotGL extends BaseGL {
  /**
   * Creates an instance of RectplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof RectplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    // state
    this.state = {
      size: 20,
      opacity: 0.8,
      color: "#3182bd",
      xgap: 0,
      ygap: 0,
    };
  }

  /**
   * Generate the specification for Rect heatmap Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof RectplotGL
   */
  generateSpec() {
    let xGaps = (i) => {
      return (
        1 +
        (Array.isArray(this.state["xgap"])
          ? this.state["xgap"][i]
          : this.state["xgap"])
      );
    };

    let yGaps = (i) => {
      return (
        1 +
        (Array.isArray(this.state["ygap"])
          ? this.state["ygap"][i]
          : this.state["ygap"])
      );
    };

    let spec_inputs = {};

    // Setting X and Y Axis Domains to [-1, 1]
    this.xAxisRange = [-1, 1];
    this.yAxisRange = [-1, 1];

    spec_inputs.x = mapArrayOrTypedArray(this.input.x, (e, i) => String(e));
    spec_inputs.y = mapArrayOrTypedArray(this.input.y, (e, i) => String(e));

    let default_width = 198 / (getMinMax(this.input.x)[1] + 1);
    let default_height = 198 / (getMinMax(this.input.y)[1] + 1);

    spec_inputs.width = mapArrayOrTypedArray(
      this.input.x,
      (e, i) => default_width - xGaps(i)
    );
    spec_inputs.height = mapArrayOrTypedArray(
      this.input.y,
      (e, i) => default_height - yGaps(i)
    );

    let spec = {
      margins: this.margins,
      defaultData: {
        x: spec_inputs.x,
        y: spec_inputs.y,
      },
      xAxis: "none",
      yAxis: "none",
      tracks: [
        {
          mark: "rect",
          x: {
            attribute: "x",
            type: "categorical",
            scale: "linear",
            cardinality: getMinMax(this.input.x)[1] + 1,
          },
          y: {
            attribute: "y",
            type: "categorical",
            scale: "linear",
            cardinality: getMinMax(this.input.y)[1] + 1,
          },
          opacity: { value: this.state.opacity },
          width: { value: default_width },
          height: { value: default_height },
        },
      ],
    };

    this._generateSpecForLabels(spec);
    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);
    this._generateSpecForEncoding(spec, "width", spec_inputs.width);
    this._generateSpecForEncoding(spec, "height", spec_inputs.height);

    return spec;
  }
}

/**
 * Class to create tick plots.
 * These are extremely useful for quickly rendering large amounts of data.
 *
 * @class TickplotGL
 * @extends {BaseGL}
 */
class TickplotGL extends BaseGL {
  /**
   * Creates an instance of TickplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof TickplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    // state
    this.state = {
      size: 20,
      opacity: 0.8,
      color: "#3182bd",
      xgap: 0,
      ygap: 0,
    };
  }

  /**
   * Generate the specification for Tick Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof TickplotGL
   */
  generateSpec() {
    let default_width = 198 / (getMinMax(this.input.x)[1] + 1);
    let default_height = 198 / (getMinMax(this.input.y)[1] + 1);

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        labels.push({
          x: -1 + (2 * ilx + 1) / xlabels_len,
          y: 1.05,
          type: "row",
          index: ilx,
          text: this.input["xlabels"][ilx],
          fixedY: true,
          "text-anchor": "center",
        });
      }
    }

    if ("ylabels" in this.input && this.input["ylabels"] !== null) {
      if (labels == null) {
        labels = [];
      }

      const ylabels_len = this.input["ylabels"].length;
      for (let ily = 0; ily < ylabels_len; ily++) {
        labels.push({
          x: -1.1,
          y: -1 + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end",
        });
      }
    }

    // Setting X and Y Axis Domains
    this.xAxisRange = getMinMax(this.input.x);
    this.yAxisRange = getMinMax(this.input.y);

    let spec = {
      margins: this.margins,
      defaultData: {
        x: this.input.x,
        y: this.input.y,
      },
      xAxis: "bottom",
      yAxis: "left",
      tracks: [
        {
          mark: "tick",
          x: {
            attribute: "x",
            type: "quantitative",
            domain: this.xAxisRange,
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: this.yAxisRange,
          },
          opacity: { value: this.state.opacity },
          width: { value: default_width },
          height: { value: default_height },
        },
      ],
    };

    if (labels !== null) {
      spec["labels"] = labels;
    }

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
  }
}

exports.DotplotGL = DotplotGL;
exports.RectplotGL = RectplotGL;
exports.TickplotGL = TickplotGL;
