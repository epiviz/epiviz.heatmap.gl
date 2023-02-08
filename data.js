let nrows = 10,
  ncols = 15;

let x = [],
  y = [],
  xlabels = [],
  ylabels = [],
  var_intensity = [],
  var_size = [];

for (let ilx = 0; ilx < nrows; ilx++) {
  xlabels.push(`r${ilx}`);
  for (let ily = 0; ily < ncols; ily++) {
    x.push(ilx);
    y.push(ily);
    var_intensity.push(Math.random());
    var_size.push(25 * Math.random());
  }
}

for (let ily = 0; ily < ncols; ily++) {
  ylabels.push(`c${ily}`);
}

// map intensities to color
let color_map = var_intensity.map((x, i) => d3.interpolateViridis(x))

const data = {
  x: x,
  y: y,
  xlabels: xlabels,
  ylabels: ylabels,
};

const color = color_map;
const size = var_size;

export { data, color, size };
