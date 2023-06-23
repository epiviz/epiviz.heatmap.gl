let nrows = 10,
  ncols = 15;

let x = [],
  y = [],
  xlabels = [],
  ylabels = [],
  var_intensity = [],
  var_size = [];

for (let ilx = 0; ilx < nrows; ilx++) {
  xlabels.push(`c${ilx}`);
  for (let ily = 0; ily < ncols; ily++) {
    x.push(ilx);
    y.push(ily);
    var_intensity.push(Math.random());
    var_size.push(25 * Math.random());
  }
}

for (let ily = 0; ily < ncols; ily++) {
  if (ily % 2 == 0) {
    ylabels.push(
      `r${ily} - this is a very long label that should be truncated`
    );
  } else {
    ylabels.push(`r${ily} - label`);
  }
}

// map intensities to color
let color_map = var_intensity.map((x, i) => d3.interpolateViridis(x));

let intensityLegendData = [];

for (let i = 0; i < 1; i += 0.1) {
  const intensity = Math.round(i * 100) / 100;

  intensityLegendData.push({
    color: d3.interpolateViridis(i),
    intensity,
    label: intensity,
  });
}

const data = {
  x: x,
  y: y,
  xlabels: xlabels,
  ylabels: ylabels,
};

const color = color_map;
const size = var_size;

const groupingRowData = [
  {
    startIndex: 0,
    endIndex: 1,
    color: "#52bc9a",
    label: "group 1",
  },
  {
    startIndex: 2,
    endIndex: 4,
    color: "#f7ea4d",
    label: "group 2",
  },
  {
    startIndex: 5,
    endIndex: 7,
    color: "#450154",
    label: "group 3",
  },
  {
    startIndex: 7,
    endIndex: 9,
    color: "#38588b",
    label: "group 4",
  },
  {
    startIndex: 10,
    endIndex: 12,
    color: "#6a649c",
    label: "group 5",
  },
  {
    startIndex: 13,
    endIndex: 14,
    color: "#9cdc6f",
    label: "group 6",
  },
];

const groupingColumnData = [
  {
    startIndex: 0,
    endIndex: 2,
    color: "#6a649c",
    label: "group 1",
  },
  {
    startIndex: 3,
    endIndex: 5,
    color: "#52bc9a",
    label: "group 2",
  },
  {
    startIndex: 6,
    endIndex: 7,
    color: "#f7ea4d",
    label: "group 3",
  },
  {
    startIndex: 8,
    endIndex: 9,
    color: "#6d4688",
    label: "group 4",
  },
];

export {
  data,
  color,
  size,
  intensityLegendData,
  groupingRowData,
  groupingColumnData,
};
