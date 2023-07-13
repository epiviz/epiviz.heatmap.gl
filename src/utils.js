import { select } from "d3-selection";
import { TOOLTIP_IDENTIFIER } from "./constants";

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
  const svg = select("body").append("svg");
  const textNode = svg.append("text").style("font-size", fontSize).text(text);
  const width = textNode.node().getBBox().width;
  svg.remove();
  return width;
};

export const createTooltip = (container, text, posX, posY) => {
  let tooltip = select(container)
    .append("div")
    .attr("id", TOOLTIP_IDENTIFIER)
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("z-index", "1000")
    .style("visibility", "hidden");

  tooltip
    .style("visibility", "visible")
    .text(text)
    .style("left", posX + 10 + "px")
    .style("top", posY - 10 + "px");
};

export const removeTooltip = (container) => {
  const tooltip = select(container).select(`#${TOOLTIP_IDENTIFIER}`);

  if (tooltip) {
    tooltip.remove();
  }
};
