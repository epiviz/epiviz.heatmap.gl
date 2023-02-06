# epiviz.heatmap.gl

A fast and scalable WebGL2 based rendering library for visualizing heatmaps/dot plots. The library uses [epiviz.gl](https://github.com/epiviz/epiviz.gl) under the hood and provides an easier interface for use in various applications.

Internally, the library creates two WebWorkers

- data worker: indexes the data points using [flatbush](https://github.com/mourner/flatbush)
- webgl worker: all the rendering magic happens here

`epiviz.gl` uses [OffScreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) to delegate rendering to a worker. since the main thread of the browser is less busy, this provides a fluid, high-performance user experience for applications.

## Getting started

### Installation

package is available through [npm](https://www.npmjs.com/package/epiviz.heatmap.gl)

```sh
    npm install epiviz.heatmap.gl
```

### Usage

- [app/index.html](./app/index.html) provides an easier example and code on how to use the library
- If you want to use the library in a react app, check usage in [Kana](ww.github.com/jkanche/kana)

#### Simple usage:

```js
  import HeatmapGL from "./index.js";

  # you can either pass in a dom selector or HTMLElement
  let plot = new HeatmapGL(".canvas");

  # provide input data to the element, 
  # data must contain x (as `rows`) and y (as `columns`)
  # you can also provide x and y labels
  plot.setInput({
    x: [...],
    y: [...],
    xlabels: [],
    ylabels: [],
  });

  # render the plot
  plot.render();
```

### Advanced Usage

The library provides methods to capture events and modify attributes -

#### Interaction modes

Supports three modes

- `pan` - no selection, pan (`drag`)/zoom (`wheel`) the canvas
- `box` - box selections, no pan but allows zoom (`wheel`)
- `lasso` - same as box, no pan but allows zoom (`wheel`)

```js
setInteraction(mode);
```

#### Events

- hoverCallback
- clickCallback
- selectionCallback

**_hover and click also provide the distance of the point from the mouse location. This metric can be used to enable various interactions._**

```js
plot.hoverCallback = function (point) {
  if (point) {
    //   use some threshold (1.5)
    if (point.distance <= 1.5) {
      console.log(`${point} is closest`);
    }
  }
};

plot.selectionCallback = function (points) {
  // ... do something ...
  console.log(points);
};
```

#### Encodings

<img src="./assets/iris.png" width=200 alt="iris dataset encoding various attributes">

***checkout the example for [Iris dataset](./app/iris.html)***

These attributes either take a fixed value or an array of values for each data point.

- `color` - color/rgb/hex code
- `size` - size of each dot
- `opacity` - opacity across the entire plot
- `xgap` or `ygap` - gap between rows and columns

```js
  plot.setState({
    size: <SIZE>
    color: <COLOR>
    xgap: <GAPS>,
    ygap: <GAPS>,
    opacity: <OPACITY>
  });
```
