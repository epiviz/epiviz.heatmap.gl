'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var WebGLVis = _interopDefault(require('epiviz.gl'));

function isObject(object) {
  return typeof object === "object" && Array.isArray(object) === false;
}

const getMinMax = (arr) => {
  var max = -Number.MAX_VALUE,
    min = Number.MAX_VALUE;
  arr.forEach(function (x) {
    if (max < x) {
      max = x;
    }
    if (min > x) {
      min = x;
    }
  });
  return [min, max];
};

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

    // state
    this.state = {
      size: 20,
      opacity: 1,
      color: "#3182bd",
      xgap: 0.3,
      ygap: 0.3,
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
   * @param {Array} legendData, data for the legend
   * @param {Array} legendData.labels, labels for the legend
   * @param {Array} legendData.colors, colors for the legend
   * @param {Array} legendData.intensity, intensity for the color inside legend
   * @memberof BaseGL
   */
  setInput(data, legendData = null) {
    if (
      isObject(data) &&
      "x" in data &&
      "y" in data &&
      data.x.length === data.y.length
    ) {
      this.ncols = data.xlabels?.length;
      this.nrows = data.ylabels?.length;

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

    this.legendData = legendData;
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
    // Render the legend
    if (this.legendData && this.legendDomElement) {
      this.renderLegend();
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
  }

  /**
   * Render the legend for the intensity plot.
   * This is used to render the legend for the intensity plot.
   **/
  renderLegend() {
    const position = this.legendPosition;
    // Only render the legend if we have the legend data and the legend dom element
    if (!this.legendDomElement || !this.legendData) return;

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
    const legendSize = 20;
    const labelSize = 25;

    // Adjust the SVG size and the legend position according to the position parameter
    let svgWidth, svgHeight, transformX, transformY;
    if (position === "left" || position === "right") {
      svgWidth = legendSize + labelSize;
      svgHeight = containerHeight;
      transformY = averageCharWidth;
    } else {
      svgWidth = containerWidth;
      svgHeight = legendSize + labelSize;
      transformX = averageCharWidth;
    }

    const svgContainer = d3
      .select(this.legendDomElement)
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
      .data(this.legendData)
      .enter()
      .append("stop")
      .attr("offset", (d) => d.intensity * 100 + "%")
      .attr("stop-color", (d) => d.color);

    // Create a mapping from intensity to label
    const intensityToLabel = {};
    this.legendData.forEach((d) => {
      if (d.label !== "") {
        intensityToLabel[d.intensity] = d.label;
      }
    });

    const intensityScale = d3
      .scaleLinear()
      .range([
        0,
        position === "left" || position === "right"
          ? legendHeight
          : legendWidth,
      ])
      .domain([0, 1]);

    let legendAxis;
    if (position === "left") {
      legendAxis = d3.axisLeft(intensityScale);
      transformX = labelSize;
    } else if (position === "top") {
      legendAxis = d3.axisTop(intensityScale);
      transformY = labelSize;
    } else if (position === "right") {
      transformX = legendSize;
      legendAxis = d3.axisRight(intensityScale);
    } else {
      transformY = legendSize;
      legendAxis = d3.axisBottom(intensityScale);
    }

    legendAxis
      .tickValues(Object.keys(intensityToLabel).map(Number)) // Only use intensities that have labels
      .tickFormat((d) => intensityToLabel[d]); // Use the intensity to label mapping

    svgContainer
      .append("g")
      .attr("transform", `translate(${transformX}, ${transformY})`)
      .call(legendAxis);

    const maxLabelChars = Math.max(
      ...this.legendData.map((d) => d.label.toString().length)
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
        position === "left" || position === "right" ? legendSize : legendWidth
      )
      .attr(
        "height",
        position === "left" || position === "right" ? legendHeight : legendSize
      )
      .style("fill", `url(#${gradientId})`)
      .attr("x", rectX)
      .attr("y", rectY);

    // Update margins to account for the legend only if dom element is not provided
    if (!this.isLegendDomElementProvided) {
      this._spec.margins = {
        ...this._spec.margins,
        [position]: `calc(${
          (position === "left" || position === "right" ? 45 : 45) + "px"
        } + ${this._spec.margins[position]})`,
      };

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
    let xlen = getMinMax(this.input.x)[1] + 1,
      ylen = getMinMax(this.input.y)[1] + 1;
    spec_inputs.x = this.input.x.map((e, i) => -1 + (2 * e + 1) / xlen);
    spec_inputs.y = this.input.y.map((e, i) => -1 + (2 * e + 1) / ylen);

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        labels.push({
          x: -1.05 + (2 * ilx + 1) / xlabels_len,
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
          x: -1.05,
          y: -1.05 + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end",
        });
      }
    }

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
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
            domain: [-1, 1],
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: [-1, 1],
          },
          opacity: { value: this.state.opacity },
        },
      ],
    };

    if (labels !== null) {
      spec["labels"] = labels;
    }

    // scale size of dots
    let max_r = getMinMax([198 / (xlen + 1), 198 / (ylen + 1)])[1] - 5;
    let tsize = this.state["size"];
    if (Array.isArray(this.state["size"])) {
      let sMinMax = getMinMax(this.state["size"]);
      tsize = this.state["size"].map(
        (e) => (max_r - 5) * ((e - sMinMax[0]) / (sMinMax[1] - sMinMax[0])) + 5
      );
    }

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", tsize);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
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
    spec_inputs.x = this.input.x.map((e, i) => String(e));
    spec_inputs.y = this.input.y.map((e, i) => String(e));

    let default_width = 198 / (getMinMax(this.input.x)[1] + 1);
    let default_height = 198 / (getMinMax(this.input.y)[1] + 1);

    spec_inputs.width = this.input.x.map((e, i) => default_width - xGaps(i));
    spec_inputs.height = this.input.y.map((e, i) => default_height - yGaps(i));

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        labels.push({
          x: -1.05 + (2 * ilx + 1) / xlabels_len,
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
          x: -1.05,
          y: -1.05 + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end",
        });
      }
    }

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
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

    if (labels !== null) {
      spec["labels"] = labels;
    }

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

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
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
            domain: getMinMax(this.input.x),
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: getMinMax(this.input.y),
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
