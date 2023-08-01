import BaseGL from "./BaseGL";
import { getMinMax, mapArrayOrTypedArray } from "./utils";

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
    let max_r = getMinMax([198 / (xlen + 1), 198 / (ylen + 1)])[1] - 5;
    let tsize = this.state["size"];
    if (Array.isArray(this.state["size"])) {
      let sMinMax = getMinMax(this.state["size"]);
      tsize = this.state["size"].map(
        (e) => (max_r - 5) * ((e - sMinMax[0]) / (sMinMax[1] - sMinMax[0])) + 5
      );
    }

    this._generateSpecForLabels(spec);
    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", tsize);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
  }
}

export default DotplotGL;
