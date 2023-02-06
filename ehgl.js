'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var WebGLVis = _interopDefault(require('epiviz.gl'));

function isObject(object) {
    return typeof object === 'object' && Array.isArray(object) === false;
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

class HeatmapGL {
  constructor(selectorOrElement) {
    this.elem = selectorOrElement;
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
      opacity: 0.8,
      color: "#3182bd",
      xgap: 0.3,
      ygap: 0.3
    };

    // private properties
    this._renderCount = 0;

    // add events
    var self = this;
    this.plot.addEventListener("onSelectionEnd", (e) => {
      self.selectionCallback(e.detail.data);
    });
  }

  generateSpec() {
    const { xBound, yBound } = this.calcBounds();

    let default_shape = "point";
    if ("shape" in this.state) {
      default_shape = this.state["shape"];
    }

    let xScaler = 0.1 + this.state["xgap"], yScaler = 0.1 + this.state["ygap"];

    // modify so that the circles are at the end
    let spec_inputs = JSON.parse(JSON.stringify(this.input));
    if (default_shape == "point") {
      spec_inputs.x = spec_inputs.x.map((e, i) => e * xScaler);
      spec_inputs.y = spec_inputs.y.map((e, i) => e * yScaler);
    }

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      for (let ilx = 0; ilx < this.input["xlabels"].length; ilx++) {
        labels.push({
          x: (ilx * xScaler) - 0.020,
          y: ((this.yDomain[1]) * yScaler) + 0.25,
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
          x: -0.20,
          y: (ily * yScaler) - 0.020,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end"
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
          mark: default_shape,
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
          size: { value: this.state.size ? this.state.size : 15 },
          opacity: { value: this.state.opacity ? this.state.opacity : 0.8 },
        },
      ],
    };

    if (labels !== null) {
      spec["labels"] = labels;
    }

    console.log(spec);

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    console.log(spec);

    // if ("shape" in this.state) {
    //   this._generateSpecForEncoding(spec, "shape", this.state.shape);
    // }

    return spec;
  }

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

  calcBounds() {
    let xBound = [-0.5, this.xDomain[1] + 0.5];
    // Math.max(...this.xDomain.map((a) => Math.abs(a)));
    let yBound = [-0.5, this.yDomain[1] + 0.5];

    return { xBound, yBound };
  }

  setInput(data) {
    if (
      isObject(data) &&
      "x" in data &&
      "y" in data &&
      data.x.length === data.y.length
    ) {
      this.input = { ...this.input, ...data };

      // calc min and max
      let xMinMax = getMinMax(this.input.x);
      let yMinMax = getMinMax(this.input.y);

      if (xMinMax[0] !== 0) {
        throw `x must start from 0`;
      }

      if (yMinMax[0] !== 0) {
        throw `y must start from 0`;
      }

      xMinMax = xMinMax.map((x, i) =>
        x === 0 ? Math.pow(-1, i + 1) * (xMinMax[i + (1 % 2)] * 0.05) : x
      );
      yMinMax = yMinMax.map((x, i) =>
        x === 0 ? Math.pow(-1, i + 1) * (yMinMax[i + (1 % 2)] * 0.05) : x
      );

      this.xDomain = [
        xMinMax[0] - Math.abs(0.05 * xMinMax[0]),
        xMinMax[1] + Math.abs(0.05 * xMinMax[1]),
      ];
      this.yDomain = [
        yMinMax[0] - Math.abs(0.05 * yMinMax[0]),
        yMinMax[1] + Math.abs(0.05 * yMinMax[1]),
      ];

      if ("xlabels" in data) {
        if (data.xlabels.length !== xMinMax[1] + 1) {
          throw `Number of x labels provided must be the same as max(x), starting from 0`;
        }
      }

      if ("ylabels" in data) {
        if (data.ylabels.length !== yMinMax[1] + 1) {
          throw `Number of y labels provided must be the same as max(y), starting from 0`;
        }
      }
    } else {
      throw `input data must contain x and y attributes`;
    }
  }

  setState(encoding) {
    if ("size" in encoding) {
      // scale size between 5 - 20
      let tsize = encoding["size"];
      if (Array.isArray(encoding["size"])) {
        let sMinMax = getMinMax(encoding["size"]);
        tsize = encoding["size"].map(e => (15 * ((e - sMinMax[0])/ (sMinMax[1] - sMinMax[0]))) + 5 );
      }
      this.state["size"] = tsize;
    }

    if ("color" in encoding) {
      this.state["color"] = encoding["color"];
    }

    if ("opacity" in encoding) {
      this.state["opacity"] = encoding["opacity"];
    }

    if ("shape" in encoding) {
      if (["point", "rect"].findIndex(encoding["shape"]) == -1) {
        throw `shape must be either point or rect`;
      }
      this.state["shape"] = encoding["shape"];
    }
  }

  setInteraction(mode) {
    if (!["lasso", "pan", "box"].includes(mode)) {
      throw `${mode} needs to be one of lasso, pan or box selection`;
    }

    this.plot.setViewOptions({ tool: mode });
  }

  resize(width, height) {
    this.plot.setCanvasSize(width, height);

    // this.render();

    // this.plot.setSpecification(spec);
  }

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

  render(width, height) {
    var self = this;
    this._spec = this.generateSpec();

    if (width) {
      this._spec.width = width;
    }

    if (height) {
      this._spec.height = height;
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
      self.clickCallback(hdata);
    });
  }

  // events
  selectionCallback(pointIdxs) {
    return pointIdxs;
  }

  clickCallback(pointIdx) {
    return pointIdx;
  }

  hoverCallback(pointIdx) {
    return pointIdx;
  }
}

module.exports = HeatmapGL;
