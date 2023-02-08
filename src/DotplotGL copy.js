import BaseGL from "./BaseGL";

class DotplotGL extends BaseGL {
  constructor(selectorOrElement) {
    super(selectorOrElement);
  }

  generateSpec() {
    const { xBound, yBound } = this.calcBounds();

    let xScaler = (i) => {
      return (
        0.1 +
        (Array.isArray(this.state["xgap"])
          ? this.state["xgap"][i]
          : this.state["xgap"])
      );
    };

    let yScaler = (i) => {
      return (
        0.1 +
        (Array.isArray(this.state["ygap"])
          ? this.state["ygap"][i]
          : this.state["ygap"])
      );
    };

    // modify so that the circles are at the end
    let spec_inputs = {};
    spec_inputs.x = this.input.x.map((e, i) => e * xScaler(i));
    spec_inputs.y = this.input.y.map((e, i) => e * yScaler(i));

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      for (let ilx = 0; ilx < this.input["xlabels"].length; ilx++) {
        labels.push({
          x: ilx * xScaler(ilx) - 0.02,
          y: this.yDomain[1] * yScaler(ilx) + 0.25,
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

      for (let ily = 0; ily < this.input["ylabels"].length; ily++) {
        labels.push({
          x: -0.2,
          y: ily * yScaler(ily) - 0.02,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end",
        });
      }
    }

    let spec = {
      margins: {
        top: "25px",
        bottom: "25px",
        left: "25px",
        right: "25px",
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
            domain: xBound,
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: yBound,
          },
          size: { value: this.state.size },
          opacity: { value: this.state.opacity },
        },
      ],
    };

    if (labels !== null) {
      spec["labels"] = labels;
    }

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    console.log(spec);

    // if ("shape" in this.state) {
    //   this._generateSpecForEncoding(spec, "shape", this.state.shape);
    // }

    return spec;
  }
}

export default DotplotGL;
