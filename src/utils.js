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

/**
 * Function to convert a hexadecimal color to its RGB equivalent.
 *
 * @param {string} hex - The hexadecimal color string. Must start with "#" and be followed by 6 hexadecimal digits.
 * @returns {Array<number>} An array containing the RGB values (0-255) in the order [r, g, b].
 */
export function hexToRGB(hex) {
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Function to convert an RGB color to its hexadecimal equivalent.
 *
 * @param {Array<number>} rgb - An array of three numbers [r, g, b] representing an RGB color.
 * @returns {string} A string representing the color in hexadecimal format.
 */
export function rgbToHex(rgb) {
  let r = rgb[0].toString(16),
    g = rgb[1].toString(16),
    b = rgb[2].toString(16);
  return (
    "#" +
    ((r.length == 1 ? "0" : "") + r) +
    ((g.length == 1 ? "0" : "") + g) +
    ((b.length == 1 ? "0" : "") + b)
  );
}

/**
 * Function to mix a color with white to create a "brightened" effect.
 *
 * @param {Array<number>} rgb - An array of three numbers [r, g, b] representing an RGB color.
 * @param {number} amount - The brightening factor. A value between 0 (no change) and 1 (complete white).
 * @returns {Array<number>} An array containing the RGB values of the brightened color.
 */
export function mixWithWhite(rgb, amount) {
  return [
    Math.floor(rgb[0] + (255 - rgb[0]) * amount),
    Math.floor(rgb[1] + (255 - rgb[1]) * amount),
    Math.floor(rgb[2] + (255 - rgb[2]) * amount),
  ];
}

/**
 * Function to convert a color from the "rgb(r, g, b)" string format to an array of numbers.
 *
 * @param {string} rgbStr - The color in "rgb(r, g, b)" string format.
 * @returns {Array<number>} An array containing the RGB values (0-255) in the order [r, g, b].
 */
export function strToRGB(rgbStr) {
  let match = rgbStr.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  } else {
    throw new Error("Invalid RGB string format");
  }
}

/**
 * Function to determine whether a given color is in RGB format.
 *
 * @param {Array<number> | string} color - The color in either RGB format (as a string in the "rgb(r, g, b)" format) or hexadecimal format (as a string).
 * @returns {boolean} True if the color is in RGB format, false otherwise.
 */
export function isRGB(color) {
  return color.startsWith("rgb");
}
