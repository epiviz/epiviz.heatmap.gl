import { select } from "d3-selection";
import { DEFAULT_MIN_RADIUS_FOR_DOTPLOT } from "./constants";

/**
 * Check if a given variable is an object and not an array.
 *
 * @param {any} object - The variable to check.
 * @returns {boolean} - Returns true if the variable is an object, and not an array.
 */
export function isObject(object) {
  return typeof object === "object" && Array.isArray(object) === false;
}

/**
 * Get the minimum and maximum values from an array.
 *
 * @param {Array<number>} arr - An array of numbers.
 * @returns {Array<number>} - An array containing the minimum and maximum values, in that order.
 */
export const getMinMax = (arr) => {
  var max = -Number.MAX_VALUE,
    min = Number.MAX_VALUE;
  arr.forEach(function (x) {
    if (max < x) max = x;
    if (min > x) min = x;
  });
  return [min, max];
};

/**
 * Parses an object of margins and returns an object with top, bottom, left, and right margins as integers.
 *
 * @param {Object} margins - An object with potential margin properties.
 * @returns {Object} - An object with top, bottom, left, and right margins as integers.
 */
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

/**
 * Measure the width of a text string for a given font size using SVG.
 *
 * @param {string} text - The text to measure.
 * @param {string} fontSize - The font size to use for the measurement, e.g., '16px'.
 * @returns {number} - The width of the text in pixels.
 */
export const getTextWidth = (text, fontSize = "16px") => {
  // Create a temporary SVG to measure the text width
  const svg = select("body").append("svg");
  const textNode = svg.append("text").style("font-size", fontSize).text(text);
  const width = textNode.node().getBBox().width;
  svg.remove();
  return width;
};

export const getMaxRadiusForDotplot = (xlen, ylen, padding) => {
  return Math.max(
    Math.min(198 / (xlen + 1), 198 / (ylen + 1)) - padding,
    DEFAULT_MIN_RADIUS_FOR_DOTPLOT
  );
};

export const getScaledRadiusForDotplot = (
  radius,
  maxRadiusScaled,
  minRadiusOriginal,
  maxRadiusOriginal,
  defaultMinRadius = DEFAULT_MIN_RADIUS_FOR_DOTPLOT
) => {
  return (
    defaultMinRadius +
    (maxRadiusScaled - defaultMinRadius) *
      ((radius - minRadiusOriginal) / (maxRadiusOriginal - minRadiusOriginal))
  );
};

/**
 * A function to map over both regular JavaScript arrays and typed arrays.
 *
 * @param {Array|TypedArray} array - The input array or typed array.
 * @param {Function} callback - A function that produces an element of the new array,
 *      taking three arguments:
 *      currentValue - The current element being processed in the array.
 *      index - The index of the current element being processed in the array.
 *      array - The array map was called upon.
 * @returns {Array|TypedArray} - A new array or typed array with each element being the result
 *      of the callback function.
 * @throws {Error} - Throws an error if the input is neither a regular array nor a typed array.
 */
export const mapArrayOrTypedArray = (array, callback) => {
  // Check if the input is a regular JavaScript array.
  if (Array.isArray(array)) {
    return array.map(callback);
  }
  // Check if the input is a typed array.
  else if (
    array instanceof Int8Array ||
    array instanceof Uint8Array ||
    array instanceof Uint8ClampedArray ||
    array instanceof Int16Array ||
    array instanceof Uint16Array ||
    array instanceof Int32Array ||
    array instanceof Uint32Array ||
    array instanceof Float32Array ||
    array instanceof Float64Array
  ) {
    // Create a new typed array of the same type and size as the input.
    let result = new array.constructor(array.length);

    // Use forEach to emulate the map functionality for typed arrays.
    array.forEach((value, index) => {
      result[index] = callback(value, index);
    });

    return result;
  }
  // Handle the case where the input is neither a regular array nor a typed array.
  else {
    throw new Error("Input is neither a normal array nor a typed array.");
  }
};
