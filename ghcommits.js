const nrows = 53,
  ncols = 7;

let x = [],
  y = [],
  xlabels = [],
  ylabels = [],
  var_intensity = [];

const months = [
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
];

for (let ilx = 0; ilx < nrows; ilx++) {
  xlabels.push(ilx % 5 == 0 ? months[ilx / 5] : "");

  for (let ily = 0; ily < ncols; ily++) {
    x.push(ilx);
    y.push(ily);

    const val = Math.random();
    var_intensity.push(val < 0.25 ? 0 : val);
  }
}

ylabels = ["", "Mon", "", "Wed", "", "Fri", ""];

// map intensities to color
let color_map = var_intensity.map((x, i) => x == 0 ? "#ebedf0" : d3.interpolateGreens(x));

const data = {
  x: x,
  y: y,
  xlabels: xlabels,
  ylabels: ylabels,
};

const color = color_map;

export { data, color};
