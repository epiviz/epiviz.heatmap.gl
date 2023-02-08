import BaseGL from "./BaseGL";
import { getMinMax } from "./utils";


/**
 * Class to create traditional heatmap plots
 *
 * @class RectplotGL
 * @extends {BaseGL}
 */
class RectplotGL extends BaseGL {
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

    console.log("rectplot", spec);

    // if ("shape" in this.state) {
    //   this._generateSpecForEncoding(spec, "shape", this.state.shape);
    // }

    return spec;
  }
}

export default RectplotGL;
