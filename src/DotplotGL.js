import BaseGL from "./BaseGL";
import { getMinMax } from "./utils";

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

export default DotplotGL;
