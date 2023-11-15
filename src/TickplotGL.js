import BaseGL from "./BaseGL";
import { getMinMax } from "./utils";

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

export default TickplotGL;
