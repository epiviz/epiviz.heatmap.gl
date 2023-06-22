export function isObject(object) {
  return typeof object === "object" && Array.isArray(object) === false;
}

export const getMinMax = (arr) => {
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

export const parseMargins = (margins) => {
  const parsedMargins = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  for (let key in margins) {
    if (margins.hasOwnProperty(key)) {
      const value = margins[key];
      const parsedValue = parseInt(value, 10);

      if (!isNaN(parsedValue)) {
        parsedMargins[key] = parsedValue;
      }
    }
  }

  return parsedMargins;
};

export const getTextWidth = (text, fontSize = "16px") => {
  // Create a temporary SVG to measure the text width
  const svg = d3.select("body").append("svg");
  const textNode = svg.append("text").style("font-size", fontSize).text(text);
  const width = textNode.node().getBBox().width;
  svg.remove();
  return width;
};
