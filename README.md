# epiviz.heatmap.gl

- API: [https://epiviz.github.io/epiviz.heatmap.gl/docs/](https://epiviz.github.io/epiviz.heatmap.gl/docs/)
- DEMO: [https://epiviz.github.io/epiviz.heatmap.gl/](https://epiviz.github.io/epiviz.heatmap.gl/)
- Examples are in the [app/index.html](./app/index.html) directory

![Demo](./assets/epiviz.heatmap.gl.png)

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

#### Intensity Legend

Adding an Intensity Legend is optional. If you wish to add one, the simplest way is to provide the data in the following format:

```javascript
[
  { color: "#fff", intensity: 0.1, label: "-2" },
  { color: "#fff", intensity: 0.2, label: "-1.5" },
];
```

You can use the existing setState method to provide the legend Data encoding like so:

```javascript
plot.setState({
  legendIntensityData,
});
```

With this option, the intensity legend will render at the bottom of the graph by default. You can always change the position using the setIntensityLegendOptions method:

```javascript
setIntensityLegendOptions("top" | "bottom" | "left" | "right");
```

If you wish for the legend to be rendered somewhere else in the DOM, you must provide the selector or DOM element, along with the position/type of intensity legend you want, for example:

```javascript
setIntensityLegendOptions("top", ".intensity-legend");
```

You can also specify width and height:

```javascript
setIntensityLegendOptions("top", ".intensity-legend", 400, 500);
```

#### React Usage

To use the library in a React application

```javascript
import { ReactDotplot } from 'epiviz.heatmap.gl/react'

const Component = () => {
  let id = 'unique-id'
  let data = {
    x: [...],
    y: [...],
    xlabels: [],
    ylabels: [],
  }
  let color = [...] // color/rgb/hex code of each dot
  let size = [...] // size of each dot

  return <ReactDotplot
            id={id}
            data={data}
            color={color}
            size={size}
          >
}
```

### Types of Plots

The library provides three ways of rendering heatmap layout plots.

- `RectplotGL` - for traditional heatmaps
- `DotplotGL` - for making dot plot like plots, [reference](https://divingintogeneticsandgenomics.rbind.io/post/clustered-dotplot-for-single-cell-rnaseq/)
- `TickplotGL` - Tick plots are extremely fast at quickly rendering large amounts of data, helpful for rendering interactive [HiC like plots](https://www.bioinformatics.babraham.ac.uk/projects/seqmonk/Help/3%20Visualisation/3.2%20Figures%20and%20Graphs/3.2.12%20The%20HiC%20Heatmap%20Plot.html#:~:text=The%20HiC%20heatmap%20plot%20is,DataStore%20is%20a%20HiC%20dataset.).

The API is same for all these plots.

```js
import { DotplotGL, RectplotGL, TickplotGL } from "./index.js";

// you can either pass in a dom selector or HTMLElement
let plot = new DotplotGL(".canvas");

// provide input data to the element,
// data must contain x (as `rows`) and y (as `columns`)
// you can also provide x and y labels
plot.setInput({
  x: [...],
  y: [...],
  xlabels: [],
  ylabels: [],
});

// render the plot
plot.render();
```

### Advanced Usage

The library provides methods to capture events and modify attributes

#### Interaction modes

Supports three modes

- `pan` - no selection, pan (`drag`)/zoom (`wheel`) the canvas
- `box` - box selections, no pan but allows zoom (`wheel`)
- `lasso` - same as box, no pan but allows zoom (`wheel`)

```js
plot.setInteraction("pan");
```

#### Events

- hoverCallback
- clickCallback
- selectionCallback
- highlightedIndicesCallback

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

plot.highlightedIndicesCallback = function (indices) {
  // ... do something ...
  console.log(indices);
};
```

#### Encodings

These attributes either take a fixed value or an array of values for each data point.

- `color` - color/rgb/hex code
- `size` - size of each dot
- `opacity` - opacity across the entire plot
- `xgap` or `ygap` - gap between rows and columns
- `intensityLegendData` - an array of objects containing color, intensity, and label for the legend.
  e.g [{color: "#000000", intensity: 1, label: "0.1"}]

```js
  plot.setState({
    size: <SIZE>
    color: <COLOR>
    xgap: <GAPS>,
    ygap: <GAPS>,
    opacity: <OPACITY>
    intensityLegendData: <INTENSITY_LEGEND_DATA>
  });
```
