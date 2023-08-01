import BaseGL from "./BaseGL";
import { getMinMax, mapArrayOrTypedArray } from "./utils";

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

export default RectplotGL;
