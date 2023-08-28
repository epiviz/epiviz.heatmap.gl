import { range } from "d3-array";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import BaseGL from "./BaseGL";
import {
  DEFAULT_MARGIN_BETWEEN_DOTS,
  DEFAULT_SIZE_LEGEND_CIRCLE_GAP,
  DEFAULT_SIZE_LEGEND_CIRCLE_TEXT_GAP,
  DEFAULT_SIZE_LEGEND_SVG_PADDING,
} from "./constants";
import {
  getMaxRadiusForDotplot,
  getMinMax,
  getScaledRadiusForDotplot,
  parseMargins,
  mapArrayOrTypedArray,
} from "./utils";

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
    let { minSize, maxSize, steps, maxSizeInPx } = this.sizeLegendData;
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

    // Calculate the desired minimum size in pixels proportionally
    const minPx = (minSize * maxPx) / maxSize;

    // Create a linear scale
    const sizeScale = scaleLinear()
      .domain([minSize, maxSize])
      .range([minPx, maxPx]);

    minSize = sizeScale(minSize);
    maxSize = sizeScale(maxSize);
    const orientation = this.sizeLegendOptions.orientation;

    // Calculate step size
    const stepSize = (maxSize - minSize) / (steps - 1);

    // SVG container for the legend
    this.sizeLegendSvgNode = select(this.sizeLegendDomElement).append("svg");
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
      .data(range(steps))
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
      .data(range(steps))
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
      console.log("before", this._spec.margins);

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

export default DotplotGL;
