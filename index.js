import { g as getDimAndMarginStyleForSpecification, D as DEFAULT_WIDTH, a as DEFAULT_HEIGHT, b as getViewportForSpecification, s as scale, c as getScaleForSpecification, f as formatSpecifier$1, e as exponent$1, p as precisionRound$1, d as formatPrefix$1, h as format$1, i as constant$3, j as color$1, r as rgb$2 } from './rgb-390029e9-bf5c69f4.js';

/*!
 * FPSMeter 0.3.1 - 9th May 2013
 * https://github.com/Darsain/fpsmeter
 *
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */
(function (w, undefined$1) {

	/**
	 * Create a new element.
	 *
	 * @param  {String} name Element type name.
	 *
	 * @return {Element}
	 */
	function newEl(name) {
		return document.createElement(name);
	}

	/**
	 * Apply theme CSS properties to element.
	 *
	 * @param  {Element} element DOM element.
	 * @param  {Object}  theme   Theme object.
	 *
	 * @return {Element}
	 */
	function applyTheme(element, theme) {
		for (var name in theme) {
			try {
				element.style[name] = theme[name];
			} catch (e) {}
		}
		return element;
	}

	/**
	 * Return type of the value.
	 *
	 * @param  {Mixed} value
	 *
	 * @return {String}
	 */
	function type(value) {
		if (value == null) {
			return String(value);
		}

		if (typeof value === 'object' || typeof value === 'function') {
			return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
		}

		return typeof value;
	}

	/**
	 * Check whether the value is in an array.
	 *
	 * @param  {Mixed} value
	 * @param  {Array} array
	 *
	 * @return {Integer} Array index or -1 when not found.
	 */
	function inArray(value, array) {
		if (type(array) !== 'array') {
			return -1;
		}
		if (array.indexOf) {
			return array.indexOf(value);
		}
		for (var i = 0, l = array.length; i < l; i++) {
			if (array[i] === value) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Poor man's deep object extend.
	 *
	 * Example:
	 *   extend({}, defaults, options);
	 *
	 * @return {Void}
	 */
	function extend() {
		var args = arguments;
		for (var key in args[1]) {
			if (args[1].hasOwnProperty(key)) {
				switch (type(args[1][key])) {
					case 'object':
						args[0][key] = extend({}, args[0][key], args[1][key]);
						break;

					case 'array':
						args[0][key] = args[1][key].slice(0);
						break;

					default:
						args[0][key] = args[1][key];
				}
			}
		}
		return args.length > 2 ?
			extend.apply(null, [args[0]].concat(Array.prototype.slice.call(args, 2))) :
			args[0];
	}

	/**
	 * Convert HSL color to HEX string.
	 *
	 * @param  {Array} hsl Array with [hue, saturation, lightness].
	 *
	 * @return {Array} Array with [red, green, blue].
	 */
	function hslToHex(h, s, l) {
		var r, g, b;
		var v, min, sv, sextant, fract, vsf;

		if (l <= 0.5) {
			v = l * (1 + s);
		} else {
			v = l + s - l * s;
		}

		if (v === 0) {
			return '#000';
		} else {
			min = 2 * l - v;
			sv = (v - min) / v;
			h = 6 * h;
			sextant = Math.floor(h);
			fract = h - sextant;
			vsf = v * sv * fract;
			if (sextant === 0 || sextant === 6) {
				r = v;
				g = min + vsf;
				b = min;
			} else if (sextant === 1) {
				r = v - vsf;
				g = v;
				b = min;
			} else if (sextant === 2) {
				r = min;
				g = v;
				b = min + vsf;
			} else if (sextant === 3) {
				r = min;
				g = v - vsf;
				b = v;
			} else if (sextant === 4) {
				r = min + vsf;
				g = min;
				b = v;
			} else {
				r = v;
				g = min;
				b = v - vsf;
			}
			return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}
	}

	/**
	 * Helper function for hslToHex.
	 */
	function componentToHex(c) {
		c = Math.round(c * 255).toString(16);
		return c.length === 1 ? '0' + c : c;
	}

	/**
	 * Manage element event listeners.
	 *
	 * @param  {Node}     element
	 * @param  {Event}    eventName
	 * @param  {Function} handler
	 * @param  {Bool}     remove
	 *
	 * @return {Void}
	 */
	function listener(element, eventName, handler, remove) {
		if (element.addEventListener) {
			element[remove ? 'removeEventListener' : 'addEventListener'](eventName, handler, false);
		} else if (element.attachEvent) {
			element[remove ? 'detachEvent' : 'attachEvent']('on' + eventName, handler);
		}
	}

	// Preferred timing funtion
	var getTime;
	(function () {
		var perf = w.performance;
		if (perf && (perf.now || perf.webkitNow)) {
			var perfNow = perf.now ? 'now' : 'webkitNow';
			getTime = perf[perfNow].bind(perf);
		} else {
			getTime = function () {
				return +new Date();
			};
		}
	}());

	// Local WindowAnimationTiming interface polyfill
	var cAF = w.cancelAnimationFrame || w.cancelRequestAnimationFrame;
	var rAF = w.requestAnimationFrame;
	(function () {
		var vendors = ['moz', 'webkit', 'o'];
		var lastTime = 0;

		// For a more accurate WindowAnimationTiming interface implementation, ditch the native
		// requestAnimationFrame when cancelAnimationFrame is not present (older versions of Firefox)
		for (var i = 0, l = vendors.length; i < l && !cAF; ++i) {
			cAF = w[vendors[i]+'CancelAnimationFrame'] || w[vendors[i]+'CancelRequestAnimationFrame'];
			rAF = cAF && w[vendors[i]+'RequestAnimationFrame'];
		}

		if (!cAF) {
			rAF = function (callback) {
				var currTime = getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				lastTime = currTime + timeToCall;
				return w.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
			};

			cAF = function (id) {
				clearTimeout(id);
			};
		}
	}());

	// Property name for assigning element text content
	var textProp = type(document.createElement('div').textContent) === 'string' ? 'textContent' : 'innerText';

	/**
	 * FPSMeter class.
	 *
	 * @param {Element} anchor  Element to append the meter to. Default is document.body.
	 * @param {Object}  options Object with options.
	 */
	function FPSMeter(anchor, options) {
		// Optional arguments
		if (type(anchor) === 'object' && anchor.nodeType === undefined$1) {
			options = anchor;
			anchor = document.body;
		}
		if (!anchor) {
			anchor = document.body;
		}

		// Private properties
		var self = this;
		var o = extend({}, FPSMeter.defaults, options || {});

		var el = {};
		var cols = [];
		var theme, heatmaps;
		var heatDepth = 100;
		var heating = [];

		var thisFrameTime = 0;
		var frameTime = o.threshold;
		var frameStart = 0;
		var lastLoop = getTime() - frameTime;
		var time;

		var fpsHistory = [];
		var durationHistory = [];

		var frameID, renderID;
		var showFps = o.show === 'fps';
		var graphHeight, count, i, j;

		// Exposed properties
		self.options = o;
		self.fps = 0;
		self.duration = 0;
		self.isPaused = 0;

		/**
		 * Tick start for measuring the actual rendering duration.
		 *
		 * @return {Void}
		 */
		self.tickStart = function () {
			frameStart = getTime();
		};

		/**
		 * FPS tick.
		 *
		 * @return {Void}
		 */
		self.tick = function () {
			time = getTime();
			thisFrameTime = time - lastLoop;
			frameTime += (thisFrameTime - frameTime) / o.smoothing;
			self.fps = 1000 / frameTime;
			self.duration = frameStart < lastLoop ? frameTime : time - frameStart;
			lastLoop = time;
		};

		/**
		 * Pause display rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.pause = function () {
			if (frameID) {
				self.isPaused = 1;
				clearTimeout(frameID);
				cAF(frameID);
				cAF(renderID);
				frameID = renderID = 0;
			}
			return self;
		};

		/**
		 * Resume display rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.resume = function () {
			if (!frameID) {
				self.isPaused = 0;
				requestRender();
			}
			return self;
		};

		/**
		 * Update options.
		 *
		 * @param {String} name  Option name.
		 * @param {Mixed}  value New value.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.set = function (name, value) {
			o[name] = value;
			showFps = o.show === 'fps';

			// Rebuild or reposition elements when specific option has been updated
			if (inArray(name, rebuilders) !== -1) {
				createMeter();
			}
			if (inArray(name, repositioners) !== -1) {
				positionMeter();
			}
			return self;
		};

		/**
		 * Change meter into rendering duration mode.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.showDuration = function () {
			self.set('show', 'ms');
			return self;
		};

		/**
		 * Change meter into FPS mode.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.showFps = function () {
			self.set('show', 'fps');
			return self;
		};

		/**
		 * Toggles between show: 'fps' and show: 'duration'.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.toggle = function () {
			self.set('show', showFps ? 'ms' : 'fps');
			return self;
		};

		/**
		 * Hide the FPSMeter. Also pauses the rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.hide = function () {
			self.pause();
			el.container.style.display = 'none';
			return self;
		};

		/**
		 * Show the FPSMeter. Also resumes the rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.show = function () {
			self.resume();
			el.container.style.display = 'block';
			return self;
		};

		/**
		 * Check the current FPS and save it in history.
		 *
		 * @return {Void}
		 */
		function historyTick() {
			for (i = o.history; i--;) {
				fpsHistory[i] = i === 0 ? self.fps : fpsHistory[i-1];
				durationHistory[i] = i === 0 ? self.duration : durationHistory[i-1];
			}
		}

		/**
		 * Returns heat hex color based on values passed.
		 *
		 * @param  {Integer} heatmap
		 * @param  {Integer} value
		 * @param  {Integer} min
		 * @param  {Integer} max
		 *
		 * @return {Integer}
		 */
		function getHeat(heatmap, value, min, max) {
			return heatmaps[0|heatmap][Math.round(Math.min((value - min) / (max - min) * heatDepth, heatDepth))];
		}

		/**
		 * Update counter number and legend.
		 *
		 * @return {Void}
		 */
		function updateCounter() {
			// Update legend only when changed
			if (el.legend.fps !== showFps) {
				el.legend.fps = showFps;
				el.legend[textProp] = showFps ? 'FPS' : 'ms';
			}
			// Update counter with a nicely formated & readable number
			count = showFps ? self.fps : self.duration;
			el.count[textProp] = count > 999 ? '999+' : count.toFixed(count > 99 ? 0 : o.decimals);
		}

		/**
		 * Render current FPS state.
		 *
		 * @return {Void}
		 */
		function render() {
			time = getTime();
			// If renderer stopped reporting, do a simulated drop to 0 fps
			if (lastLoop < time - o.threshold) {
				self.fps -= self.fps / Math.max(1, o.smoothing * 60 / o.interval);
				self.duration = 1000 / self.fps;
			}

			historyTick();
			updateCounter();

			// Apply heat to elements
			if (o.heat) {
				if (heating.length) {
					for (i = heating.length; i--;) {
						heating[i].el.style[theme[heating[i].name].heatOn] = showFps ?
							getHeat(theme[heating[i].name].heatmap, self.fps, 0, o.maxFps) :
							getHeat(theme[heating[i].name].heatmap, self.duration, o.threshold, 0);
					}
				}

				if (el.graph && theme.column.heatOn) {
					for (i = cols.length; i--;) {
						cols[i].style[theme.column.heatOn] = showFps ?
							getHeat(theme.column.heatmap, fpsHistory[i], 0, o.maxFps) :
							getHeat(theme.column.heatmap, durationHistory[i], o.threshold, 0);
					}
				}
			}

			// Update graph columns height
			if (el.graph) {
				for (j = 0; j < o.history; j++) {
					cols[j].style.height = (showFps ?
						(fpsHistory[j] ? Math.round(graphHeight / o.maxFps * Math.min(fpsHistory[j], o.maxFps)) : 0) :
						(durationHistory[j] ? Math.round(graphHeight / o.threshold * Math.min(durationHistory[j], o.threshold)) : 0)
					) + 'px';
				}
			}
		}

		/**
		 * Request rendering loop.
		 *
		 * @return {Int} Animation frame index.
		 */
		function requestRender() {
			if (o.interval < 20) {
				frameID = rAF(requestRender);
				render();
			} else {
				frameID = setTimeout(requestRender, o.interval);
				renderID = rAF(render);
			}
		}

		/**
		 * Meter events handler.
		 *
		 * @return {Void}
		 */
		function eventHandler(event) {
			event = event || window.event;
			if (event.preventDefault) {
				event.preventDefault();
				event.stopPropagation();
			} else {
				event.returnValue = false;
				event.cancelBubble = true;
			}
			self.toggle();
		}

		/**
		 * Destroys the current FPSMeter instance.
		 *
		 * @return {Void}
		 */
		self.destroy = function () {
			// Stop rendering
			self.pause();
			// Remove elements
			removeMeter();
			// Stop listening
			self.tick = self.tickStart = function () {};
		};

		/**
		 * Remove meter element.
		 *
		 * @return {Void}
		 */
		function removeMeter() {
			// Unbind listeners
			if (o.toggleOn) {
				listener(el.container, o.toggleOn, eventHandler, 1);
			}
			// Detach element
			anchor.removeChild(el.container);
		}

		/**
		 * Sets the theme, and generates heatmaps when needed.
		 */
		function setTheme() {
			theme = FPSMeter.theme[o.theme];

			// Generate heatmaps
			heatmaps = theme.compiledHeatmaps || [];
			if (!heatmaps.length && theme.heatmaps.length) {
				for (j = 0; j < theme.heatmaps.length; j++) {
					heatmaps[j] = [];
					for (i = 0; i <= heatDepth; i++) {
						heatmaps[j][i] = hslToHex(0.33 / heatDepth * i, theme.heatmaps[j].saturation, theme.heatmaps[j].lightness);
					}
				}
				theme.compiledHeatmaps = heatmaps;
			}
		}

		/**
		 * Creates and attaches the meter element.
		 *
		 * @return {Void}
		 */
		function createMeter() {
			// Remove old meter if present
			if (el.container) {
				removeMeter();
			}

			// Set theme
			setTheme();

			// Create elements
			el.container = applyTheme(newEl('div'), theme.container);
			el.count = el.container.appendChild(applyTheme(newEl('div'), theme.count));
			el.legend = el.container.appendChild(applyTheme(newEl('div'), theme.legend));
			el.graph = o.graph ? el.container.appendChild(applyTheme(newEl('div'), theme.graph)) : 0;

			// Add elements to heating array
			heating.length = 0;
			for (var key in el) {
				if (el[key] && theme[key].heatOn) {
					heating.push({
						name: key,
						el: el[key]
					});
				}
			}

			// Graph
			cols.length = 0;
			if (el.graph) {
				// Create graph
				el.graph.style.width = (o.history * theme.column.width + (o.history - 1) * theme.column.spacing) + 'px';

				// Add columns
				for (i = 0; i < o.history; i++) {
					cols[i] = el.graph.appendChild(applyTheme(newEl('div'), theme.column));
					cols[i].style.position = 'absolute';
					cols[i].style.bottom = 0;
					cols[i].style.right = (i * theme.column.width + i * theme.column.spacing) + 'px';
					cols[i].style.width = theme.column.width + 'px';
					cols[i].style.height = '0px';
				}
			}

			// Set the initial state
			positionMeter();
			updateCounter();

			// Append container to anchor
			anchor.appendChild(el.container);

			// Retrieve graph height after it was appended to DOM
			if (el.graph) {
				graphHeight = el.graph.clientHeight;
			}

			// Add event listeners
			if (o.toggleOn) {
				if (o.toggleOn === 'click') {
					el.container.style.cursor = 'pointer';
				}
				listener(el.container, o.toggleOn, eventHandler);
			}
		}

		/**
		 * Positions the meter based on options.
		 *
		 * @return {Void}
		 */
		function positionMeter() {
			applyTheme(el.container, o);
		}

		/**
		 * Construct.
		 */
		(function () {
			// Create meter element
			createMeter();
			// Start rendering
			requestRender();
		}());
	}

	// Expose the extend function
	FPSMeter.extend = extend;

	// Expose the FPSMeter class
	window.FPSMeter = FPSMeter;

	// Default options
	FPSMeter.defaults = {
		interval:  100,     // Update interval in milliseconds.
		smoothing: 10,      // Spike smoothing strength. 1 means no smoothing.
		show:      'fps',   // Whether to show 'fps', or 'ms' = frame duration in milliseconds.
		toggleOn:  'click', // Toggle between show 'fps' and 'ms' on this event.
		decimals:  1,       // Number of decimals in FPS number. 1 = 59.9, 2 = 59.94, ...
		maxFps:    60,      // Max expected FPS value.
		threshold: 100,     // Minimal tick reporting interval in milliseconds.

		// Meter position
		position: 'absolute', // Meter position.
		zIndex:   10,         // Meter Z index.
		left:     '5px',      // Meter left offset.
		top:      '5px',      // Meter top offset.
		right:    'auto',     // Meter right offset.
		bottom:   'auto',     // Meter bottom offset.
		margin:   '0 0 0 0',  // Meter margin. Helps with centering the counter when left: 50%;

		// Theme
		theme: 'dark', // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
		heat:  0,      // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

		// Graph
		graph:   0, // Whether to show history graph.
		history: 20 // How many history states to show in a graph.
	};

	// Option names that trigger FPSMeter rebuild or reposition when modified
	var rebuilders = [
		'toggleOn',
		'theme',
		'heat',
		'graph',
		'history'
	];
	var repositioners = [
		'position',
		'zIndex',
		'left',
		'top',
		'right',
		'bottom',
		'margin'
	];
}(window));
(function (w, FPSMeter, undefined$1) {

	// Themes object
	FPSMeter.theme = {};

	// Base theme with layout, no colors
	var base = FPSMeter.theme.base = {
		heatmaps: [],
		container: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			padding: '5px',
			minWidth: '95px',
			height: '30px',
			lineHeight: '30px',
			textAlign: 'right',
			textShadow: 'none'
		},
		count: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'absolute',
			top: 0,
			right: 0,
			padding: '5px 10px',
			height: '30px',
			fontSize: '24px',
			fontFamily: 'Consolas, Andale Mono, monospace',
			zIndex: 2
		},
		legend: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'absolute',
			top: 0,
			left: 0,
			padding: '5px 10px',
			height: '30px',
			fontSize: '12px',
			lineHeight: '32px',
			fontFamily: 'sans-serif',
			textAlign: 'left',
			zIndex: 2
		},
		graph: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'relative',
			boxSizing: 'padding-box',
			MozBoxSizing: 'padding-box',
			height: '100%',
			zIndex: 1
		},
		column: {
			// Settings
			width: 4,
			spacing: 1,
			heatOn: null,
			heatmap: null
		}
	};

	// Dark theme
	FPSMeter.theme.dark = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.8,
			lightness: 0.8
		}],
		container: {
			background: '#222',
			color: '#fff',
			border: '1px solid #1a1a1a',
			textShadow: '1px 1px 0 #222'
		},
		count: {
			heatOn: 'color'
		},
		column: {
			background: '#3f3f3f'
		}
	});

	// Light theme
	FPSMeter.theme.light = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.5,
			lightness: 0.5
		}],
		container: {
			color: '#666',
			background: '#fff',
			textShadow: '1px 1px 0 rgba(255,255,255,.5), -1px -1px 0 rgba(255,255,255,.5)',
			boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
		},
		count: {
			heatOn: 'color'
		},
		column: {
			background: '#eaeaea'
		}
	});

	// Colorful theme
	FPSMeter.theme.colorful = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.5,
			lightness: 0.6
		}],
		container: {
			heatOn: 'backgroundColor',
			background: '#888',
			color: '#fff',
			textShadow: '1px 1px 0 rgba(0,0,0,.2)',
			boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
		},
		column: {
			background: '#777',
			backgroundColor: 'rgba(0,0,0,.2)'
		}
	});

	// Transparent theme
	FPSMeter.theme.transparent = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.8,
			lightness: 0.5
		}],
		container: {
			padding: 0,
			color: '#fff',
			textShadow: '1px 1px 0 rgba(0,0,0,.5)'
		},
		count: {
			padding: '0 5px',
			height: '40px',
			lineHeight: '40px'
		},
		legend: {
			padding: '0 5px',
			height: '40px',
			lineHeight: '42px'
		},
		graph: {
			height: '40px'
		},
		column: {
			width: 5,
			background: '#999',
			heatOn: 'backgroundColor',
			opacity: 0.5
		}
	});
}(window, FPSMeter));

function precisionFixed(step) {
  return Math.max(0, -exponent$1(Math.abs(step)));
}

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3 - exponent$1(Math.abs(step)));
}

function identity$1(x) {
  return x;
}

var top = 1,
    right = 2,
    bottom = 3,
    left = 4,
    epsilon = 1e-6;

function translateX(x) {
  return "translate(" + x + ",0)";
}

function translateY(y) {
  return "translate(0," + y + ")";
}

function number$2(scale) {
  return d => +scale(d);
}

function center(scale, offset) {
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
  if (scale.round()) offset = Math.round(offset);
  return d => +scale(d) + offset;
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3,
      offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
      k = orient === top || orient === left ? -1 : 1,
      x = orient === left || orient === right ? "x" : "y",
      transform = orient === top || orient === bottom ? translateX : translateY;

  function axis(context) {
    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$1) : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        range = scale.range(),
        range0 = +range[0] + offset,
        range1 = +range[range.length - 1] + offset,
        position = (scale.bandwidth ? center : number$2)(scale.copy(), offset),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text");

    path = path.merge(path.enter().insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "currentColor"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line")
        .attr("stroke", "currentColor")
        .attr(x + "2", k * tickSizeInner));

    text = text.merge(tickEnter.append("text")
        .attr("fill", "currentColor")
        .attr(x, k * spacing)
        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context)
          .attr("opacity", epsilon)
          .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform"); });

      tickEnter
          .attr("opacity", epsilon)
          .attr("transform", function(d) { var p = this.parentNode.__axis; return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset); });
    }

    tickExit.remove();

    path
        .attr("d", orient === left || orient === right
            ? (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1)
            : (tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1));

    tick
        .attr("opacity", 1)
        .attr("transform", function(d) { return transform(position(d) + offset); });

    line
        .attr(x + "2", k * tickSizeInner);

    text
        .attr(x, k * spacing)
        .text(format);

    selection.filter(entering)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

    selection
        .each(function() { this.__axis = position; });
  }

  axis.scale = function(_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function() {
    return tickArguments = Array.from(arguments), axis;
  };

  axis.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function(_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  axis.offset = function(_) {
    return arguments.length ? (offset = +_, axis) : offset;
  };

  return axis;
}

function axisTop(scale) {
  return axis(top, scale);
}

function axisRight(scale) {
  return axis(right, scale);
}

function axisBottom(scale) {
  return axis(bottom, scale);
}

function axisLeft(scale) {
  return axis(left, scale);
}

function ascending$1(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(f) {
  let delta = f;
  let compare1 = f;
  let compare2 = f;

  if (f.length !== 2) {
    delta = (d, x) => f(d) - x;
    compare1 = ascending$1;
    compare2 = (d, x) => ascending$1(f(d), x);
  }

  function left(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function right(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function center(a, x, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }

  return {left, center, right};
}

function number$1(x) {
  return x === null ? NaN : +x;
}

const ascendingBisect = bisector(ascending$1);
const bisectRight = ascendingBisect.right;
bisector(number$1).center;
var bisect = bisectRight;

var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

function ticks(start, stop, count) {
  var reverse,
      i = -1,
      n,
      ticks,
      step;

  stop = +stop, start = +start, count = +count;
  if (start === stop && count > 0) return [start];
  if (reverse = stop < start) n = start, start = stop, stop = n;
  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

  if (step > 0) {
    let r0 = Math.round(start / step), r1 = Math.round(stop / step);
    if (r0 * step < start) ++r0;
    if (r1 * step > stop) --r1;
    ticks = new Array(n = r1 - r0 + 1);
    while (++i < n) ticks[i] = (r0 + i) * step;
  } else {
    step = -step;
    let r0 = Math.round(start * step), r1 = Math.round(stop * step);
    if (r0 / step < start) ++r0;
    if (r1 / step > stop) --r1;
    ticks = new Array(n = r1 - r0 + 1);
    while (++i < n) ticks[i] = (r0 + i) / step;
  }

  if (reverse) ticks.reverse();

  return ticks;
}

function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log(step) / Math.LN10),
      error = step / Math.pow(10, power);
  return power >= 0
      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

function initRange(domain, range) {
  switch (arguments.length) {
    case 0: break;
    case 1: this.range(domain); break;
    default: this.range(range).domain(domain); break;
  }
  return this;
}

function numberArray(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}

function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function genericArray(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date(a, b) {
  var d = new Date;
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

function object(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function string(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolate(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$3(b)
      : (t === "number" ? interpolateNumber
      : t === "string" ? ((c = color$1(b)) ? (b = c, rgb$2) : string)
      : b instanceof color$1 ? rgb$2
      : b instanceof Date ? date
      : isNumberArray(b) ? numberArray
      : Array.isArray(b) ? genericArray
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
      : interpolateNumber)(a, b);
}

function interpolateRound(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

function constants(x) {
  return function() {
    return x;
  };
}

function number(x) {
  return +x;
}

var unit = [0, 1];

function identity(x) {
  return x;
}

function normalize(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constants(isNaN(b) ? NaN : 0.5);
}

function clamper(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function(x) { return Math.max(a, Math.min(b, x)); };
}

// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisect(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp())
      .unknown(source.unknown());
}

function transformer() {
  var domain = unit,
      range = unit,
      interpolate$1 = interpolate,
      transform,
      untransform,
      unknown,
      clamp = identity,
      piecewise,
      output,
      input;

  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate$1)))(transform(clamp(x)));
  }

  scale.invert = function(y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate$1 = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}

function continuous() {
  return transformer()(identity, identity);
}

function tickFormat(start, stop, count, specifier) {
  var step = tickStep(start, stop, count),
      precision;
  specifier = formatSpecifier$1(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix$1(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound$1(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format$1(specifier);
}

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) count = 10;

    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    
    while (maxIter-- > 0) {
      step = tickIncrement(start, stop, count);
      if (step === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous();

  scale.copy = function() {
    return copy(scale, linear());
  };

  initRange.apply(scale, arguments);

  return linearish(scale);
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection_selection() {
  return this;
}

Selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
}

class SVGInteractor {
  /**
   * A class used to illustrate state of the visualization on the main thread such as
   * selection or axis.
   *
   * @param {SVGElement} svg container for all svg elements
   */
  constructor(
    svg,
    labelClickHandler,
    labelMouseOverHandler,
    labelMouseOutHandler
  ) {
    this.labelClickHandler = labelClickHandler;
    this.labelMouseOverHandler = labelMouseOverHandler;
    this.labelMouseOutHandler = labelMouseOutHandler;
    this.svg = svg;
    this.d3SVG = select(this.svg);
    this.svg.style.width = "100%";
    this.svg.style.height = "100%";
    this.svg.style.position = "absolute";
    this.svg.style.zIndex = "1000";
    this.svg.style.pointerEvents = "none";
    this.svg.style.overflow = "visible";

    this._selectMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    this._selectMarker.setAttribute("fill", "rgba(124, 124, 247, 0.3)");
    this._selectMarker.setAttribute("stroke", "rgb(136, 128, 247)");
    this._selectMarker.setAttribute("stroke-width", 1);
    this._selectMarker.setAttribute("stroke-dasharray", "5,5");

    this._labelMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
  }

  /**
   * Set the specification for this class to refer to.
   *
   * @param {Object} specification
   */
  setSpecification(specification) {
    this.specification = specification;

    const styles = getDimAndMarginStyleForSpecification(specification);
    this.svg.style.width = styles.width;
    this.svg.style.height = styles.height;
    this.svg.style.margin = styles.margin;
    this.svg.style.cursor = "default"; // or "none"

    this.initialX = undefined; // used for updating labels
    this.initialY = undefined;
    select(this._labelMarker).selectAll("*").remove();
    for (const _ of this.specification.labels || []) {
      select(this._labelMarker).append("text");
    }
  }

  /**
   * Add svg elements to the DOM
   */
  init() {
    this.svg.appendChild(this._selectMarker);
    this.svg.appendChild(this._labelMarker);
    this.xAxisAnchor = this.d3SVG.append("g");
    this.yAxisAnchor = this.d3SVG.append("g");
  }

  /**
   * Update the svg using the new viewport information
   * @param {Array} currentXRange of mousereader
   * @param {Array} currentYRange of mousereader
   * @param {Number} width of mousereader
   * @param {Number} height of mousereader
   */
  updateView(currentXRange, currentYRange, width, height) {
    this.currentXRange = currentXRange;
    this.currentYRange = currentYRange;
    this.width = width;
    this.height = height;

    if (this.currentXRange) {
      this.xAxis = this._calculateAxis(
        "x",
        this.specification.xAxis,
        this.specification,
        getScaleForSpecification("x", this.specification),
        this.xAxisAnchor
      );

      if (this.specification.labels) {
        this.updateLabels();
      }
    }

    if (this.xAxis) {
      this.xAxisAnchor.call(this.xAxis);
    }

    if (this.currentYRange) {
      this.yAxis = this._calculateAxis(
        "y",
        this.specification.yAxis,
        this.specification,
        getScaleForSpecification("y", this.specification),
        this.yAxisAnchor
      );
    }

    if (this.yAxis) {
      this.yAxisAnchor.call(this.yAxis);
    }
  }

  updateLabels() {
    if (!this.initialX && this.specification.labels) {
      this.initialX = this.specification.labels.map(
        (label) => this._calculateViewportSpotInverse(label.x, label.y)[0]
      );
    }
    if (!this.initialY && this.specification.labels) {
      this.initialY = this.specification.labels.map(
        (label) => this._calculateViewportSpotInverse(label.x, label.y)[1]
      );
    }

    const labels = select(this._labelMarker)
      .selectAll("text")
      .data(this.specification.labels);
    labels
      .enter()
      .append("text")
      .merge(labels) // Updates both existing and new nodes
      .text((d) => d.text)
      .attr("style", "pointer-events: bounding-box") // Add this line to make the labels respond to pointer events
      .style("user-select", "none") // add this line
      .on("click", (event, d) => {
        const clickedIndex = select(this._labelMarker)
          .selectAll("text")
          .nodes()
          .indexOf(event.currentTarget);

        this.labelClickHandler({
          label: d.text,
          index: clickedIndex,
          labelObject: d,
          event,
        });
      })
      .on("mouseover", (event, d) => {
        const hoveredIndex = select(this._labelMarker)
          .selectAll("text")
          .nodes()
          .indexOf(event.currentTarget);

        this.labelMouseOverHandler({
          label: d.text,
          index: hoveredIndex,
          labelObject: d,
          event,
        });
      })
      .on("mouseout", (event, d) => {
        const hoveredIndex = select(this._labelMarker)
          .selectAll("text")
          .nodes()
          .indexOf(event.currentTarget);

        this.labelMouseOutHandler({
          label: d.text,
          index: hoveredIndex,
          labelObject: d,
          event,
        });
      })
      .attr("x", (d, i, nodes) => {
        const svgNode = this.d3SVG.node();
        const rect = svgNode.getBoundingClientRect();
        const width = rect.width;

        if (d.fixedX) {
          return this.initialX[i];
        }

        const xPos = this._calculateViewportSpotInverse(d.x, d.y)[0];

        if (xPos < 0 || xPos > width) {
          select(nodes[i]).remove();
        } else {
          return xPos;
        }
      })
      .attr("y", (d, i, nodes) => {
        const svgNode = this.d3SVG.node();
        const rect = svgNode.getBoundingClientRect();
        const height = rect.height;

        if (d.fixedY) {
          return this.initialY[i];
        }

        const yPos = this._calculateViewportSpotInverse(d.x, d.y)[1];

        if (yPos < 0 || yPos > height) {
          select(nodes[i]).remove();
        } else {
          return yPos;
        }
      })
      .each((d, i, nodes) => {
        const xPos = d.fixedX
          ? this.initialX[i]
          : this._calculateViewportSpotInverse(d.x, d.y)[0];
        const yPos = d.fixedY
          ? this.initialY[i]
          : this._calculateViewportSpotInverse(d.x, d.y)[1];

        // Check if the 'transformRotate' property exists
        if (d.transformRotate) {
          select(nodes[i]).attr(
            "transform",
            `rotate(${d.transformRotate}, ${xPos}, ${yPos})`
          );
        }
      })
      .each(function (d) {
        // Set any possible svg properties specified in label
        for (const property in d) {
          if (
            ["x", "y", "text", "transformRotate", "type", "index"].includes(
              property
            )
          ) {
            continue;
          }
          select(this).attr(property, d[property]);
        }
      });

    // Remove any old labels
    labels.exit().remove();
  }

  _calculateAxis(dimension, orientation, specification, genomeScale, anchor) {
    let axis, domain, range;
    if (dimension === "x") {
      domain = this.currentXRange;
      range = [0, this.width];
      switch (orientation) {
        case "none":
          anchor.attr("transform", `translate(-1000000, -1000000)`);
          return null;
        case "top":
          axis = axisTop();
          anchor.attr("transform", `translate(0, 0)`);
          break;
        case "center":
          axis = axisBottom();
          anchor.attr("transform", `translate(0, ${this.height / 2})`);
          break;
        case "zero":
          const yScale = linear()
            .domain(this.currentYRange)
            .range([this.height, 0]);

          axis = axisBottom();
          anchor.attr("transform", `translate(0, ${yScale(0)})`);
          break;
        case "bottom":
        default:
          axis = axisBottom();
          anchor.attr("transform", `translate(0, ${this.height})`);
          break;
      }
    }

    if (dimension === "y") {
      domain = this.currentYRange;
      range = [this.height, 0];
      switch (orientation) {
        case "none":
          anchor.attr("transform", `translate(-1000000, -1000000)`);
          return null;
        case "center":
          axis = axisRight();
          anchor.attr("transform", `translate(${this.width / 2}, 0)`);
          break;
        case "right":
          axis = axisRight();
          anchor.attr("transform", `translate(${this.width}, 0)`);
          break;
        case "zero":
          const xScale = linear()
            .domain(this.currentXRange)
            .range([0, this.width]);

          axis = axisLeft();
          anchor.attr("transform", `translate(${xScale(0)}, 0)`);
          break;
        case "left": // left is default behavior
        default:
          axis = axisLeft();
          anchor.attr("transform", `translate(0, 0)`);
          break;
      }
    }

    let genomic = false;
    for (const track of specification.tracks) {
      if (track[dimension].type && track[dimension].type.includes("genomic")) {
        genomic = true;
      }
    }

    if (!genomic) {
      return axis.scale(linear().domain(domain).range(range));
    }

    let tickInfo;
    if (dimension === "x") {
      tickInfo = genomeScale.getTickCoordsAndLabels(domain[0], domain[1]);
    } else {
      tickInfo = genomeScale.getTickCoordsAndLabels(range[0], range[1]);
    }

    return axis
      .scale(linear().domain(domain).range(range))
      .tickValues(tickInfo.tickCoords)
      .tickFormat((_, index) => tickInfo.tickLabels[index]);
  }

  /**
   * Updates user selection view if they have selected a box
   */
  _updateBoxSelectView(points) {
    if (points.length !== 4) {
      return;
    }

    const topLeftCorner = this._calculateViewportSpotInverse(
      points[0],
      points[1]
    );

    const bottomRightCorner = this._calculateViewportSpotInverse(
      points[2],
      points[3]
    );

    let pointAttr = `${topLeftCorner[0]},${topLeftCorner[1]} 
                     ${topLeftCorner[0]},${bottomRightCorner[1]}, 
                     ${bottomRightCorner[0]},${bottomRightCorner[1]}
                     ${bottomRightCorner[0]},${topLeftCorner[1]}
                     `;

    this._selectMarker.setAttribute("points", pointAttr);
  }

  /**
   * Update the selection box/lasso with the points as bounds
   *
   * @param {Array} points 1D array of coordinates that are used for selection ex. [x1,y1,x2,y2,...]
   */
  updateSelectView(points) {
    if (points.length === 4) {
      this._updateBoxSelectView(points);
      return;
    }
    if (points.length < 6) {
      this._selectMarker.setAttribute("points", "");
      return;
    }

    let pointAttr = "";
    for (let i = 0; i < points.length; i += 2) {
      const asCanvasPoint = this._calculateViewportSpotInverse(
        points[i],
        points[i + 1]
      );
      pointAttr += `${asCanvasPoint[0]}, ${asCanvasPoint[1]} `;
    }

    this._selectMarker.setAttribute("points", pointAttr);
  }

  /**
   * Calculate the location on the canvas a real coordniate corresponds to.
   *
   * @param {Float} viewportX x coordinate of data space
   * @param {Float} viewportY y coordniate of data space
   * @returns canvas coordindate as array
   */
  _calculateViewportSpotInverse(viewportX, viewportY) {
    const inverseScaleX = scale(this.currentXRange, [0, this.width]);
    // Flipped for Y since canvas using typical graphics coordinates but GPU clipspace is typical cartesian coordinates
    const inverseScaleY = scale(this.currentYRange, [this.height, 0]);

    return [inverseScaleX(viewportX), inverseScaleY(viewportY)];
  }

  /**
   * Clears the polygon selection on the visualization
   */
  clear() {
    this._selectMarker.setAttribute("points", "");
  }
}

/**
 * event.layerX and event.layerY are deprecated. We will use them if they are on the event, but
 * if not we will use a manual calculation.
 *
 * @param {Event} event
 * @returns layerX and layerY, coordinates of event with origin at top right corner of bounding box
 */
const getLayerXandYFromEvent = (event) => {
  if (event.layerX !== undefined && event.layerY !== undefined) {
    return [event.layerX, event.layerY];
  }
  const bbox = event.target.getBoundingClientRect();
  const x = event.clientX - bbox.left;
  const y = event.clientY - bbox.top;
  return [x, y];
};

class MouseReader {
  /**
   *
   * @param {HTMLElement} element meant to read mouse events, necessary since OffscreenCanvas cannot read DOM events
   * @param {WebGLVis} handler WebGLVis that is using this mousereader
   */
  constructor(element, handler) {
    this.element = element;
    this.element.style.position = "absolute";
    this.element.style.width = "100%";
    this.element.style.height = "100%";

    this.handler = handler;

    this._currentSelectionPoints = [];

    this.tool = "pan";

    // Initializing elements to show user their current selection
    this.SVGInteractor = new SVGInteractor(
      document.createElementNS("http://www.w3.org/2000/svg", "svg"),
      handler.dispatchEvent.bind(handler, "labelClicked"),
      handler.dispatchEvent.bind(handler, "labelHovered"),
      handler.dispatchEvent.bind(handler, "labelUnhovered")
    );
  }

  /**
   * Set the specification of the mouse reader and the svg interaction
   * @param {Object} specification
   */
  setSpecification(specification) {
    const styles = getDimAndMarginStyleForSpecification(specification);
    this.element.style.width = styles.width;
    this.element.style.height = styles.height;
    this.element.style.margin = styles.margin;

    this.viewport = getViewportForSpecification(specification);
    this.SVGInteractor.setSpecification(specification);
    this._updateSVG();
  }

  /**
   * Set the viewport in the format mouseReader.viewport = [minX, maxX, minY, maxY].
   * Mostly used to make WebGLVis.setViewOptions simpler.
   */
  set viewport(toSet) {
    this.minX = toSet[0];
    this.maxX = toSet[1];
    this.minY = toSet[2];
    this.maxY = toSet[3];

    this.currentXRange = [this.minX, this.maxX];
    this.currentYRange = [this.minY, this.maxY];
  }

  /**
   * Init the mouse reader by adding its elements to DOM and adding event handlers
   */
  init() {
    this.width = this.element.clientWidth;
    this.height = this.element.clientHeight;

    this.element.parentElement.appendChild(this.SVGInteractor.svg);
    this.SVGInteractor.init();
    this._updateSVG();

    this.element.addEventListener("wheel", this._onWheel.bind(this), false);

    let mouseDown = false;
    this.element.addEventListener(
      "mousedown",
      (event) => {
        mouseDown = true;
        switch (this.tool) {
          case "pan":
            break;
          case "box":
          case "lasso":
            this._currentSelectionPoints = [
              ...this._calculateViewportSpot(...getLayerXandYFromEvent(event)),
            ];
            break;
        }
      },
      false
    );

    this.element.addEventListener(
      "mousemove",
      (event) => {
        this.handler.getClosestPoint(
          this._calculateViewportSpot(...getLayerXandYFromEvent(event))
        );
        if (!mouseDown) {
          return;
        }
        switch (this.tool) {
          case "pan":
            this._onPan(event);
            break;
          case "box":
            this._currentSelectionPoints = this._currentSelectionPoints
              .slice(0, 2)
              .concat(
                this._calculateViewportSpot(...getLayerXandYFromEvent(event))
              );
            this.element.parentElement.dispatchEvent(
              new CustomEvent("onSelection", {
                detail: {
                  bounds: this._currentSelectionPoints,
                  type: this.tool,
                },
              })
            );
            break;
          case "lasso":
            this._currentSelectionPoints.push(
              ...this._calculateViewportSpot(...getLayerXandYFromEvent(event))
            );
            this.element.parentElement.dispatchEvent(
              new CustomEvent("onSelection", {
                detail: {
                  bounds: this._currentSelectionPoints,
                  type: this.tool,
                },
              })
            );
            break;
        }
        this._updateSVG();
      },
      false
    );

    this.element.addEventListener("mouseup", (event) => {
      mouseDown = false;
      switch (this.tool) {
        case "pan":
          break;
        case "box":
          if (this._currentSelectionPoints.length !== 4) {
            this._currentSelectionPoints = [];
            return;
          }
          this._onSelect();
          break;
        case "lasso":
          if (this._currentSelectionPoints.length < 6) {
            this._currentSelectionPoints = [];
            this._updateSVG();
            return;
          }
          this._onSelect();
          break;
      }
    });

    this.element.addEventListener("mouseleave", () => {
      switch (this.tool) {
        case "pan": // Ensures panning does not continue if user leaves canvas
          mouseDown = false;
          break;
      }
    });

    this.element.addEventListener(
      "dblclick",
      (event) => {
        this.handler.getClickPoint(
          this._calculateViewportSpot(...getLayerXandYFromEvent(event))
        );
      },
      false
    );
  }

  /**
   * Get current viewport info such as min/max bounds and current ranges
   *
   * @returns Current viewport information the mouse reader has calculated
   */
  getViewport() {
    return {
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
      xRange: this.currentXRange,
      yRange: this.currentYRange,
    };
  }

  /**
   * Method to handle wheel events for zooming in and out of canvas
   *
   * @param {WheelEvent} event
   */
  _onWheel(event) {
    event.preventDefault();
    if (!this.lockedX) {
      const previousX = [...this.currentXRange]; // ... to avoid aliasing
      const t = -event.wheelDelta / 1000;
      const inDataSpace = this._calculateViewportSpot(
        ...getLayerXandYFromEvent(event)
      );
      this.currentXRange[0] =
        t * inDataSpace[0] + (1 - t) * this.currentXRange[0];

      this.currentXRange[1] =
        t * inDataSpace[0] + (1 - t) * this.currentXRange[1];

      this.currentXRange[0] = Math.max(this.currentXRange[0], this.minX);
      this.currentXRange[1] = Math.min(this.currentXRange[1], this.maxX);

      if (!this._validateXRange()) {
        // Zoom in limit
        this.currentXRange = previousX;
      }
    }

    if (!this.lockedY) {
      const previousY = [...this.currentYRange];
      const t = -event.wheelDelta / 1000;
      const inDataSpace = this._calculateViewportSpot(
        ...getLayerXandYFromEvent(event)
      );

      this.currentYRange[0] =
        t * inDataSpace[1] + (1 - t) * this.currentYRange[0];
      this.currentYRange[1] =
        t * inDataSpace[1] + (1 - t) * this.currentYRange[1];
      this.currentYRange[0] = Math.max(this.currentYRange[0], this.minY);
      this.currentYRange[1] = Math.min(this.currentYRange[1], this.maxY);

      if (!this._validateYRange()) {
        // Zoom in limit
        this.currentYRange = previousY;
      }
    }

    this.element.parentElement.dispatchEvent(
      new CustomEvent(event.wheelDelta < 0 ? "zoomIn" : "zoomOut", {
        detail: {
          viewport: this.getViewport(),
          type: this.tool,
        },
      })
    );

    this.handler.sendDrawerState(this.getViewport());
    this._updateSVG();
  }

  /**
   * Method to handle a clicked mouse moving around canvas to pan around canvas.
   *
   * @param {MouseEvent} event from "mousemove" event
   */
  _onPan(event) {
    if (!this.lockedX) {
      const previousX = [...this.currentXRange]; // ... to avoid aliasing
      const xDampen = (this.currentXRange[1] - this.currentXRange[0]) / 1000;
      this.currentXRange[0] -= event.movementX * xDampen;
      this.currentXRange[1] -= event.movementX * xDampen;
      // this.currentXRange[0] = Math.max(this.currentXRange[0], this.minX);
      // this.currentXRange[1] = Math.min(this.currentXRange[1], this.maxX);

      if (!this._validateXRange()) {
        this.currentXRange = previousX;
      }
    }

    if (!this.lockedY) {
      const previousY = [...this.currentYRange];
      const yDampen = (this.currentYRange[1] - this.currentYRange[0]) / 1000;
      this.currentYRange[0] += event.movementY * yDampen;
      this.currentYRange[1] += event.movementY * yDampen;
      // this.currentYRange[0] = Math.max(this.currentYRange[0], this.minY);
      // this.currentYRange[1] = Math.min(this.currentYRange[1], this.maxY);

      if (!this._validateYRange()) {
        this.currentYRange = previousY;
      }
    }

    this.element.parentElement.dispatchEvent(
      new CustomEvent("pan", {
        detail: {
          viewport: this.getViewport(),
          type: this.tool,
        },
      })
    );

    this.handler.sendDrawerState(this.getViewport());
    this._updateSVG();
  }

  /**
   * Checks if this.currentXRange is valid with first element less than second
   * and if viewport zoom is not above webgl max zoom.
   *
   * @return true if range is valid, false otherwise
   */
  _validateXRange() {
    return this.currentXRange[1] >= this.currentXRange[0];
  }

  /**
   * Checks if this.currentYRange is valid with first element less than second
   * and if viewport zoom is not above webgl max zoom.
   *
   * @return true if range is valid, false otherwise
   */
  _validateYRange() {
    return this.currentYRange[1] >= this.currentYRange[0];
  }

  /**
   * Updates the DOM component used to show user selection or axis.
   * Calls methods from SVGInteractor.
   */
  _updateSVG() {
    this.SVGInteractor.updateView(
      this.currentXRange,
      this.currentYRange,
      this.width,
      this.height
    );
    this.SVGInteractor.updateSelectView(this._currentSelectionPoints);
  }

  /**
   * Executes when user has confirmed selection points (typically by releasing mouse)
   */
  _onSelect() {
    this.handler.selectPoints(this._currentSelectionPoints);
  }

  /**
   * Calculate the location on the real coordinate space a point on the canvas corresponds to.
   *
   * @param {Float} canvasX likely from event.layerX or getLayerXandYFromEvent
   * @param {Float} canvasY likely from event.layerY or getLayerXandYFromEvent
   * @returns viewport coordinate as array
   */
  _calculateViewportSpot(canvasX, canvasY) {
    const scaleX = scale([0, this.width], this.currentXRange);
    // Flipped for Y since canvas using typical graphics coordinates but GPU clipspace is typical cartesian coordinates
    const scaleY = scale([this.height, 0], this.currentYRange);
    return [scaleX(canvasX), scaleY(canvasY)];
  }

  /**
   * Clears the polygon selection on the visualization
   */
  clear() {
    this._currentSelectionPoints = [];
    this.SVGInteractor.clear();
  }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var url = {};

var punycode$1 = {exports: {}};

/*! https://mths.be/punycode v1.3.2 by @mathias */

(function (module, exports) {
(function(root) {

	/** Detect free variables */
	var freeExports = exports &&
		!exports.nodeType && exports;
	var freeModule = module &&
		!module.nodeType && module;
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(commonjsGlobal));
}(punycode$1, punycode$1.exports));

var util$1 = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

var querystring$1 = {};

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var decode = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

var encode = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).map(function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (Array.isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

querystring$1.decode = querystring$1.parse = decode;
querystring$1.encode = querystring$1.stringify = encode;

var punycode = punycode$1.exports;
var util = util$1;

url.parse = urlParse;
url.resolve = urlResolve;
url.resolveObject = urlResolveObject;
url.format = urlFormat;

url.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = querystring$1;

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

var helpers$3 = {};

var uri = url;

var ValidationError = helpers$3.ValidationError = function ValidationError (message, instance, schema, path, name, argument) {
  if(Array.isArray(path)){
    this.path = path;
    this.property = path.reduce(function(sum, item){
      return sum + makeSuffix(item);
    }, 'instance');
  }else if(path !== undefined){
    this.property = path;
  }
  if (message) {
    this.message = message;
  }
  if (schema) {
    var id = schema.$id || schema.id;
    this.schema = id || schema;
  }
  if (instance !== undefined) {
    this.instance = instance;
  }
  this.name = name;
  this.argument = argument;
  this.stack = this.toString();
};

ValidationError.prototype.toString = function toString() {
  return this.property + ' ' + this.message;
};

var ValidatorResult$2 = helpers$3.ValidatorResult = function ValidatorResult(instance, schema, options, ctx) {
  this.instance = instance;
  this.schema = schema;
  this.options = options;
  this.path = ctx.path;
  this.propertyPath = ctx.propertyPath;
  this.errors = [];
  this.throwError = options && options.throwError;
  this.throwFirst = options && options.throwFirst;
  this.throwAll = options && options.throwAll;
  this.disableFormat = options && options.disableFormat === true;
};

ValidatorResult$2.prototype.addError = function addError(detail) {
  var err;
  if (typeof detail == 'string') {
    err = new ValidationError(detail, this.instance, this.schema, this.path);
  } else {
    if (!detail) throw new Error('Missing error detail');
    if (!detail.message) throw new Error('Missing error message');
    if (!detail.name) throw new Error('Missing validator type');
    err = new ValidationError(detail.message, this.instance, this.schema, this.path, detail.name, detail.argument);
  }

  this.errors.push(err);
  if (this.throwFirst) {
    throw new ValidatorResultError$1(this);
  }else if(this.throwError){
    throw err;
  }
  return err;
};

ValidatorResult$2.prototype.importErrors = function importErrors(res) {
  if (typeof res == 'string' || (res && res.validatorType)) {
    this.addError(res);
  } else if (res && res.errors) {
    Array.prototype.push.apply(this.errors, res.errors);
  }
};

function stringizer (v,i){
  return i+': '+v.toString()+'\n';
}
ValidatorResult$2.prototype.toString = function toString(res) {
  return this.errors.map(stringizer).join('');
};

Object.defineProperty(ValidatorResult$2.prototype, "valid", { get: function() {
  return !this.errors.length;
} });

helpers$3.ValidatorResultError = ValidatorResultError$1;
function ValidatorResultError$1(result) {
  if(Error.captureStackTrace){
    Error.captureStackTrace(this, ValidatorResultError$1);
  }
  this.instance = result.instance;
  this.schema = result.schema;
  this.options = result.options;
  this.errors = result.errors;
}
ValidatorResultError$1.prototype = new Error();
ValidatorResultError$1.prototype.constructor = ValidatorResultError$1;
ValidatorResultError$1.prototype.name = "Validation Error";

/**
 * Describes a problem with a Schema which prevents validation of an instance
 * @name SchemaError
 * @constructor
 */
var SchemaError$2 = helpers$3.SchemaError = function SchemaError (msg, schema) {
  this.message = msg;
  this.schema = schema;
  Error.call(this, msg);
  Error.captureStackTrace(this, SchemaError);
};
SchemaError$2.prototype = Object.create(Error.prototype,
  {
    constructor: {value: SchemaError$2, enumerable: false},
    name: {value: 'SchemaError', enumerable: false},
  });

var SchemaContext$1 = helpers$3.SchemaContext = function SchemaContext (schema, options, path, base, schemas) {
  this.schema = schema;
  this.options = options;
  if(Array.isArray(path)){
    this.path = path;
    this.propertyPath = path.reduce(function(sum, item){
      return sum + makeSuffix(item);
    }, 'instance');
  }else {
    this.propertyPath = path;
  }
  this.base = base;
  this.schemas = schemas;
};

SchemaContext$1.prototype.resolve = function resolve (target) {
  return uri.resolve(this.base, target);
};

SchemaContext$1.prototype.makeChild = function makeChild(schema, propertyName){
  var path = (propertyName===undefined) ? this.path : this.path.concat([propertyName]);
  var id = schema.$id || schema.id;
  var base = uri.resolve(this.base, id||'');
  var ctx = new SchemaContext$1(schema, this.options, path, base, Object.create(this.schemas));
  if(id && !ctx.schemas[base]){
    ctx.schemas[base] = schema;
  }
  return ctx;
};

var FORMAT_REGEXPS = helpers$3.FORMAT_REGEXPS = {
  'date-time': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/,
  'date': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/,
  'time': /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/,

  'email': /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/,
  'ip-address': /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  'ipv6': /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,

  // TODO: A more accurate regular expression for "uri" goes:
  // [A-Za-z][+\-.0-9A-Za-z]*:((/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?)?)?#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])|/?%[0-9A-Fa-f]{2}|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*(#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?|/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+(:\d*)?|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?:\d*|\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)?)?
  'uri': /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/,
  'uri-reference': /^(((([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\-.0-9A-Za-z]*:?)?)|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?)?))#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(([A-Za-z][+\-.0-9A-Za-z]*)?%[0-9A-Fa-f]{2}|[!$&-.0-9;=@_~]|[A-Za-z][+\-.0-9A-Za-z]*[!$&-*,;=@_~])(%[0-9A-Fa-f]{2}|[!$&-.0-9;=@-Z_a-z~])*((([/?](%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?#|[/?])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?|([A-Za-z][+\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\-.0-9A-Za-z]*:)?\/((%[0-9A-Fa-f]{2}|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)(:\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+(:\d*)?|(\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?:\d*|\[(([Vv][0-9A-Fa-f]+\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\])?)?|[A-Za-z][+\-.0-9A-Za-z]*:?)?$/,

  'color': /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,

  // hostname regex from: http://stackoverflow.com/a/1420225/5628
  'hostname': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
  'host-name': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,

  'alpha': /^[a-zA-Z]+$/,
  'alphanumeric': /^[a-zA-Z0-9]+$/,
  'utc-millisec': function (input) {
    return (typeof input === 'string') && parseFloat(input) === parseInt(input, 10) && !isNaN(input);
  },
  'regex': function (input) {
    var result = true;
    try {
      new RegExp(input);
    } catch (e) {
      result = false;
    }
    return result;
  },
  'style': /\s*(.+?):\s*([^;]+);?/,
  'phone': /^\+(?:[0-9] ?){6,14}[0-9]$/,
};

FORMAT_REGEXPS.regexp = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.pattern = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.ipv4 = FORMAT_REGEXPS['ip-address'];

helpers$3.isFormat = function isFormat (input, format, validator) {
  if (typeof input === 'string' && FORMAT_REGEXPS[format] !== undefined) {
    if (FORMAT_REGEXPS[format] instanceof RegExp) {
      return FORMAT_REGEXPS[format].test(input);
    }
    if (typeof FORMAT_REGEXPS[format] === 'function') {
      return FORMAT_REGEXPS[format](input);
    }
  } else if (validator && validator.customFormats &&
      typeof validator.customFormats[format] === 'function') {
    return validator.customFormats[format](input);
  }
  return true;
};

var makeSuffix = helpers$3.makeSuffix = function makeSuffix (key) {
  key = key.toString();
  // This function could be capable of outputting valid a ECMAScript string, but the
  // resulting code for testing which form to use would be tens of thousands of characters long
  // That means this will use the name form for some illegal forms
  if (!key.match(/[.\s\[\]]/) && !key.match(/^[\d]/)) {
    return '.' + key;
  }
  if (key.match(/^\d+$/)) {
    return '[' + key + ']';
  }
  return '[' + JSON.stringify(key) + ']';
};

helpers$3.deepCompareStrict = function deepCompareStrict (a, b) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    return a.every(function (v, i) {
      return deepCompareStrict(a[i], b[i]);
    });
  }
  if (typeof a === 'object') {
    if (!a || !b) {
      return a === b;
    }
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every(function (v) {
      return deepCompareStrict(a[v], b[v]);
    });
  }
  return a === b;
};

function deepMerger (target, dst, e, i) {
  if (typeof e === 'object') {
    dst[i] = deepMerge(target[i], e);
  } else {
    if (target.indexOf(e) === -1) {
      dst.push(e);
    }
  }
}

function copyist (src, dst, key) {
  dst[key] = src[key];
}

function copyistWithDeepMerge (target, src, dst, key) {
  if (typeof src[key] !== 'object' || !src[key]) {
    dst[key] = src[key];
  }
  else {
    if (!target[key]) {
      dst[key] = src[key];
    } else {
      dst[key] = deepMerge(target[key], src[key]);
    }
  }
}

function deepMerge (target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(deepMerger.bind(null, target, dst));
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(copyist.bind(null, target, dst));
    }
    Object.keys(src).forEach(copyistWithDeepMerge.bind(null, target, src, dst));
  }

  return dst;
}

helpers$3.deepMerge = deepMerge;

/**
 * Validates instance against the provided schema
 * Implements URI+JSON Pointer encoding, e.g. "%7e"="~0"=>"~", "~1"="%2f"=>"/"
 * @param o
 * @param s The path to walk o along
 * @return any
 */
helpers$3.objectGetPath = function objectGetPath(o, s) {
  var parts = s.split('/').slice(1);
  var k;
  while (typeof (k=parts.shift()) == 'string') {
    var n = decodeURIComponent(k.replace(/~0/,'~').replace(/~1/g,'/'));
    if (!(n in o)) return;
    o = o[n];
  }
  return o;
};

function pathEncoder (v) {
  return '/'+encodeURIComponent(v).replace(/~/g,'%7E');
}
/**
 * Accept an Array of property names and return a JSON Pointer URI fragment
 * @param Array a
 * @return {String}
 */
helpers$3.encodePath = function encodePointer(a){
  // ~ must be encoded explicitly because hacks
  // the slash is encoded by encodeURIComponent
  return a.map(pathEncoder).join('');
};


/**
 * Calculate the number of decimal places a number uses
 * We need this to get correct results out of multipleOf and divisibleBy
 * when either figure is has decimal places, due to IEEE-754 float issues.
 * @param number
 * @returns {number}
 */
helpers$3.getDecimalPlaces = function getDecimalPlaces(number) {

  var decimalPlaces = 0;
  if (isNaN(number)) return decimalPlaces;

  if (typeof number !== 'number') {
    number = Number(number);
  }

  var parts = number.toString().split('e');
  if (parts.length === 2) {
    if (parts[1][0] !== '-') {
      return decimalPlaces;
    } else {
      decimalPlaces = Number(parts[1].slice(1));
    }
  }

  var decimalParts = parts[0].split('.');
  if (decimalParts.length === 2) {
    decimalPlaces += decimalParts[1].length;
  }

  return decimalPlaces;
};

helpers$3.isSchema = function isSchema(val){
  return (typeof val === 'object' && val) || (typeof val === 'boolean');
};

var helpers$2 = helpers$3;

/** @type ValidatorResult */
var ValidatorResult$1 = helpers$2.ValidatorResult;
/** @type SchemaError */
var SchemaError$1 = helpers$2.SchemaError;

var attribute$1 = {};

attribute$1.ignoreProperties = {
  // informative properties
  'id': true,
  'default': true,
  'description': true,
  'title': true,
  // arguments to other properties
  'additionalItems': true,
  'then': true,
  'else': true,
  // special-handled properties
  '$schema': true,
  '$ref': true,
  'extends': true,
};

/**
 * @name validators
 */
var validators = attribute$1.validators = {};

/**
 * Validates whether the instance if of a certain type
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.type = function validateType (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.some(this.testType.bind(this, instance, schema, options, ctx))) {
    var list = types.map(function (v) {
      if(!v) return;
      var id = v.$id || v.id;
      return id ? ('<' + id + '>') : (v+'');
    });
    result.addError({
      name: 'type',
      argument: list,
      message: "is not of a type(s) " + list,
    });
  }
  return result;
};

function testSchemaNoThrow(instance, options, ctx, callback, schema){
  var throwError = options.throwError;
  var throwAll = options.throwAll;
  options.throwError = false;
  options.throwAll = false;
  var res = this.validateSchema(instance, schema, options, ctx);
  options.throwError = throwError;
  options.throwAll = throwAll;

  if (!res.valid && callback instanceof Function) {
    callback(res);
  }
  return res.valid;
}

/**
 * Validates whether the instance matches some of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.anyOf = function validateAnyOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var inner = new ValidatorResult$1(instance, schema, options, ctx);
  if (!Array.isArray(schema.anyOf)){
    throw new SchemaError$1("anyOf must be an array");
  }
  if (!schema.anyOf.some(
    testSchemaNoThrow.bind(
      this, instance, options, ctx, function(res){inner.importErrors(res);}
    ))) {
    var list = schema.anyOf.map(function (v, i) {
      var id = v.$id || v.id;
      if(id) return '<' + id + '>';
      return (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
    });
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'anyOf',
      argument: list,
      message: "is not any of " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance matches every given schema
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.allOf = function validateAllOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.allOf)){
    throw new SchemaError$1("allOf must be an array");
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var self = this;
  schema.allOf.forEach(function(v, i){
    var valid = self.validateSchema(instance, v, options, ctx);
    if(!valid.valid){
      var id = v.$id || v.id;
      var msg = id || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
      result.addError({
        name: 'allOf',
        argument: { id: msg, length: valid.errors.length, valid: valid },
        message: 'does not match allOf schema ' + msg + ' with ' + valid.errors.length + ' error[s]:',
      });
      result.importErrors(valid);
    }
  });
  return result;
};

/**
 * Validates whether the instance matches exactly one of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.oneOf = function validateOneOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.oneOf)){
    throw new SchemaError$1("oneOf must be an array");
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var inner = new ValidatorResult$1(instance, schema, options, ctx);
  var count = schema.oneOf.filter(
    testSchemaNoThrow.bind(
      this, instance, options, ctx, function(res) {inner.importErrors(res);}
    ) ).length;
  var list = schema.oneOf.map(function (v, i) {
    var id = v.$id || v.id;
    return id || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
  });
  if (count!==1) {
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'oneOf',
      argument: list,
      message: "is not exactly one from " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates "then" or "else" depending on the result of validating "if"
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.if = function validateIf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) return null;
  if (!helpers$2.isSchema(schema.if)) throw new Error('Expected "if" keyword to be a schema');
  var ifValid = testSchemaNoThrow.call(this, instance, options, ctx, null, schema.if);
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var res;
  if(ifValid){
    if (schema.then === undefined) return;
    if (!helpers$2.isSchema(schema.then)) throw new Error('Expected "then" keyword to be a schema');
    res = this.validateSchema(instance, schema.then, options, ctx.makeChild(schema.then));
    result.importErrors(res);
  }else {
    if (schema.else === undefined) return;
    if (!helpers$2.isSchema(schema.else)) throw new Error('Expected "else" keyword to be a schema');
    res = this.validateSchema(instance, schema.else, options, ctx.makeChild(schema.else));
    result.importErrors(res);
  }
  return result;
};

function getEnumerableProperty(object, key){
  // Determine if `key` shows up in `for(var key in object)`
  // First test Object.hasOwnProperty.call as an optimization: that guarantees it does
  if(Object.hasOwnProperty.call(object, key)) return object[key];
  // Test `key in object` as an optimization; false means it won't
  if(!(key in object)) return;
  while( (object = Object.getPrototypeOf(object)) ){
    if(Object.propertyIsEnumerable.call(object, key)) return object[key];
  }
}

/**
 * Validates propertyNames
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.propertyNames = function validatePropertyNames (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var subschema = schema.propertyNames!==undefined ? schema.propertyNames : {};
  if(!helpers$2.isSchema(subschema)) throw new SchemaError$1('Expected "propertyNames" to be a schema (object or boolean)');

  for (var property in instance) {
    if(getEnumerableProperty(instance, property) !== undefined){
      var res = this.validateSchema(property, subschema, options, ctx.makeChild(subschema));
      result.importErrors(res);
    }
  }

  return result;
};

/**
 * Validates properties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.properties = function validateProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var properties = schema.properties || {};
  for (var property in properties) {
    var subschema = properties[property];
    if(subschema===undefined){
      continue;
    }else if(subschema===null){
      throw new SchemaError$1('Unexpected null, expected schema in "properties"');
    }
    if (typeof options.preValidateProperty == 'function') {
      options.preValidateProperty(instance, property, subschema, options, ctx);
    }
    var prop = getEnumerableProperty(instance, property);
    var res = this.validateSchema(prop, subschema, options, ctx.makeChild(subschema, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
  return result;
};

/**
 * Test a specific property within in instance against the additionalProperties schema attribute
 * This ignores properties with definitions in the properties schema attribute, but no other attributes.
 * If too many more types of property-existence tests pop up they may need their own class of tests (like `type` has)
 * @private
 * @return {boolean}
 */
function testAdditionalProperty (instance, schema, options, ctx, property, result) {
  if(!this.types.object(instance)) return;
  if (schema.properties && schema.properties[property] !== undefined) {
    return;
  }
  if (schema.additionalProperties === false) {
    result.addError({
      name: 'additionalProperties',
      argument: property,
      message: "is not allowed to have the additional property " + JSON.stringify(property),
    });
  } else {
    var additionalProperties = schema.additionalProperties || {};

    if (typeof options.preValidateProperty == 'function') {
      options.preValidateProperty(instance, property, additionalProperties, options, ctx);
    }

    var res = this.validateSchema(instance[property], additionalProperties, options, ctx.makeChild(additionalProperties, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
}

/**
 * Validates patternProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.patternProperties = function validatePatternProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var patternProperties = schema.patternProperties || {};

  for (var property in instance) {
    var test = true;
    for (var pattern in patternProperties) {
      var subschema = patternProperties[pattern];
      if(subschema===undefined){
        continue;
      }else if(subschema===null){
        throw new SchemaError$1('Unexpected null, expected schema in "patternProperties"');
      }
      try {
        var regexp = new RegExp(pattern, 'u');
      } catch(_e) {
        // In the event the stricter handling causes an error, fall back on the forgiving handling
        // DEPRECATED
        regexp = new RegExp(pattern);
      }
      if (!regexp.test(property)) {
        continue;
      }
      test = false;

      if (typeof options.preValidateProperty == 'function') {
        options.preValidateProperty(instance, property, subschema, options, ctx);
      }

      var res = this.validateSchema(instance[property], subschema, options, ctx.makeChild(subschema, property));
      if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
      result.importErrors(res);
    }
    if (test) {
      testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
    }
  }

  return result;
};

/**
 * Validates additionalProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.additionalProperties = function validateAdditionalProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  // if patternProperties is defined then we'll test when that one is called instead
  if (schema.patternProperties) {
    return null;
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  for (var property in instance) {
    testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minProperties = function validateMinProperties (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length >= schema.minProperties)) {
    result.addError({
      name: 'minProperties',
      argument: schema.minProperties,
      message: "does not meet minimum property length of " + schema.minProperties,
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxProperties = function validateMaxProperties (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length <= schema.maxProperties)) {
    result.addError({
      name: 'maxProperties',
      argument: schema.maxProperties,
      message: "does not meet maximum property length of " + schema.maxProperties,
    });
  }
  return result;
};

/**
 * Validates items when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.items = function validateItems (instance, schema, options, ctx) {
  var self = this;
  if (!this.types.array(instance)) return;
  if (!schema.items) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  instance.every(function (value, i) {
    var items = Array.isArray(schema.items) ? (schema.items[i] || schema.additionalItems) : schema.items;
    if (items === undefined) {
      return true;
    }
    if (items === false) {
      result.addError({
        name: 'items',
        message: "additionalItems not permitted",
      });
      return false;
    }
    var res = self.validateSchema(value, items, options, ctx.makeChild(items, i));
    if(res.instance !== result.instance[i]) result.instance[i] = res.instance;
    result.importErrors(res);
    return true;
  });
  return result;
};

/**
 * Validates minimum and exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minimum = function validateMinimum (instance, schema, options, ctx) {
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (schema.exclusiveMinimum && schema.exclusiveMinimum === true) {
    if(!(instance > schema.minimum)){
      result.addError({
        name: 'minimum',
        argument: schema.minimum,
        message: "must be greater than " + schema.minimum,
      });
    }
  } else {
    if(!(instance >= schema.minimum)){
      result.addError({
        name: 'minimum',
        argument: schema.minimum,
        message: "must be greater than or equal to " + schema.minimum,
      });
    }
  }
  return result;
};

/**
 * Validates maximum and exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maximum = function validateMaximum (instance, schema, options, ctx) {
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (schema.exclusiveMaximum && schema.exclusiveMaximum === true) {
    if(!(instance < schema.maximum)){
      result.addError({
        name: 'maximum',
        argument: schema.maximum,
        message: "must be less than " + schema.maximum,
      });
    }
  } else {
    if(!(instance <= schema.maximum)){
      result.addError({
        name: 'maximum',
        argument: schema.maximum,
        message: "must be less than or equal to " + schema.maximum,
      });
    }
  }
  return result;
};

/**
 * Validates the number form of exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.exclusiveMinimum = function validateExclusiveMinimum (instance, schema, options, ctx) {
  // Support the boolean form of exclusiveMinimum, which is handled by the "minimum" keyword.
  if(typeof schema.exclusiveMaximum === 'boolean') return;
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var valid = instance > schema.exclusiveMinimum;
  if (!valid) {
    result.addError({
      name: 'exclusiveMinimum',
      argument: schema.exclusiveMinimum,
      message: "must be strictly greater than " + schema.exclusiveMinimum,
    });
  }
  return result;
};

/**
 * Validates the number form of exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.exclusiveMaximum = function validateExclusiveMaximum (instance, schema, options, ctx) {
  // Support the boolean form of exclusiveMaximum, which is handled by the "maximum" keyword.
  if(typeof schema.exclusiveMaximum === 'boolean') return;
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var valid = instance < schema.exclusiveMaximum;
  if (!valid) {
    result.addError({
      name: 'exclusiveMaximum',
      argument: schema.exclusiveMaximum,
      message: "must be strictly less than " + schema.exclusiveMaximum,
    });
  }
  return result;
};

/**
 * Perform validation for multipleOf and divisibleBy, which are essentially the same.
 * @param instance
 * @param schema
 * @param validationType
 * @param errorMessage
 * @returns {String|null}
 */
var validateMultipleOfOrDivisbleBy = function validateMultipleOfOrDivisbleBy (instance, schema, options, ctx, validationType, errorMessage) {
  if (!this.types.number(instance)) return;

  var validationArgument = schema[validationType];
  if (validationArgument == 0) {
    throw new SchemaError$1(validationType + " cannot be zero");
  }

  var result = new ValidatorResult$1(instance, schema, options, ctx);

  var instanceDecimals = helpers$2.getDecimalPlaces(instance);
  var divisorDecimals = helpers$2.getDecimalPlaces(validationArgument);

  var maxDecimals = Math.max(instanceDecimals , divisorDecimals);
  var multiplier = Math.pow(10, maxDecimals);

  if (Math.round(instance * multiplier) % Math.round(validationArgument * multiplier) !== 0) {
    result.addError({
      name: validationType,
      argument:  validationArgument,
      message: errorMessage + JSON.stringify(validationArgument),
    });
  }

  return result;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.multipleOf = function validateMultipleOf (instance, schema, options, ctx) {
  return validateMultipleOfOrDivisbleBy.call(this, instance, schema, options, ctx, "multipleOf", "is not a multiple of (divisible by) ");
};

/**
 * Validates multipleOf when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.divisibleBy = function validateDivisibleBy (instance, schema, options, ctx) {
  return validateMultipleOfOrDivisbleBy.call(this, instance, schema, options, ctx, "divisibleBy", "is not divisible by (multiple of) ");
};

/**
 * Validates whether the instance value is present.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.required = function validateRequired (instance, schema, options, ctx) {
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (instance === undefined && schema.required === true) {
    // A boolean form is implemented for reverse-compatibility with schemas written against older drafts
    result.addError({
      name: 'required',
      message: "is required",
    });
  } else if (this.types.object(instance) && Array.isArray(schema.required)) {
    schema.required.forEach(function(n){
      if(getEnumerableProperty(instance, n)===undefined){
        result.addError({
          name: 'required',
          argument: n,
          message: "requires property " + JSON.stringify(n),
        });
      }
    });
  }
  return result;
};

/**
 * Validates whether the instance value matches the regular expression, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.pattern = function validatePattern (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var pattern = schema.pattern;
  try {
    var regexp = new RegExp(pattern, 'u');
  } catch(_e) {
    // In the event the stricter handling causes an error, fall back on the forgiving handling
    // DEPRECATED
    regexp = new RegExp(pattern);
  }
  if (!instance.match(regexp)) {
    result.addError({
      name: 'pattern',
      argument: schema.pattern,
      message: "does not match pattern " + JSON.stringify(schema.pattern.toString()),
    });
  }
  return result;
};

/**
 * Validates whether the instance value is of a certain defined format or a custom
 * format.
 * The following formats are supported for string types:
 *   - date-time
 *   - date
 *   - time
 *   - ip-address
 *   - ipv6
 *   - uri
 *   - color
 *   - host-name
 *   - alpha
 *   - alpha-numeric
 *   - utc-millisec
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {String|null}
 */
validators.format = function validateFormat (instance, schema, options, ctx) {
  if (instance===undefined) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!result.disableFormat && !helpers$2.isFormat(instance, schema.format, this)) {
    result.addError({
      name: 'format',
      argument: schema.format,
      message: "does not conform to the " + JSON.stringify(schema.format) + " format",
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minLength = function validateMinLength (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var hsp = instance.match(/[\uDC00-\uDFFF]/g);
  var length = instance.length - (hsp ? hsp.length : 0);
  if (!(length >= schema.minLength)) {
    result.addError({
      name: 'minLength',
      argument: schema.minLength,
      message: "does not meet minimum length of " + schema.minLength,
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxLength = function validateMaxLength (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  // TODO if this was already computed in "minLength", use that value instead of re-computing
  var hsp = instance.match(/[\uDC00-\uDFFF]/g);
  var length = instance.length - (hsp ? hsp.length : 0);
  if (!(length <= schema.maxLength)) {
    result.addError({
      name: 'maxLength',
      argument: schema.maxLength,
      message: "does not meet maximum length of " + schema.maxLength,
    });
  }
  return result;
};

/**
 * Validates whether instance contains at least a minimum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minItems = function validateMinItems (instance, schema, options, ctx) {
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!(instance.length >= schema.minItems)) {
    result.addError({
      name: 'minItems',
      argument: schema.minItems,
      message: "does not meet minimum length of " + schema.minItems,
    });
  }
  return result;
};

/**
 * Validates whether instance contains no more than a maximum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxItems = function validateMaxItems (instance, schema, options, ctx) {
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!(instance.length <= schema.maxItems)) {
    result.addError({
      name: 'maxItems',
      argument: schema.maxItems,
      message: "does not meet maximum length of " + schema.maxItems,
    });
  }
  return result;
};

/**
 * Deep compares arrays for duplicates
 * @param v
 * @param i
 * @param a
 * @private
 * @return {boolean}
 */
function testArrays (v, i, a) {
  var j, len = a.length;
  for (j = i + 1, len; j < len; j++) {
    if (helpers$2.deepCompareStrict(v, a[j])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether there are no duplicates, when the instance is an Array.
 * @param instance
 * @return {String|null}
 */
validators.uniqueItems = function validateUniqueItems (instance, schema, options, ctx) {
  if (schema.uniqueItems!==true) return;
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!instance.every(testArrays)) {
    result.addError({
      name: 'uniqueItems',
      message: "contains duplicate item",
    });
  }
  return result;
};

/**
 * Validate for the presence of dependency properties, if the instance is an object.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.dependencies = function validateDependencies (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  for (var property in schema.dependencies) {
    if (instance[property] === undefined) {
      continue;
    }
    var dep = schema.dependencies[property];
    var childContext = ctx.makeChild(dep, property);
    if (typeof dep == 'string') {
      dep = [dep];
    }
    if (Array.isArray(dep)) {
      dep.forEach(function (prop) {
        if (instance[prop] === undefined) {
          result.addError({
            // FIXME there's two different "dependencies" errors here with slightly different outputs
            // Can we make these the same? Or should we create different error types?
            name: 'dependencies',
            argument: childContext.propertyPath,
            message: "property " + prop + " not found, required by " + childContext.propertyPath,
          });
        }
      });
    } else {
      var res = this.validateSchema(instance, dep, options, childContext);
      if(result.instance !== res.instance) result.instance = res.instance;
      if (res && res.errors.length) {
        result.addError({
          name: 'dependencies',
          argument: childContext.propertyPath,
          message: "does not meet dependency required by " + childContext.propertyPath,
        });
        result.importErrors(res);
      }
    }
  }
  return result;
};

/**
 * Validates whether the instance value is one of the enumerated values.
 *
 * @param instance
 * @param schema
 * @return {ValidatorResult|null}
 */
validators['enum'] = function validateEnum (instance, schema, options, ctx) {
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema['enum'])) {
    throw new SchemaError$1("enum expects an array", schema);
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!schema['enum'].some(helpers$2.deepCompareStrict.bind(null, instance))) {
    result.addError({
      name: 'enum',
      argument: schema['enum'],
      message: "is not one of enum values: " + schema['enum'].map(String).join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance exactly matches a given value
 *
 * @param instance
 * @param schema
 * @return {ValidatorResult|null}
 */
validators['const'] = function validateEnum (instance, schema, options, ctx) {
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  if (!helpers$2.deepCompareStrict(schema['const'], instance)) {
    result.addError({
      name: 'const',
      argument: schema['const'],
      message: "does not exactly match expected constant: " + schema['const'],
    });
  }
  return result;
};

/**
 * Validates whether the instance if of a prohibited type.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.not = validators.disallow = function validateNot (instance, schema, options, ctx) {
  var self = this;
  if(instance===undefined) return null;
  var result = new ValidatorResult$1(instance, schema, options, ctx);
  var notTypes = schema.not || schema.disallow;
  if(!notTypes) return null;
  if(!Array.isArray(notTypes)) notTypes=[notTypes];
  notTypes.forEach(function (type) {
    if (self.testType(instance, schema, options, ctx, type)) {
      var id = type && (type.$id || type.id);
      var schemaId = id || type;
      result.addError({
        name: 'not',
        argument: schemaId,
        message: "is of prohibited type " + schemaId,
      });
    }
  });
  return result;
};

var attribute_1 = attribute$1;

var scan = {};

var urilib$1 = url;
var helpers$1 = helpers$3;

scan.SchemaScanResult = SchemaScanResult;
function SchemaScanResult(found, ref){
  this.id = found;
  this.ref = ref;
}

/**
 * Adds a schema with a certain urn to the Validator instance.
 * @param string uri
 * @param object schema
 * @return {Object}
 */
scan.scan = function scan(base, schema){
  function scanSchema(baseuri, schema){
    if(!schema || typeof schema!='object') return;
    // Mark all referenced schemas so we can tell later which schemas are referred to, but never defined
    if(schema.$ref){
      var resolvedUri = urilib$1.resolve(baseuri, schema.$ref);
      ref[resolvedUri] = ref[resolvedUri] ? ref[resolvedUri]+1 : 0;
      return;
    }
    var id = schema.$id || schema.id;
    var ourBase = id ? urilib$1.resolve(baseuri, id) : baseuri;
    if (ourBase) {
      // If there's no fragment, append an empty one
      if(ourBase.indexOf('#')<0) ourBase += '#';
      if(found[ourBase]){
        if(!helpers$1.deepCompareStrict(found[ourBase], schema)){
          throw new Error('Schema <'+ourBase+'> already exists with different definition');
        }
        return found[ourBase];
      }
      found[ourBase] = schema;
      // strip trailing fragment
      if(ourBase[ourBase.length-1]=='#'){
        found[ourBase.substring(0, ourBase.length-1)] = schema;
      }
    }
    scanArray(ourBase+'/items', (Array.isArray(schema.items)?schema.items:[schema.items]));
    scanArray(ourBase+'/extends', (Array.isArray(schema.extends)?schema.extends:[schema.extends]));
    scanSchema(ourBase+'/additionalItems', schema.additionalItems);
    scanObject(ourBase+'/properties', schema.properties);
    scanSchema(ourBase+'/additionalProperties', schema.additionalProperties);
    scanObject(ourBase+'/definitions', schema.definitions);
    scanObject(ourBase+'/patternProperties', schema.patternProperties);
    scanObject(ourBase+'/dependencies', schema.dependencies);
    scanArray(ourBase+'/disallow', schema.disallow);
    scanArray(ourBase+'/allOf', schema.allOf);
    scanArray(ourBase+'/anyOf', schema.anyOf);
    scanArray(ourBase+'/oneOf', schema.oneOf);
    scanSchema(ourBase+'/not', schema.not);
  }
  function scanArray(baseuri, schemas){
    if(!Array.isArray(schemas)) return;
    for(var i=0; i<schemas.length; i++){
      scanSchema(baseuri+'/'+i, schemas[i]);
    }
  }
  function scanObject(baseuri, schemas){
    if(!schemas || typeof schemas!='object') return;
    for(var p in schemas){
      scanSchema(baseuri+'/'+p, schemas[p]);
    }
  }

  var found = {};
  var ref = {};
  scanSchema(base, schema);
  return new SchemaScanResult(found, ref);
};

var urilib = url;

var attribute = attribute_1;
var helpers = helpers$3;
var scanSchema = scan.scan;
var ValidatorResult = helpers.ValidatorResult;
var ValidatorResultError = helpers.ValidatorResultError;
var SchemaError = helpers.SchemaError;
var SchemaContext = helpers.SchemaContext;
//var anonymousBase = 'vnd.jsonschema:///';
var anonymousBase = '/';

/**
 * Creates a new Validator object
 * @name Validator
 * @constructor
 */
var Validator = function Validator () {
  // Allow a validator instance to override global custom formats or to have their
  // own custom formats.
  this.customFormats = Object.create(Validator.prototype.customFormats);
  this.schemas = {};
  this.unresolvedRefs = [];

  // Use Object.create to make this extensible without Validator instances stepping on each other's toes.
  this.types = Object.create(types);
  this.attributes = Object.create(attribute.validators);
};

// Allow formats to be registered globally.
Validator.prototype.customFormats = {};

// Hint at the presence of a property
Validator.prototype.schemas = null;
Validator.prototype.types = null;
Validator.prototype.attributes = null;
Validator.prototype.unresolvedRefs = null;

/**
 * Adds a schema with a certain urn to the Validator instance.
 * @param schema
 * @param urn
 * @return {Object}
 */
Validator.prototype.addSchema = function addSchema (schema, base) {
  var self = this;
  if (!schema) {
    return null;
  }
  var scan = scanSchema(base||anonymousBase, schema);
  var ourUri = base || schema.$id || schema.id;
  for(var uri in scan.id){
    this.schemas[uri] = scan.id[uri];
  }
  for(var uri in scan.ref){
    // If this schema is already defined, it will be filtered out by the next step
    this.unresolvedRefs.push(uri);
  }
  // Remove newly defined schemas from unresolvedRefs
  this.unresolvedRefs = this.unresolvedRefs.filter(function(uri){
    return typeof self.schemas[uri]==='undefined';
  });
  return this.schemas[ourUri];
};

Validator.prototype.addSubSchemaArray = function addSubSchemaArray(baseuri, schemas) {
  if(!Array.isArray(schemas)) return;
  for(var i=0; i<schemas.length; i++){
    this.addSubSchema(baseuri, schemas[i]);
  }
};

Validator.prototype.addSubSchemaObject = function addSubSchemaArray(baseuri, schemas) {
  if(!schemas || typeof schemas!='object') return;
  for(var p in schemas){
    this.addSubSchema(baseuri, schemas[p]);
  }
};



/**
 * Sets all the schemas of the Validator instance.
 * @param schemas
 */
Validator.prototype.setSchemas = function setSchemas (schemas) {
  this.schemas = schemas;
};

/**
 * Returns the schema of a certain urn
 * @param urn
 */
Validator.prototype.getSchema = function getSchema (urn) {
  return this.schemas[urn];
};

/**
 * Validates instance against the provided schema
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {Array}
 */
Validator.prototype.validate = function validate (instance, schema, options, ctx) {
  if((typeof schema !== 'boolean' && typeof schema !== 'object') || schema === null){
    throw new SchemaError('Expected `schema` to be an object or boolean');
  }
  if (!options) {
    options = {};
  }
  // This section indexes subschemas in the provided schema, so they don't need to be added with Validator#addSchema
  // This will work so long as the function at uri.resolve() will resolve a relative URI to a relative URI
  var id = schema.$id || schema.id;
  var base = urilib.resolve(options.base||anonymousBase, id||'');
  if(!ctx){
    ctx = new SchemaContext(schema, options, [], base, Object.create(this.schemas));
    if (!ctx.schemas[base]) {
      ctx.schemas[base] = schema;
    }
    var found = scanSchema(base, schema);
    for(var n in found.id){
      var sch = found.id[n];
      ctx.schemas[n] = sch;
    }
  }
  if(options.required && instance===undefined){
    var result = new ValidatorResult(instance, schema, options, ctx);
    result.addError('is required, but is undefined');
    return result;
  }
  var result = this.validateSchema(instance, schema, options, ctx);
  if (!result) {
    throw new Error('Result undefined');
  }else if(options.throwAll && result.errors.length){
    throw new ValidatorResultError(result);
  }
  return result;
};

/**
* @param Object schema
* @return mixed schema uri or false
*/
function shouldResolve(schema) {
  var ref = (typeof schema === 'string') ? schema : schema.$ref;
  if (typeof ref=='string') return ref;
  return false;
}

/**
 * Validates an instance against the schema (the actual work horse)
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @private
 * @return {ValidatorResult}
 */
Validator.prototype.validateSchema = function validateSchema (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);

  // Support for the true/false schemas
  if(typeof schema==='boolean') {
    if(schema===true){
      // `true` is always valid
      schema = {};
    }else if(schema===false){
      // `false` is always invalid
      schema = {type: []};
    }
  }else if(!schema){
    // This might be a string
    throw new Error("schema is undefined");
  }

  if (schema['extends']) {
    if (Array.isArray(schema['extends'])) {
      var schemaobj = {schema: schema, ctx: ctx};
      schema['extends'].forEach(this.schemaTraverser.bind(this, schemaobj));
      schema = schemaobj.schema;
      schemaobj.schema = null;
      schemaobj.ctx = null;
      schemaobj = null;
    } else {
      schema = helpers.deepMerge(schema, this.superResolve(schema['extends'], ctx));
    }
  }

  // If passed a string argument, load that schema URI
  var switchSchema = shouldResolve(schema);
  if (switchSchema) {
    var resolved = this.resolve(schema, switchSchema, ctx);
    var subctx = new SchemaContext(resolved.subschema, options, ctx.path, resolved.switchSchema, ctx.schemas);
    return this.validateSchema(instance, resolved.subschema, options, subctx);
  }

  var skipAttributes = options && options.skipAttributes || [];
  // Validate each schema attribute against the instance
  for (var key in schema) {
    if (!attribute.ignoreProperties[key] && skipAttributes.indexOf(key) < 0) {
      var validatorErr = null;
      var validator = this.attributes[key];
      if (validator) {
        validatorErr = validator.call(this, instance, schema, options, ctx);
      } else if (options.allowUnknownAttributes === false) {
        // This represents an error with the schema itself, not an invalid instance
        throw new SchemaError("Unsupported attribute: " + key, schema);
      }
      if (validatorErr) {
        result.importErrors(validatorErr);
      }
    }
  }

  if (typeof options.rewrite == 'function') {
    var value = options.rewrite.call(this, instance, schema, options, ctx);
    result.instance = value;
  }
  return result;
};

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.schemaTraverser = function schemaTraverser (schemaobj, s) {
  schemaobj.schema = helpers.deepMerge(schemaobj.schema, this.superResolve(s, schemaobj.ctx));
};

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.superResolve = function superResolve (schema, ctx) {
  var ref = shouldResolve(schema);
  if(ref) {
    return this.resolve(schema, ref, ctx).subschema;
  }
  return schema;
};

/**
* @private
* @param Object schema
* @param Object switchSchema
* @param SchemaContext ctx
* @return Object resolved schemas {subschema:String, switchSchema: String}
* @throws SchemaError
*/
Validator.prototype.resolve = function resolve (schema, switchSchema, ctx) {
  switchSchema = ctx.resolve(switchSchema);
  // First see if the schema exists under the provided URI
  if (ctx.schemas[switchSchema]) {
    return {subschema: ctx.schemas[switchSchema], switchSchema: switchSchema};
  }
  // Else try walking the property pointer
  var parsed = urilib.parse(switchSchema);
  var fragment = parsed && parsed.hash;
  var document = fragment && fragment.length && switchSchema.substr(0, switchSchema.length - fragment.length);
  if (!document || !ctx.schemas[document]) {
    throw new SchemaError("no such schema <" + switchSchema + ">", schema);
  }
  var subschema = helpers.objectGetPath(ctx.schemas[document], fragment.substr(1));
  if(subschema===undefined){
    throw new SchemaError("no such schema " + fragment + " located in <" + document + ">", schema);
  }
  return {subschema: subschema, switchSchema: switchSchema};
};

/**
 * Tests whether the instance if of a certain type.
 * @private
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @param type
 * @return {boolean}
 */
Validator.prototype.testType = function validateType (instance, schema, options, ctx, type) {
  if(type===undefined){
    return;
  }else if(type===null){
    throw new SchemaError('Unexpected null in "type" keyword');
  }
  if (typeof this.types[type] == 'function') {
    return this.types[type].call(this, instance);
  }
  if (type && typeof type == 'object') {
    var res = this.validateSchema(instance, type, options, ctx);
    return res === undefined || !(res && res.errors.length);
  }
  // Undefined or properties not on the list are acceptable, same as not being defined
  return true;
};

var types = Validator.prototype.types = {};
types.string = function testString (instance) {
  return typeof instance == 'string';
};
types.number = function testNumber (instance) {
  // isFinite returns false for NaN, Infinity, and -Infinity
  return typeof instance == 'number' && isFinite(instance);
};
types.integer = function testInteger (instance) {
  return (typeof instance == 'number') && instance % 1 === 0;
};
types.boolean = function testBoolean (instance) {
  return typeof instance == 'boolean';
};
types.array = function testArray (instance) {
  return Array.isArray(instance);
};
types['null'] = function testNull (instance) {
  return instance === null;
};
types.date = function testDate (instance) {
  return instance instanceof Date;
};
types.any = function testAny (instance) {
  return true;
};
types.object = function testObject (instance) {
  // TODO: fix this - see #15
  return instance && (typeof instance === 'object') && !(Array.isArray(instance)) && !(instance instanceof Date);
};

var validator = Validator;

var Validator_1;

Validator_1 = validator;

var schema$2 = "https://json-schema.org/draft/2020-12/schema";
var id$2 = "/visualization";
var title$2 = "Visualization";
var description$2 = "A webgl visualization made of a sequence of tracks";
var type$2 = "object";
var required$1 = [
	"tracks"
];
var properties$2 = {
	labels: {
		description: "set of labels to display on visualization, properties of labels can be any valid attribute for an svg text element",
		examples: [
			{
				x: 100,
				y: 200,
				text: "my favorite data point",
				rotate: -90
			},
			{
				x: -1.1,
				y: 0,
				text: "Track 1",
				color: "red",
				fixedX: true
			}
		],
		type: "array",
		items: {
			properties: {
				x: {
					description: "x coordinate of label with respect to data coordinates, should be on scale with [-1, 1] if x dimension is categorical or genomic",
					type: "number"
				},
				y: {
					description: "y coordinate of label with respect to data coordinates, should be on scale with [-1, 1] if y dimension is categorical or genomic",
					type: "number"
				},
				fixedX: {
					description: "fix the x coordinate of the label, so it does not move when panning/zooming left or right",
					type: "boolean"
				},
				fixedY: {
					description: "fix the y coordinate of the label, so it does not move when panning/zooming up or down",
					type: "boolean"
				},
				required: [
					"x",
					"y"
				]
			}
		}
	},
	xAxis: {
		description: "location of x-axis",
		"enum": [
			"bottom",
			"top",
			"center",
			"none",
			"zero"
		]
	},
	yAxis: {
		description: "location of y-axis",
		"enum": [
			"left",
			"right",
			"center",
			"none",
			"zero"
		]
	},
	tracks: {
		description: "A track is a map from the data to a sequence of marks",
		type: "array",
		items: {
			$ref: "/track"
		}
	},
	defaultData: {
		description: "A string of a csv href containing data or an object of inline data where each key is a column of values",
		examples: [
			"http://example.com/data.csv",
			{
				day: [
					1,
					2
				],
				price: [
					10,
					20
				]
			}
		],
		type: [
			"string",
			"object"
		],
		minProperties: 1,
		patternProperties: {
			"^.*$": {
				type: "array",
				items: {
				}
			}
		}
	},
	width: {
		description: "Width of the visualization in css units",
		examples: [
			"400px",
			"100%",
			"10em",
			"600"
		],
		type: "string"
	},
	height: {
		description: "Height of the visualization in css units",
		examples: [
			"400px",
			"100%",
			"10em",
			"600"
		],
		type: "string"
	},
	margins: {
		description: "Margins for the visualization; gives more space for labels and axis to render",
		properties: {
			top: {
				description: "Top margin of the visualization in css units",
				type: "string",
				examples: [
					"100px",
					"5%",
					"5em"
				]
			},
			bottom: {
				description: "Bottom margin of the visualization in css units",
				type: "string",
				examples: [
					"100px",
					"5%",
					"5em"
				]
			},
			left: {
				description: "Left margin of the visualization in css units",
				type: "string",
				examples: [
					"100px",
					"5%",
					"5em"
				]
			},
			right: {
				description: "Right margin of the visualization in css units",
				type: "string",
				examples: [
					"100px",
					"5%",
					"5em"
				]
			}
		}
	}
};
var allOf$1 = [
	{
		description: "if there is no default data for the visualization require each track to have data property",
		"if": {
			not: {
				required: [
					"defaultData"
				]
			}
		},
		then: {
			properties: {
				tracks: {
					items: {
						required: [
							"data"
						]
					}
				}
			}
		},
		"else": {
		}
	}
];
var visualization = {
	schema: schema$2,
	id: id$2,
	title: title$2,
	description: description$2,
	type: type$2,
	required: required$1,
	properties: properties$2,
	allOf: allOf$1
};

var schema$1 = "https://json-schema.org/draft/2020-12/schema";
var id$1 = "/track";
var title$1 = "Track";
var description$1 = "A track to visualize";
var type$1 = "object";
var required = [
	"mark",
	"x",
	"y"
];
var properties$1 = {
	data: {
		description: "A string of a csv href containing data or an object of inline data where each key is an array of a data column",
		type: [
			"string",
			"object"
		],
		additionalProperties: {
			type: "array"
		},
		minProperties: 1
	},
	mark: {
		description: "type of mark to visualize",
		"enum": [
			"point",
			"line",
			"area",
			"rect",
			"tick",
			"arc"
		]
	},
	tooltips: {
		description: "a number between 0 and 1 where 0 is no tooltips, 1 is always show, and, for example, 0.1 would be show tooltips when zoomed in to 10% of the domain",
		type: "number",
		minimum: 0,
		maximum: 1
	},
	x: {
		description: "define the x coordinates of the marks",
		type: "object",
		allOf: [
			{
				$ref: "/channel"
			}
		],
		examples: [
			{
				type: "genomic",
				chrAttribute: "chr",
				geneAttribute: "gene",
				domain: [
					"chr2:100",
					"chr2:300"
				]
			}
		]
	},
	y: {
		description: "define the y coordinates of the marks",
		type: "object",
		allOf: [
			{
				$ref: "/channel"
			}
		],
		examples: [
			{
				type: "quantitative",
				attribute: "time",
				domain: [
					0,
					10
				]
			},
			{
				attribute: "sample",
				type: "categorical",
				cardinality: 10
			}
		]
	},
	color: {
		description: "define the color of the marks, for fixed values can be any css3 color descriptor or a number that translates to a color in hex",
		type: "object",
		properties: {
			colorScheme: {
				description: "d3 continuous color scheme to use, see d3-scale-chromatic for options",
				examples: [
					"interpolateBlues",
					"interpolateReds",
					"interpolateRainbow"
				],
				type: "string"
			}
		},
		examples: [
			{
				value: "red"
			},
			{
				value: 16581375
			},
			{
				attribute: "sample",
				type: "categorical",
				cardinality: 10,
				colorScheme: "interpolateBuGn"
			}
		],
		allOf: [
			{
				$ref: "/channel"
			}
		]
	},
	size: {
		description: "size of the mark, used only when mark type is point, use width or height for other mark types. The units of this channel correspond to 1/200th of the canvas e.g. a size of 100 is half the canvas.",
		type: "object",
		properties: {
			maxSize: {
				type: "number"
			},
			minSize: {
				type: "number"
			},
			value: {
				type: "number"
			}
		},
		examples: [
			{
				attribute: "population",
				type: "quantitative",
				domain: [
					0,
					1000
				],
				maxSize: 10,
				minSize: 1
			}
		],
		allOf: [
			{
				$ref: "/channel"
			}
		]
	},
	width: {
		description: "width of the mark, used for rect, arc, and tick marks only. The units of this channel correspond to 1/200th of the width of the canvas. This channel may be a genomic range type for arc tracks. If both height and width are specified for a tick mark, only width is used.",
		type: "object",
		properties: {
			maxWidth: {
				type: "number"
			},
			minWidth: {
				type: "number"
			},
			value: {
				type: "number"
			}
		},
		allOf: [
			{
				$ref: "/channel"
			}
		]
	},
	height: {
		description: "height of the mark, used for rect, arc, and tick marks only. The units of this channel correspond to 1/200th of the height of the canvas. This channel may be a genomic range type for arc tracks.",
		type: "object",
		properties: {
			maxHeight: {
				type: "number"
			},
			minHeight: {
				type: "number"
			},
			value: {
				type: "number"
			}
		},
		allOf: [
			{
				$ref: "/channel"
			}
		]
	},
	opacity: {
		description: "opacity of the mark, compatible with all mark types",
		type: "object",
		properties: {
			minOpacity: {
				type: "number",
				minimum: 0,
				exclusiveMaximum: 1
			},
			value: {
				type: "number"
			}
		},
		allOf: [
			{
				$ref: "/channel"
			}
		]
	},
	shape: {
		description: "shape of the mark, used only for point marks",
		type: "object",
		properties: {
			value: {
				"enum": [
					"dot",
					"circle",
					"diamond",
					"triangle"
				]
			}
		},
		allOf: [
			{
				$ref: "/channel"
			}
		]
	}
};
var track = {
	schema: schema$1,
	id: id$1,
	title: title$1,
	description: description$1,
	type: type$1,
	required: required,
	properties: properties$1
};

var schema = "https://json-schema.org/draft/2020-12/schema";
var id = "/channel";
var title = "Channel";
var description = "A channel of a visualization";
var type = "object";
var properties = {
	type: {
		description: "type of attribute, genomic range only compatible with x, y, width and height",
		"enum": [
			"quantitative",
			"categorical",
			"genomic",
			"genomicRange",
			"inline"
		]
	},
	attribute: {
		description: "column of data frame to use for mapping channel",
		type: "string"
	},
	value: {
		description: "if fixing a channel, specify with value",
		type: [
			"string",
			"number",
			"boolean"
		]
	},
	domain: {
		description: "domain of attribute to use for mapping, required if type is quantitative",
		type: "array"
	},
	cardinality: {
		description: "number of attribute values to use for mapping, required if type is categorical",
		type: "integer"
	},
	chrAttribute: {
		description: "if type is genomic or genomicRange, the attribute that contains the chromosome id",
		type: "string"
	},
	startAttribute: {
		description: "if type is genomicRange, the attribute that contains the start of the range",
		type: "string"
	},
	endAttribute: {
		description: "if type is genomicRange, the attribute that contains the end of the range",
		type: "string"
	},
	genome: {
		description: "genome being mapped",
		"enum": [
			"hg38",
			"hg19",
			"mm39"
		]
	}
};
var allOf = [
	{
		description: "If type is genomic, require genomic attributes and forbid regular attributes",
		anyOf: [
			{
				not: {
					properties: {
						type: {
							"const": "genomic"
						}
					},
					required: [
						"type"
					]
				}
			},
			{
				required: [
					"chrAttribute",
					"geneAttribute",
					"genome"
				],
				not: {
					required: [
						"attribute",
						"startAttribute",
						"endAttribute"
					]
				},
				properties: {
					domain: {
						items: [
							{
								type: "string",
								pattern: "chr(\\d{1,2}|[XY]):\\d+"
							},
							{
								type: "string",
								pattern: "chr(\\d{1,2}|[XY]):\\d+"
							}
						]
					}
				}
			}
		]
	},
	{
		description: "If type is genomicRange, require genomicRange attributes and forbid regular attribute",
		anyOf: [
			{
				not: {
					properties: {
						type: {
							"const": "genomicRange"
						}
					},
					required: [
						"type"
					]
				}
			},
			{
				required: [
					"chrAttribute",
					"startAttribute",
					"endAttribute",
					"genome"
				],
				not: {
					required: [
						"attribute",
						"geneAttribute"
					]
				},
				properties: {
					domain: {
						items: [
							{
								type: "string",
								pattern: "chr(\\d{1,2}|[XY]):\\d+"
							},
							{
								type: "string",
								pattern: "chr(\\d{1,2}|[XY]):\\d+"
							}
						]
					}
				}
			}
		]
	},
	{
		description: "If type is quantitative, require domain and forbid cardinality",
		anyOf: [
			{
				not: {
					properties: {
						type: {
							"const": "quantitative"
						}
					},
					required: [
						"type"
					]
				}
			},
			{
				required: [
					"domain"
				],
				properties: {
					domain: {
						items: [
							{
								type: "number"
							},
							{
								type: "number"
							}
						]
					}
				},
				not: {
					required: [
						"cardinality"
					]
				}
			}
		]
	},
	{
		description: "If type is categorical, require cardinality and forbid domain",
		anyOf: [
			{
				not: {
					properties: {
						type: {
							"const": "categorical"
						}
					},
					required: [
						"type"
					]
				}
			},
			{
				required: [
					"cardinality"
				],
				not: {
					required: [
						"domain"
					]
				}
			}
		]
	},
	{
		description: "If value is defined, disallow other attributes",
		anyOf: [
			{
				not: {
					properties: {
						value: {
							not: {
								type: "null"
							}
						}
					},
					required: [
						"value"
					]
				}
			},
			{
				allOf: [
					{
						not: {
							required: [
								"attribute"
							]
						}
					},
					{
						not: {
							required: [
								"type"
							]
						}
					},
					{
						not: {
							required: [
								"domain"
							]
						}
					},
					{
						not: {
							required: [
								"cardinality"
							]
						}
					}
				]
			}
		]
	},
	{
		description: "If value is not defined, require attribute or genomic attributes",
		anyOf: [
			{
				not: {
					properties: {
						value: {
							type: "null"
						}
					}
				}
			},
			{
				oneOf: [
					{
						required: [
							"attribute"
						]
					},
					{
						required: [
							"chrAttribute",
							"genome"
						]
					}
				]
			}
		]
	}
];
var channel = {
	schema: schema,
	id: id,
	title: title,
	description: description,
	type: type,
	properties: properties,
	allOf: allOf
};

const v = new Validator_1();
v.addSchema(channel, "/channel");
v.addSchema(track, "/track");

/**
 * Utility method that returns a boolean on whether the json is a valid specification.
 * console.errors the reason if it is not.
 * @param {Object} json specification
 * @returns boolean
 */
const isJSONValid = (json) => {
  let jsonToValidate = json;

  // Check if any typed arrays are in 'defaultData'
  const typedArrayTypes = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  ];

  if (
    json.defaultData &&
    Object.values(json.defaultData).some((value) =>
      typedArrayTypes.some((T) => value instanceof T)
    )
  ) {
    // Create a deep copy of the json if a typed array needs to be converted
    jsonToValidate = JSON.parse(JSON.stringify(json));

    // Convert typed arrays to standard arrays
    Object.keys(jsonToValidate.defaultData).forEach((key) => {
      if (typedArrayTypes.some((T) => json.defaultData[key] instanceof T)) {
        jsonToValidate.defaultData[key] = Array.from(json.defaultData[key]);
      }
    });
  }

  const validation = v.validate(jsonToValidate, visualization);

  if (!validation.valid) {
    console.error(validation.errors);
  }

  return validation.valid;
};

class WebGLVis {
  /**
   * A class meant to display a visualization based off a given specification using webgl.
   *
   * @param {HTMLElement} container <div> or other container element meant to contain the visualization and its mousereader
   */
  constructor(container) {
    this.container = container;
    this.mouseReader = new MouseReader(document.createElement("div"), this);

    this.parent = document.createElement("div");
    this.parent.style.position = "relative";
    this.parent.style.overflow = "hidden";

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";

    this.POSSIBLE_MOUSE_READER_OPTIONS = Object.freeze([
      "lockedX",
      "lockedY",
      "tool",
      "viewport",
      "currentXRange",
      "currentYRange",
    ]);
  }

  /**
   * Resize the canvas to a particular size and rerender the data
   *
   * @param {Number} width in pixels to resize the canvas to
   * @param {Number} height in pixels to resize the canvas to
   */
  setCanvasSize(width, height) {
    this.webglWorker.postMessage({
      type: "resize",
      width,
      height,
    });

    this.canvas.style.width = width;
    this.canvas.style.height = height;
    this.mouseReader.width = width;
    this.mouseReader.height = height;
    this.sendDrawerState(this.mouseReader.getViewport());
  }

  /**
   * This method does three things, and should only be called once. If changing the specification
   * use setSpecification.
   *  1. Add the canvas and mousereader to the DOM for use.
   *  2. Creates the WebWorkers that render and process the data.
   *  3. Exposes the messages the webworkers send back to the main thread under this.dataWorkerStream
   *
   * @param {Boolean} displayFPSMeter whether or not to display an fps meter
   */
  addToDom(displayFPSMeter) {
    this.container.appendChild(this.parent);
    this.parent.appendChild(this.canvas);
    this.parent.appendChild(this.mouseReader.element);

    if (displayFPSMeter) {
      this.initFpsmeter();
    }

    const offscreenCanvas = this.canvas.transferControlToOffscreen();

    this.webglWorker = new Worker(new URL("offscreen-webgl-worker-2e37818c-b508e821.js", import.meta.url),
      { type: "module" }
    );
    this.webglWorker.postMessage(
      {
        type: "init",
        canvas: offscreenCanvas,
        displayFPSMeter,
      },
      [offscreenCanvas]
    );

    // Allow OffScreenWebGLDrawer to tick FPS meter
    this.webglWorker.onmessage = (e) => {
      if (e.data.type === "tick") {
        this.meter.tick();
      }
    };

    this.webglWorker.onerror = (e) => {
      throw e;
    };

    this.dataWorkerStream = [];
    this.dataWorker = new Worker(new URL("data-processor-worker-038ae6ec-e8ed0cde.js", import.meta.url),
      { type: "module" }
    );
    this.dataWorker.onmessage = (message) => {
      if (message.data.type === "getClosestPoint") {
        if (message.data.closestPoint === undefined) {
          return;
        }
        this.dispatchEvent("pointHovered", message);
      } else if (message.data.type === "getClickPoint") {
        if (message.data.closestPoint === undefined) {
          return;
        }
        this.dispatchEvent("pointClicked", message);
      } else if (
        message.data.type === "selectBox" ||
        message.data.type === "selectLasso"
      ) {
        this.dispatchEvent("onSelectionEnd", message);
        this.dataWorkerStream.push(message);
      }
    };
    this.dataWorker.onerror = (e) => {
      throw e;
    };

    // Needs to be called at the end of addToDOM so mouseReader has correct dimensions to work with
    this.mouseReader.init();
  }

  /**
   * The main method for changing the state of the visualization, such as active tool,
   * viewport, locking axis, or changing the zoom.
   *
   * The format of the options:
   *   lockedX: boolean
   *   lockedY: boolean
   *   viewport: [minX, maxX, minY, maxY] (all Numbers)
   *   currentXRange: [x1, x2] (Numbers that should be within the viewport minX and maxX)
   *   currentYRange: [y1, y2] (Numbers that should be within the viewport minY and maxY)
   *   tool: one of ["pan", "box", "lasso"]
   *
   * @param {Object} options with keys under WebGLVis.POSSIBLE_MOUSE_READER_OPTIONS
   */
  setViewOptions(options) {
    for (const option of this.POSSIBLE_MOUSE_READER_OPTIONS) {
      if (option in options) {
        this.mouseReader[option] = options[option];
      }
    }
    this.sendDrawerState(this.mouseReader.getViewport());
  }

  _setMargins(specification) {
    const styles = getDimAndMarginStyleForSpecification(specification);
    this.parent.style.width = specification.width || DEFAULT_WIDTH;
    this.parent.style.height = specification.height || DEFAULT_HEIGHT;
    this.canvas.style.width = styles.width;
    this.canvas.style.height = styles.height;
    this.canvas.style.margin = styles.margin;

    if (isNaN(styles.width) || isNaN(styles.height)) {
      // Using css calc
      const canvasBox = this.canvas.getBoundingClientRect();
      this.setCanvasSize(canvasBox.width, canvasBox.height);
    } else {
      this.setCanvasSize(styles.width, styles.height);
    }
  }

  /**
   * Set the specification of the visualization, and then render it.
   *
   * @param {Object} specification describing visualization
   * @returns boolean on whether the specification was accepted
   */
  setSpecification(specification) {
    if (!isJSONValid(specification)) {
      return false;
    }

    this._setMargins(specification);
    this.mouseReader.setSpecification(specification);
    this.sendDrawerState(this.mouseReader.getViewport());
    this.webglWorker.postMessage({ type: "specification", specification });
    this.dataWorker.postMessage({ type: "init", specification });
    return true;
  }

  updateSpecification(specification) {
    if (!isJSONValid(specification)) {
      return false;
    }

    this.webglWorker.postMessage({ type: "specification", specification });
    return true;
  }

  /**
   * Send the viewport to the drawer. Use setViewOptions to change the viewport.
   *
   * @param {Object} viewport likely from this.mouseReader.getViewport()
   */
  sendDrawerState(viewport) {
    this.webglWorker.postMessage({ type: "viewport", ...viewport });
  }

  /**
   * Calls render in the drawer.
   */
  forceDrawerRender() {
    this.webglWorker.postMessage({
      type: "render",
      ...this.mouseReader.getViewport(),
    });
  }

  /**
   * Utility method to have data worker call {@link DataProcessor#selectBox} or
   * {@link DataProcessor#selectLasso}.
   *
   * Does not return, posts result to this.dataWorkerStream.
   * @param {Array} points array in format [x1,y1,x2,y2,x3,y3,...]
   *  if points.length == 4, does a box select, if points.length >= 6 does a lasso select
   *    using points as a polygon
   */
  selectPoints(points) {
    if (points.length === 4) {
      this.dataWorker.postMessage({ type: "selectBox", points });
    } else if (points.length >= 6) {
      this.dataWorker.postMessage({ type: "selectLasso", points });
    }
  }

  /**
   * Utility method to have data worker call {@link DataProcessor#getClosestPoint}.
   * Does not return, posts result to this.dataWorkerStream.
   *
   * @param {Array} point to get closest point to
   */
  getClosestPoint(point) {
    this.dataWorker.postMessage({
      type: "getClosestPoint",
      point,
    });
  }

  /**
   * Utility method to have data worker call {@link DataProcessor#getClosestPoint}.
   * Does not return, posts result to this.dataWorkerStream.
   *
   * @param {Array} point to get closest point to
   */
  getClickPoint(point) {
    this.dataWorker.postMessage({
      type: "getClickPoint",
      point,
    });
  }

  /**
   * Initializes the FPS meter.
   */
  initFpsmeter() {
    this.meter = new window.FPSMeter(document.querySelector("footer"), {
      graph: 1,
      heat: 1,
      theme: "light",
      history: 25,
      top: "-20px",
      left: `100px`,
      transform: "translateX(-100%)",
    });
  }

  /**
   * Adds an event listener to visualization on the appropriate component.
   * Current event types that are supported are
   * "zoomIn": fires when user zooms in
   * "zoomOut": fires when user zooms out
   * "pan": fires when user pans
   * "onSelection": fires while user is changing the selection box/lasso
   * "onSelectionEnd": fires when a selection has been completed and the results are in the dataWorkerStream
   * "pointHovered": fires when pointer hovers over a datapoint
   * "pointClicked": fires when pointer clicks on a datapoint
   * "labelClicked": fires when pointer clicks on a label
   *
   * For information on the parameters and functionality see:
   *   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   *
   * @param {String} type
   * @param {Function} listener
   * @param {Object} options
   */
  addEventListener(type, listener, options) {
    this.parent.addEventListener(type, listener, options);
  }

  /**
   * Dispatches an event on the visualization on the appropriate component.
   * @param {String} eventName
   * event name can be one of the following:
   * "pointHovered" - fires when pointer hovers over a datapoint
   * "pointClicked" - fires when pointer clicks on a datapoint
   * "labelClicked" - fires when pointer clicks on a label
   * "onSelectionEnd" - fires when a selection has been completed and the results are in the dataWorkerStream
   * @param {Object} message
   **/
  dispatchEvent(eventName, message) {
    const event = new CustomEvent(eventName, { detail: message });
    this.parent.dispatchEvent(event);
  }

  /**
   * Clears the polygon selection on the visualization
   */
  clearSelection() {
    this.mouseReader.clear();
  }
}

var xhtml$1 = "http://www.w3.org/1999/xhtml";

var namespaces$1 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml$1,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace$1(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces$1.hasOwnProperty(prefix) ? {space: namespaces$1[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit$1(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml$1 && document.documentElement.namespaceURI === xhtml$1
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed$1(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator$1(name) {
  var fullname = namespace$1(name);
  return (fullname.local
      ? creatorFixed$1
      : creatorInherit$1)(fullname);
}

function none$1() {}

function selector$1(selector) {
  return selector == null ? none$1 : function() {
    return this.querySelector(selector);
  };
}

function selection_select$1(select) {
  if (typeof select !== "function") select = selector$1(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array$1(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty$1() {
  return [];
}

function selectorAll$1(selector) {
  return selector == null ? empty$1 : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll$1(select) {
  return function() {
    return array$1(select.apply(this, arguments));
  };
}

function selection_selectAll$1(select) {
  if (typeof select === "function") select = arrayAll$1(select);
  else select = selectorAll$1(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher$1(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher$1(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find$1 = Array.prototype.find;

function childFind$1(match) {
  return function() {
    return find$1.call(this.children, match);
  };
}

function childFirst$1() {
  return this.firstElementChild;
}

function selection_selectChild$1(match) {
  return this.select(match == null ? childFirst$1
      : childFind$1(typeof match === "function" ? match : childMatcher$1(match)));
}

var filter$1 = Array.prototype.filter;

function children$1() {
  return Array.from(this.children);
}

function childrenFilter$1(match) {
  return function() {
    return filter$1.call(this.children, match);
  };
}

function selection_selectChildren$1(match) {
  return this.selectAll(match == null ? children$1
      : childrenFilter$1(typeof match === "function" ? match : childMatcher$1(match)));
}

function selection_filter$1(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse$1(update) {
  return new Array(update.length);
}

function selection_enter$1() {
  return new Selection$1(this._enter || this._groups.map(sparse$1), this._parents);
}

function EnterNode$1(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode$1.prototype = {
  constructor: EnterNode$1,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$1(x) {
  return function() {
    return x;
  };
}

function bindIndex$1(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode$1(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey$1(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode$1(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum$1(node) {
  return node.__data__;
}

function selection_data$1(value, key) {
  if (!arguments.length) return Array.from(this, datum$1);

  var bind = key ? bindKey$1 : bindIndex$1,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$1(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike$1(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike$1(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit$1() {
  return new Selection$1(this._exit || this._groups.map(sparse$1), this._parents);
}

function selection_join$1(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge$1(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order$1() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort$1(compare) {
  if (!compare) compare = ascending$2;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending$2(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call$1() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes$1() {
  return Array.from(this);
}

function selection_node$1() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size$1() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty$1() {
  return !this.node();
}

function selection_each$1(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr$1(name, value) {
  var fullname = namespace$1(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView$1(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style$1(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue$1(this.node(), name);
}

function styleValue$1(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView$1(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove$1(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant$1(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property$1(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove$1 : typeof value === "function"
          ? propertyFunction$1
          : propertyConstant$1)(name, value))
      : this.node()[name];
}

function classArray$1(string) {
  return string.trim().split(/^|\s+/);
}

function classList$1(node) {
  return node.classList || new ClassList$1(node);
}

function ClassList$1(node) {
  this._node = node;
  this._names = classArray$1(node.getAttribute("class") || "");
}

ClassList$1.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd$1(node, names) {
  var list = classList$1(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove$1(node, names) {
  var list = classList$1(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue$1(names) {
  return function() {
    classedAdd$1(this, names);
  };
}

function classedFalse$1(names) {
  return function() {
    classedRemove$1(this, names);
  };
}

function classedFunction$1(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd$1 : classedRemove$1)(this, names);
  };
}

function selection_classed$1(name, value) {
  var names = classArray$1(name + "");

  if (arguments.length < 2) {
    var list = classList$1(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction$1 : value
      ? classedTrue$1
      : classedFalse$1)(names, value));
}

function textRemove$1() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text$1(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove$1 : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove$1() {
  this.innerHTML = "";
}

function htmlConstant$1(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html$1(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove$1 : (typeof value === "function"
          ? htmlFunction$1
          : htmlConstant$1)(value))
      : this.node().innerHTML;
}

function raise$1() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise$1() {
  return this.each(raise$1);
}

function lower$1() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower$1() {
  return this.each(lower$1);
}

function selection_append$1(name) {
  var create = typeof name === "function" ? name : creator$1(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull$1() {
  return null;
}

function selection_insert$1(name, before) {
  var create = typeof name === "function" ? name : creator$1(name),
      select = before == null ? constantNull$1 : typeof before === "function" ? before : selector$1(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove$1() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove$1() {
  return this.each(remove$1);
}

function selection_cloneShallow$1() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep$1() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone$1(deep) {
  return this.select(deep ? selection_cloneDeep$1 : selection_cloneShallow$1);
}

function selection_datum$1(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener$1(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames$1(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove$1(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd$1(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener$1(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on$1(typename, value, options) {
  var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd$1 : onRemove$1;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent$1(node, type, params) {
  var window = defaultView$1(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant$1(type, params) {
  return function() {
    return dispatchEvent$1(this, type, params);
  };
}

function dispatchFunction$1(type, params) {
  return function() {
    return dispatchEvent$1(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch$1(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction$1
      : dispatchConstant$1)(type, params));
}

function* selection_iterator$1() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root$1 = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root$1);
}

function selection_selection$1() {
  return this;
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select$1,
  selectAll: selection_selectAll$1,
  selectChild: selection_selectChild$1,
  selectChildren: selection_selectChildren$1,
  filter: selection_filter$1,
  data: selection_data$1,
  enter: selection_enter$1,
  exit: selection_exit$1,
  join: selection_join$1,
  merge: selection_merge$1,
  selection: selection_selection$1,
  order: selection_order$1,
  sort: selection_sort$1,
  call: selection_call$1,
  nodes: selection_nodes$1,
  node: selection_node$1,
  size: selection_size$1,
  empty: selection_empty$1,
  each: selection_each$1,
  attr: selection_attr$1,
  style: selection_style$1,
  property: selection_property$1,
  classed: selection_classed$1,
  text: selection_text$1,
  html: selection_html$1,
  raise: selection_raise$1,
  lower: selection_lower$1,
  append: selection_append$1,
  insert: selection_insert$1,
  remove: selection_remove$1,
  clone: selection_clone$1,
  datum: selection_datum$1,
  on: selection_on$1,
  dispatch: selection_dispatch$1,
  [Symbol.iterator]: selection_iterator$1
};

function select$1(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root$1);
}

function ascending$3(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function descending(a, b) {
  return a == null || b == null ? NaN
    : b < a ? -1
    : b > a ? 1
    : b >= a ? 0
    : NaN;
}

function bisector$1(f) {
  let compare1, compare2, delta;

  // If an accessor is specified, promote it to a comparator. In this case we
  // can test whether the search value is (self-) comparable. We can’t do this
  // for a comparator (except for specific, known comparators) because we can’t
  // tell if the comparator is symmetric, and an asymmetric comparator can’t be
  // used to test whether a single value is comparable.
  if (f.length !== 2) {
    compare1 = ascending$3;
    compare2 = (d, x) => ascending$3(f(d), x);
    delta = (d, x) => f(d) - x;
  } else {
    compare1 = f === ascending$3 || f === descending ? f : zero$1;
    compare2 = f;
    delta = f;
  }

  function left(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function right(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function center(a, x, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }

  return {left, center, right};
}

function zero$1() {
  return 0;
}

function number$3(x) {
  return x === null ? NaN : +x;
}

const ascendingBisect$1 = bisector$1(ascending$3);
const bisectRight$1 = ascendingBisect$1.right;
const bisectCenter = bisector$1(number$3).center;

const e10$1 = Math.sqrt(50),
    e5$1 = Math.sqrt(10),
    e2$1 = Math.sqrt(2);

function tickSpec(start, stop, count) {
  const step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log10(step)),
      error = step / Math.pow(10, power),
      factor = error >= e10$1 ? 10 : error >= e5$1 ? 5 : error >= e2$1 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}

function ticks$1(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  if (!(count > 0)) return [];
  if (start === stop) return [start];
  const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks = new Array(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
  }
  return ticks;
}

function tickIncrement$1(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  return tickSpec(start, stop, count)[2];
}

function tickStep$1(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  const reverse = stop < start, inc = reverse ? tickIncrement$1(stop, start, count) : tickIncrement$1(start, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

function initRange$1(domain, range) {
  switch (arguments.length) {
    case 0: break;
    case 1: this.range(domain); break;
    default: this.range(range).domain(domain); break;
  }
  return this;
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var constant$2 = x => () => x;

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
}

var rgb$1 = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function numberArray$1(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}

function isNumberArray$1(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function genericArray$1(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date$1(a, b) {
  var d = new Date;
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

function interpolateNumber$1(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

function object$1(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate$1(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA$1 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB$1 = new RegExp(reA$1.source, "g");

function zero$2(b) {
  return function() {
    return b;
  };
}

function one$1(b) {
  return function(t) {
    return b(t) + "";
  };
}

function string$1(a, b) {
  var bi = reA$1.lastIndex = reB$1.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA$1.exec(a))
      && (bm = reB$1.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber$1(am, bm)});
    }
    bi = reB$1.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one$1(q[0].x)
      : zero$2(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolate$1(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$2(b)
      : (t === "number" ? interpolateNumber$1
      : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string$1)
      : b instanceof color ? rgb$1
      : b instanceof Date ? date$1
      : isNumberArray$1(b) ? numberArray$1
      : Array.isArray(b) ? genericArray$1
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object$1
      : interpolateNumber$1)(a, b);
}

function interpolateRound$1(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

function constants$1(x) {
  return function() {
    return x;
  };
}

function number$4(x) {
  return +x;
}

var unit$1 = [0, 1];

function identity$2(x) {
  return x;
}

function normalize$1(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constants$1(isNaN(b) ? NaN : 0.5);
}

function clamper$1(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function(x) { return Math.max(a, Math.min(b, x)); };
}

// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
function bimap$1(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize$1(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize$1(d0, d1), r0 = interpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap$1(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = normalize$1(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight$1(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy$1(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp())
      .unknown(source.unknown());
}

function transformer$1() {
  var domain = unit$1,
      range = unit$1,
      interpolate = interpolate$1,
      transform,
      untransform,
      unknown,
      clamp = identity$2,
      piecewise,
      output,
      input;

  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity$2) clamp = clamper$1(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap$1 : bimap$1;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
  }

  scale.invert = function(y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber$1)))(y)));
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number$4), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate = interpolateRound$1, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity$2, rescale()) : clamp !== identity$2;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}

function continuous$1() {
  return transformer$1()(identity$2, identity$2);
}

function formatDecimal(x) {
  return Math.abs(x = Math.round(x)) >= 1e21
      ? x.toLocaleString("en").replace(/,/g, "")
      : x.toString(10);
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimalParts(1.23) returns ["123", 0].
function formatDecimalParts(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function formatNumerals(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
  this.align = specifier.align === undefined ? ">" : specifier.align + "";
  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === undefined ? undefined : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === undefined ? "" : specifier.type + "";
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
      + (this.trim ? "~" : "")
      + this.type;
};

// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
function formatTrim(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

var formatTypes = {
  "%": (x, p) => (x * 100).toFixed(p),
  "b": (x) => Math.round(x).toString(2),
  "c": (x) => x + "",
  "d": formatDecimal,
  "e": (x, p) => x.toExponential(p),
  "f": (x, p) => x.toFixed(p),
  "g": (x, p) => x.toPrecision(p),
  "o": (x) => Math.round(x).toString(8),
  "p": (x, p) => formatRounded(x * 100, p),
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": (x) => Math.round(x).toString(16).toUpperCase(),
  "x": (x) => Math.round(x).toString(16)
};

function identity$3(x) {
  return x;
}

var map = Array.prototype.map,
    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

function formatLocale(locale) {
  var group = locale.grouping === undefined || locale.thousands === undefined ? identity$3 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
      numerals = locale.numerals === undefined ? identity$3 : formatNumerals(map.call(locale.numerals, String)),
      percent = locale.percent === undefined ? "%" : locale.percent + "",
      minus = locale.minus === undefined ? "−" : locale.minus + "",
      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        trim = specifier.trim,
        type = specifier.type;

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // The "" type, and any invalid type, is an alias for ".12~g".
    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision === undefined ? 6
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
        var valueNegative = value < 0 || 1 / value < 0;

        // Perform the initial formatting.
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

        // Trim insignificant zeros.
        if (trim) value = formatTrim(value);

        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

var locale;
var format;
var formatPrefix;

defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

function precisionFixed$1(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionPrefix$1(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
}

function tickFormat$1(start, stop, count, specifier) {
  var step = tickStep$1(start, stop, count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix$1(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed$1(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

function linearish$1(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks$1(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat$1(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) count = 10;

    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    
    while (maxIter-- > 0) {
      step = tickIncrement$1(start, stop, count);
      if (step === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }

    return scale;
  };

  return scale;
}

function linear$2() {
  var scale = continuous$1();

  scale.copy = function() {
    return copy$1(scale, linear$2());
  };

  initRange$1.apply(scale, arguments);

  return linearish$1(scale);
}

function identity$4(x) {
  return x;
}

var top$1 = 1,
    right$1 = 2,
    bottom$1 = 3,
    left$1 = 4,
    epsilon$1 = 1e-6;

function translateX$1(x) {
  return "translate(" + x + ",0)";
}

function translateY$1(y) {
  return "translate(0," + y + ")";
}

function number$5(scale) {
  return d => +scale(d);
}

function center$1(scale, offset) {
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
  if (scale.round()) offset = Math.round(offset);
  return d => +scale(d) + offset;
}

function entering$1() {
  return !this.__axis;
}

function axis$1(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3,
      offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
      k = orient === top$1 || orient === left$1 ? -1 : 1,
      x = orient === left$1 || orient === right$1 ? "x" : "y",
      transform = orient === top$1 || orient === bottom$1 ? translateX$1 : translateY$1;

  function axis(context) {
    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$4) : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        range = scale.range(),
        range0 = +range[0] + offset,
        range1 = +range[range.length - 1] + offset,
        position = (scale.bandwidth ? center$1 : number$5)(scale.copy(), offset),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text");

    path = path.merge(path.enter().insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "currentColor"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line")
        .attr("stroke", "currentColor")
        .attr(x + "2", k * tickSizeInner));

    text = text.merge(tickEnter.append("text")
        .attr("fill", "currentColor")
        .attr(x, k * spacing)
        .attr("dy", orient === top$1 ? "0em" : orient === bottom$1 ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context)
          .attr("opacity", epsilon$1)
          .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform"); });

      tickEnter
          .attr("opacity", epsilon$1)
          .attr("transform", function(d) { var p = this.parentNode.__axis; return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset); });
    }

    tickExit.remove();

    path
        .attr("d", orient === left$1 || orient === right$1
            ? (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1)
            : (tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1));

    tick
        .attr("opacity", 1)
        .attr("transform", function(d) { return transform(position(d) + offset); });

    line
        .attr(x + "2", k * tickSizeInner);

    text
        .attr(x, k * spacing)
        .text(format);

    selection.filter(entering$1)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", orient === right$1 ? "start" : orient === left$1 ? "end" : "middle");

    selection
        .each(function() { this.__axis = position; });
  }

  axis.scale = function(_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function() {
    return tickArguments = Array.from(arguments), axis;
  };

  axis.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function(_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  axis.offset = function(_) {
    return arguments.length ? (offset = +_, axis) : offset;
  };

  return axis;
}

function axisTop$1(scale) {
  return axis$1(top$1, scale);
}

function axisRight$1(scale) {
  return axis$1(right$1, scale);
}

function axisBottom$1(scale) {
  return axis$1(bottom$1, scale);
}

function axisLeft$1(scale) {
  return axis$1(left$1, scale);
}

function isObject(object) {
  return typeof object === "object" && Array.isArray(object) === false;
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

const parseMargins = (margins) => {
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

const getTextWidth = (text, fontSize = "16px") => {
  // Create a temporary SVG to measure the text width
  const svg = select$1("body").append("svg");
  const textNode = svg.append("text").style("font-size", fontSize).text(text);
  const width = textNode.node().getBBox().width;
  svg.remove();
  return width;
};

const createTooltip = (container, text, posX, posY) => {
  let tooltip = d3
    .select(container)
    .append("div")
    .attr("id", "tooltip")
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

const removeTooltip = (container) => {
  const tooltip = select$1(container).select("#tooltip");

  if (tooltip) {
    tooltip.remove();
  }
};

const DEFAULT_ROW_MAX_LABEL_LENGTH_ALLOWED = 15;
const DEFAULT_COLUMN_MAX_LABEL_LENGTH_ALLOWED = 30;
const DEFAULT_ROW_LABEL_SLINT_ANGLE = 0;
const DEFAULT_COLUMN_LABEL_SLINT_ANGLE = 0;
const DEFAULT_ROW_LABEL_FONT_SIZE = "7px";
const DEFAULT_COLUMN_LABEL_FONT_SIZE = "7px";
const DEFAULT_VISIBLE_RANGE = [-1, 1];

const LABELS_MARGIN_BUFFER_IN_PX = 20;
const INTENSITY_LEGEND_LABEL_SIZE_IN_PX = 25;
const INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX = 20;
const INTENSITY_LEGEND_SIZE_IN_PX =
  INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX + INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
const GROUPING_LEGEND_SIZE_IN_PX = 20;

/**
 * Base class for all matrix like layout plots.
 * This class is not to be used directly.
 *
 * Developers should implement `generateSpec`
 * method in their extensions.
 *
 * @class BaseGL
 */
class BaseGL {
  /**
   * Creates an instance of BaseGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof BaseGL
   */
  constructor(selectorOrElement) {
    this.elem = selectorOrElement;
    // Default legend position
    this.legendPosition = "bottom";
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
      opacity: 1,
      color: "#3182bd",
      xgap: 0.3,
      ygap: 0.3,
    };

    //Default Data for labelOptions
    this.labelOptions = {
      rowLabelMaxCharacters: DEFAULT_ROW_MAX_LABEL_LENGTH_ALLOWED,
      columnLabelMaxCharacters: DEFAULT_COLUMN_MAX_LABEL_LENGTH_ALLOWED,
      rowLabelSlintAngle: DEFAULT_ROW_LABEL_SLINT_ANGLE,
      columnLabelSlintAngle: DEFAULT_COLUMN_LABEL_SLINT_ANGLE,
      rowLabelFontSize: DEFAULT_ROW_LABEL_FONT_SIZE,
      columnLabelFontSize: DEFAULT_COLUMN_LABEL_FONT_SIZE,
    };

    // private properties
    this._renderCount = 0;

    // add events
    var self = this;
    this.plot.addEventListener("onSelectionEnd", (e) => {
      e.preventDefault();
      const sdata = e.detail.data;
      if (
        this.highlightEnabled &&
        sdata &&
        sdata.selection.indices.length > 0
      ) {
        this.highlightIndices(sdata.selection.indices, null, true);
      }

      self.selectionCallback(e.detail.data);
    });

    this.plot.addEventListener("zoomIn", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();
    });

    this.plot.addEventListener("zoomOut", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();
    });

    this.plot.addEventListener("pan", (e) => {
      const viewport = e.detail.viewport;

      this.viewport = viewport;
      this.renderRowGroupingLegend();
      this.renderColumnGroupingLegend();
    });

    this.highlightedIndices = [];
    this.indexStates = {};
  }

  /**
   * abstract generateSpec method
   *
   * Developers should implement `generateSpec`
   * method in their extensions.
   *
   * @memberof BaseGL
   */
  generateSpec() {
    throw `Method: generateSpec() not implemented, can't use Heatmap directly, use either dotplot, rectplot or tickplot`;
  }

  /**
   * Internal method that defines the spec for each encoding
   *
   * @param {object} spec, the specification object
   * @param {string} attribute, attribute to set in the specification
   * @param {Array|int|string} value, value can be either an array of values or singular (int, string).
   * @memberof BaseGL
   */
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

  _generateSpecForLabels(spec) {
    const {
      rowLabelMaxCharacters,
      columnLabelMaxCharacters,
      rowLabelSlintAngle,
      columnLabelSlintAngle,
      rowLabelFontSize,
      columnLabelFontSize,
    } = this.labelOptions;

    let labels = null;
    let maxWidth = 0;

    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];
      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        const truncatedLabel =
          this.input["xlabels"][ilx].length > columnLabelMaxCharacters
            ? this.input["xlabels"][ilx].substring(
                0,
                columnLabelMaxCharacters - 3
              ) + "..."
            : this.input["xlabels"][ilx];
        const truncatedLabelWidth = getTextWidth(
          truncatedLabel,
          columnLabelFontSize
        );

        maxWidth = Math.max(maxWidth, truncatedLabelWidth);
        labels.push({
          x: -1.02 + (2 * ilx + 1) / xlabels_len,
          y: 1.05,
          type: "row",
          index: ilx,
          text: truncatedLabel,
          fixedY: true,
          "text-anchor": "center",
          "font-size": columnLabelFontSize,
          transformRotate: columnLabelSlintAngle,
        });
      }
    }

    const topMarginToAccountForLabels = maxWidth + LABELS_MARGIN_BUFFER_IN_PX;

    if ("ylabels" in this.input && this.input["ylabels"] !== null) {
      if (labels === null) {
        labels = [];
      }
      const ylabels_len = this.input["ylabels"].length;
      for (let ily = 0; ily < ylabels_len; ily++) {
        const truncatedLabel =
          this.input["ylabels"][ily].length > rowLabelMaxCharacters
            ? this.input["ylabels"][ily].substring(
                0,
                rowLabelMaxCharacters - 3
              ) + "..."
            : this.input["ylabels"][ily];
        const truncatedLabelWidth = getTextWidth(
          truncatedLabel,
          rowLabelFontSize
        );
        maxWidth = Math.max(maxWidth, truncatedLabelWidth);
        labels.push({
          x: -1.05,
          y: -1.02 + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: truncatedLabel,
          fixedX: true,
          "text-anchor": "end",
          "font-size": rowLabelFontSize,
          transformRotate: rowLabelSlintAngle,
        });
      }
    }

    const leftMarginToAccountForLabels = maxWidth + LABELS_MARGIN_BUFFER_IN_PX;

    if (labels !== null) {
      spec["labels"] = labels;
    }

    spec["margins"] = {
      ...spec["margins"],
      top: `${topMarginToAccountForLabels}px`,
      left: `${leftMarginToAccountForLabels}px`,
      right: "20px",
    };
  }

  /**
   * Calculate bounds for the visualization.
   *
   * @return {object} object containing x and y bounds.
   * @memberof BaseGL
   */
  calcBounds() {
    let xBound = [-0.5, this.xDomain[1] + 0.5];
    // Math.max(...this.xDomain.map((a) => Math.abs(a)));
    let yBound = [-0.5, this.yDomain[1] + 0.5];

    return { xBound, yBound };
  }

  /**
   * Set the input data for the visualization
   *
   * @param {object} data, input data to set
   * @param {Array} data.x, x coordinates
   * @param {Array} data.y, y coordinates
   * @param {Array} data.xlabels, labels along the x-axis
   * @param {Array} data.ylabels, labels along the y-axis
   * @memberof BaseGL
   */
  setInput(data) {
    if (
      isObject(data) &&
      "x" in data &&
      "y" in data &&
      data.x.length === data.y.length
    ) {
      if (data?.xlabels && data?.ylabels) {
        this.ncols = data.xlabels?.length;
        this.nrows = data.ylabels?.length;
        this.originalLabelsCombined = [...data.xlabels, ...data.ylabels];
      }

      this.input = { ...this.input, ...data };

      // calc min and max
      let xMinMax = getMinMax(this.input.x);
      let yMinMax = getMinMax(this.input.y);

      // if (xMinMax[0] !== 0) {
      //   throw `x must start from 0`;
      // }

      // if (yMinMax[0] !== 0) {
      //   throw `y must start from 0`;
      // }

      this.xDomain = [0, 0.5];
      if (xMinMax[0] !== xMinMax[1]) {
        xMinMax = xMinMax.map((x, i) =>
          x === 0 ? Math.pow(-1, i + 1) * (xMinMax[i + (1 % 2)] * 0.05) : x
        );

        this.xDomain = [
          xMinMax[0] - Math.abs(0.05 * xMinMax[0]),
          xMinMax[1] + Math.abs(0.05 * xMinMax[1]),
        ];
      }

      this.yDomain = [0, 0.5];
      if (yMinMax[0] !== yMinMax[1]) {
        yMinMax = yMinMax.map((x, i) =>
          x === 0 ? Math.pow(-1, i + 1) * (yMinMax[i + (1 % 2)] * 0.05) : x
        );

        this.yDomain = [
          yMinMax[0] - Math.abs(0.05 * yMinMax[0]),
          yMinMax[1] + Math.abs(0.05 * yMinMax[1]),
        ];
      }

      // if ("xlabels" in data) {
      //   if (data.xlabels.length !== xMinMax[1] + 1) {
      //     throw `Number of x labels provided must be the same as max(x), starting from 0`;
      //   }
      // }

      // if ("ylabels" in data) {
      //   if (data.ylabels.length !== yMinMax[1] + 1) {
      //     throw `Number of y labels provided must be the same as max(y), starting from 0`;
      //   }
      // }
    } else {
      throw `input data must contain x and y attributes`;
    }
  }

  /**
   * Set the state of the visualization.
   *
   * @param {object} encoding, a set of attributes that modify the rendering
   * @param {Array|number} encoding.size, an array of size for each x-y cell or a singular size to apply for all cells.
   * @param {Array|number} encoding.color, an array of colors for each x-y cell or a singular color to apply for all cells.
   * @param {Array|number} encoding.opacity, same as size, but sets the opacity for each cell.
   * @param {Array|number} encoding.xgap, same as size, but sets the gap along x-axis.
   * @param {Array|number} encoding.ygap, same as size, but sets the gap along y-axis.
   * @param {Array} encoding.legendIntensityData, an array of objects containing color, intensity, and label for the legend.
   * e.g  [{color: "#000000", intensity: 1, label: "0.1"}]
   * @memberof BaseGL
   */
  setState(encoding) {
    if ("size" in encoding) {
      // scale size between 5 - 20
      // let tsize = encoding["size"];
      // if (Array.isArray(encoding["size"])) {
      //   let sMinMax = getMinMax(encoding["size"]);
      //   tsize = encoding["size"].map(
      //     (e) => 15 * ((e - sMinMax[0]) / (sMinMax[1] - sMinMax[0])) + 5
      //   );
      // }
      this.state["size"] = encoding["size"];
    }

    if ("color" in encoding) {
      this.state["color"] = encoding["color"];
    }

    if ("opacity" in encoding) {
      this.state["opacity"] = encoding["opacity"];
    }

    if ("xgap" in encoding) {
      this.state["xgap"] = encoding["xgap"];
    }

    if ("ygap" in encoding) {
      this.state["ygap"] = encoding["ygap"];
    }

    if ("intensityLegendData" in encoding) {
      this.intensityLegendData = encoding["intensityLegendData"];
    }

    if ("groupingRowData" in encoding) {
      this.groupingRowData = encoding["groupingRowData"];
    }

    if ("groupingColumnData" in encoding) {
      this.groupingColumnData = encoding["groupingColumnData"];
    }
  }

  /**
   * Set the interaction mode for the rendering.
   * possible values are
   * lasso - make  a lasso selection
   * box - make a box selection
   * pan - pan the plot
   *
   * @param {string} mode, must be either `lasso`, `pan` or `box`
   * @memberof BaseGL
   */
  setInteraction(mode) {
    if (!["lasso", "pan", "box"].includes(mode)) {
      throw `${mode} needs to be one of lasso, pan or box selection`;
    }

    this.plot.setViewOptions({ tool: mode });
  }

  /**
   * Set the legend options for the visualization.
   * @param {string} legentPosition, position of the legend, can be `top`, `bottom`, `left` or `right`
   * @param {DOMElement} legendDomElement, the DOM element to use for the legend
   **/
  setIntensityLegendOptions(legentPosition, legendDomElement, width, height) {
    this.isLegendDomElementProvided = !!legendDomElement;
    this.legendPosition = legentPosition;
    this.legendWidth = width;
    this.legendHeight = height;

    if (!legendDomElement) {
      this.legendDomElement = this.elem.lastChild;
    } else this.legendDomElement = legendDomElement;
  }

  setRowGroupingLegendOptions(
    legendPosition,
    legendDomElement,
    labelDomElement,
    labelOrientation
  ) {
    this.isRowGroupingLegendDomElementProvided = !!legendDomElement;
    this.rowGroupingLegendPosition = legendPosition;
    this.rowGroupingLabelDomElement = labelDomElement;
    this.rowGroupingLabelOrientation = labelOrientation;

    if (!legendDomElement) {
      this.rowGroupingLegendDomElement = this.elem.lastChild;
    } else this.rowGroupingLegendDomElement = legendDomElement;
  }

  setColumnGroupingLegendOptions(
    legendPosition,
    legendDomElement,
    labelDomElement,
    labelOrientation
  ) {
    this.isColumnGroupingLegendDomElementProvided = !!legendDomElement;
    this.columnGroupingLegendPosition = legendPosition;
    this.columnGroupingLabelDomElement = labelDomElement;
    this.columnGroupingLabelOrientation = labelOrientation;

    if (!legendDomElement) {
      this.columnGroupingLegendDomElement = this.elem.lastChild;
    } else this.columnGroupingLegendDomElement = legendDomElement;
  }

  /**
   * Set the label options for the visualization.
   * @param {object} labelOptions, an object containing the label options
   * @param {number} labelOptions.rowLabelMaxCharacters, maximum number of characters to show for row labels
   * @param {number} labelOptions.columnLabelMaxCharacters, maximum number of characters to show for column labels
   * @param {number} labelOptions.rowLabelSlintAngle, slint angle for row labels (default: 0)
   * @param {number} labelOptions.columnLabelSlintAngle, slint angle for column labels (default: 0)
   * @param {string | number} labelOptions.rowLabelFontSize, font size for row labels (default: 7px)
   * @param {string | number} labelOptions.columnLabelFontSize, font size for column labels (default: 7px)
   *
   * @memberof BaseGL
   * @example
   * this.labelOptions = {
   * rowLabelMaxCharacters: 10,
   * columnLabelMaxCharacters: 10,
   * rowLabelSlintAngle: 0,
   * columnLabelSlintAngle: 0,
   * rowLabelFontSize: 7,
   * columnLabelFontSize: 7,
   * }
   * @example
   * this.setLabelOptions({
   * rowLabelMaxCharacters: 10,
   *  columnLabelMaxCharacters: 10,
   * rowLabelSlintAngle: 0,
   * columnLabelSlintAngle: 0,
   * rowLabelFontSize: "7px",
   * columnLabelFontSize: "7em",
   * })
   **/
  setLabelOptions(labelOptions) {
    this.labelOptions = {
      ...this.labelOptions,
      ...labelOptions,
    };
  }

  /**
   * resize the plot, without having to send the data to the GPU.
   *
   * @param {number} width
   * @param {number} height
   * @memberof BaseGL
   */
  resize(width, height) {
    this.plot.setCanvasSize(width, height);

    // this.render();

    // this.plot.setSpecification(spec);
  }

  /**
   * Attach a callback for window resize events
   *
   * @memberof BaseGL
   */
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

  /**
   * Render the plot. Optionally provide a height and width.
   *
   * @param {?number} width, width of the canvas to render the plot.
   * @param {?number} height, height of the canvas to render the plot.
   * @memberof BaseGL
   */
  render(width, height) {
    var self = this;
    this._spec = this.generateSpec();

    if (width) {
      this._spec.width = width;
    }

    if (height) {
      this._spec.height = height;
    }

    this.updateMarginsToAccountForLegend();

    // Render the legend
    if (this.intensityLegendData && this.legendDomElement) {
      this.renderLegend();
    }

    if (this.groupingRowData && this.rowGroupingLegendDomElement) {
      this.renderRowGroupingLegend();
      this.renderGroupingLabels(
        this.rowGroupingLabelDomElement,
        this.groupingRowData,
        this.rowGroupingLabelOrientation || "vertical"
      );
    }

    if (this.groupingColumnData && this.columnGroupingLegendDomElement) {
      this.renderColumnGroupingLegend();
      this.renderGroupingLabels(
        this.columnGroupingLabelDomElement,
        this.groupingColumnData,
        this.columnGroupingLabelOrientation || "horizontal"
      );
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

      // Only run this code if hi
      if (hdata && hdata.indices.length > 0 && this.nrows) {
        const index = hdata.indices[0]; // handle only one point
        const col = Math.floor(index / this.nrows);
        const row = index % this.nrows;

        // Invert row, considering X axis starts from bottom up
        const rowInverted = this.nrows - 1 - row;
        hdata["row"] = rowInverted;
        hdata["col"] = col;
      }

      if (this.highlightEnabled && hdata && hdata.indices.length > 0) {
        const index = hdata.indices[0];
        const shouldHighlight = !this.indexStates[index]; // reverse the current state
        this.indexStates[index] = shouldHighlight;
        this.highlightIndices([index], shouldHighlight);
      }

      self.clickCallback(hdata);
    });

    this.plot.addEventListener("labelClicked", (e) => {
      e.preventDefault();
      if (this.highlightEnabled && e && e.detail && e.detail.labelObject) {
        const type = e.detail.labelObject.type;
        const index = e.detail.labelObject.index;
        const indices = [];
        if (type === "column") {
          for (let i = index; i < this.ncols * this.nrows; i += this.nrows) {
            indices.push(i);
          }
        } else if (type === "row") {
          for (let i = index * this.nrows; i < (index + 1) * this.nrows; i++) {
            indices.push(i);
          }
        }

        // Decide whether to highlight or unhighlight
        const shouldHighlight = indices.some(
          (index) => !this.indexStates[index]
        );
        indices.forEach((index) => (this.indexStates[index] = shouldHighlight));

        this.highlightIndices(indices, shouldHighlight);
      }
    });

    this.plot.addEventListener("labelHovered", (e) => {
      const hoveredIndex = e.detail.index;
      e.preventDefault();

      createTooltip(
        this.elem,
        this.originalLabelsCombined[hoveredIndex],
        e.detail.event.pageX,
        e.detail.event.pageY
      );
    });

    this.plot.addEventListener("labelUnhovered", (e) => {
      e.preventDefault();
      removeTooltip(this.elem);
    });
  }

  /**
   * Render the legend for the intensity plot.
   * This is used to render the legend for the intensity plot.
   **/
  renderLegend() {
    const position = this.legendPosition;
    // Only render the legend if we have the legend data and the legend dom element
    if (!this.legendDomElement || !this.intensityLegendData) return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerWidth =
      this.legendWidth ||
      this.elem.clientWidth - parsedMargins.left - parsedMargins.right;
    const containerHeight =
      this.legendHeight ||
      this.elem.clientHeight - parsedMargins.top - parsedMargins.bottom;

    const averageCharWidth = 6; // rough estimation of the width of a single character
    const legendWidth = containerWidth - 2 * averageCharWidth;
    const legendHeight = containerHeight - 2 * averageCharWidth;

    // Adjust the SVG size and the legend position according to the position parameter
    let svgWidth, svgHeight, transformX, transformY;
    if (position === "left" || position === "right") {
      svgWidth = INTENSITY_LEGEND_SIZE_IN_PX;
      svgHeight = containerHeight;
      transformY = averageCharWidth;
    } else {
      svgWidth = containerWidth;
      svgHeight = INTENSITY_LEGEND_SIZE_IN_PX;
      transformX = averageCharWidth;
    }

    const svgContainer = d3
      .select(this.legendDomElement)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const defs = svgContainer.append("defs");

    const gradientId = `linear-gradient-${(Math.random() * 1000).toFixed()}`;

    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", position === "left" || position === "right" ? "0%" : "100%")
      .attr("y2", position === "left" || position === "right" ? "100%" : "0%");

    gradient
      .selectAll("stop")
      .data(this.intensityLegendData)
      .enter()
      .append("stop")
      .attr("offset", (d) => d.intensity * 100 + "%")
      .attr("stop-color", (d) => d.color);

    // Create a mapping from intensity to label
    const intensityToLabel = {};
    this.intensityLegendData.forEach((d) => {
      if (d.label !== "") {
        intensityToLabel[d.intensity] = d.label;
      }
    });

    const intensityScale = linear$2()
      .range([
        0,
        position === "left" || position === "right"
          ? legendHeight
          : legendWidth,
      ])
      .domain([0, 1]);

    let legendAxis;
    if (position === "left") {
      legendAxis = axisLeft$1(intensityScale);
      transformX = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "top") {
      legendAxis = axisTop$1(intensityScale);
      transformY = INTENSITY_LEGEND_LABEL_SIZE_IN_PX;
    } else if (position === "right") {
      transformX = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = axisRight$1(intensityScale);
    } else {
      transformY = INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX;
      legendAxis = axisBottom$1(intensityScale);
    }

    legendAxis
      .tickValues(Object.keys(intensityToLabel).map(Number)) // Only use intensities that have labels
      .tickFormat((d) => intensityToLabel[d]); // Use the intensity to label mapping

    svgContainer
      .append("g")
      .attr("transform", `translate(${transformX}, ${transformY})`)
      .call(legendAxis);

    const maxLabelChars = Math.max(
      ...this.intensityLegendData.map((d) => d.label.toString().length)
    ); // length of the longest label

    let rectX, rectY;
    if (position === "top") {
      rectX = averageCharWidth;
      rectY = maxLabelChars * averageCharWidth + 8; // Offset to move gradient down
    } else if (position === "left") {
      rectX = maxLabelChars * averageCharWidth + 8; // Offset to move gradient right
      rectY = averageCharWidth;
    } else if (position === "right") {
      rectY = averageCharWidth;
      rectX = 0;
    } else if (position === "bottom") {
      rectX = averageCharWidth;
      rectY = 0;
    }

    svgContainer
      .append("rect")
      .attr(
        "width",
        position === "left" || position === "right"
          ? INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX
          : legendWidth
      )
      .attr(
        "height",
        position === "left" || position === "right"
          ? legendHeight
          : INTENSITY_LEGEND_GRADIENT_SIZE_IN_PX
      )
      .style("fill", `url(#${gradientId})`)
      .attr("x", rectX)
      .attr("y", rectY);

    // Update margins to account for the legend only if dom element is not provided
    if (!this.isLegendDomElementProvided) {
      // set svg container to position absolute and position value to 0
      svgContainer.style("position", "absolute").style(position, "0px");

      if (position === "right" || position === "left") {
        svgContainer.style("margin-top", parsedMargins.top);
      } else if (position === "top" || position === "bottom") {
        svgContainer.style("margin-left", parsedMargins.left);
      }
    }
  }

  /**
   * Render the row grouping legend.
   * This is used to render the row grouping legend.
   **/
  renderRowGroupingLegend() {
    const position = this.rowGroupingLegendPosition;
    const visibleRange = this.viewport?.yRange || DEFAULT_VISIBLE_RANGE;

    if (
      !this.rowGroupingLegendDomElement ||
      !this.groupingRowData ||
      position === "top" ||
      position === "bottom" ||
      !visibleRange ||
      !visibleRange.length
    )
      return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerHeight =
      this.elem.clientHeight - parsedMargins.top - parsedMargins.bottom;

    const legendWidth = GROUPING_LEGEND_SIZE_IN_PX;
    const totalData = this.nrows; // total number of rows

    const svgWidth = legendWidth;
    const svgHeight = containerHeight;

    select$1(this.rowGroupingLegendDomElement).select("#row-group").remove();

    const svgContainer = select$1(this.rowGroupingLegendDomElement)
      .append("svg")
      .attr("id", "row-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const yScale = linear$2()
      .domain(visibleRange) // Input range is currently visible range
      .range([svgHeight, 0]); // Output range is SVG height

    this.groupingRowData.forEach((group, idx) => {
      const normalizedStart = (group.startIndex * 2) / totalData - 1;
      const normalizedEnd = ((group.endIndex + 1) * 2) / totalData - 1;

      if (
        normalizedEnd >= visibleRange[0] &&
        normalizedStart <= visibleRange[1]
      ) {
        const rectStartInView = Math.max(normalizedStart, visibleRange[0]);
        const rectEndInView = Math.min(normalizedEnd, visibleRange[1]);

        const rectY = yScale(rectEndInView);
        const rectHeight = Math.abs(
          yScale(rectEndInView) - yScale(rectStartInView)
        );

        svgContainer
          .append("rect")
          .attr("x", 0)
          .attr("y", rectY)
          .attr("width", legendWidth)
          .attr("height", rectHeight)
          .style("fill", group.color)
          .on("mouseover", (e) => {
            const text = group.label;
            createTooltip(this.elem, text, e.pageX, e.pageY);
          })
          .on("mouseout", (e) => {
            removeTooltip(this.elem);
          });
      }
    });

    if (!this.isRowGroupingLegendDomElementProvided) {
      svgContainer.style("position", "absolute").style(position, "0px");
      svgContainer.style("margin-top", parsedMargins.top);
    }
  }

  /**
   * Render the column grouping legend.
   * This is used to render the column grouping legend.
   * */
  renderColumnGroupingLegend() {
    const position = this.columnGroupingLegendPosition; // should be 'top' or 'bottom'
    const visibleRange = this.viewport?.xRange || DEFAULT_VISIBLE_RANGE;

    // Only render the legend if we have the legend data, the dom element,
    // the position is either 'top' or 'bottom' and visibleRange exists
    if (
      !this.columnGroupingLegendDomElement ||
      !this.groupingColumnData ||
      position === "left" ||
      position === "right" ||
      !visibleRange ||
      !visibleRange.length
    )
      return;

    const parsedMargins = parseMargins(this._spec.margins);
    const containerWidth =
      this.elem.clientWidth - parsedMargins.left - parsedMargins.right;
    const legendHeight = GROUPING_LEGEND_SIZE_IN_PX;
    const totalData = this.ncols; // total number of columns

    // Adjust the SVG size and the legend position according to the position parameter
    const svgWidth = containerWidth;
    const svgHeight = legendHeight;

    // Clear the svg if it already exists
    select$1(this.columnGroupingLegendDomElement)
      .select("#column-group")
      .remove();

    const svgContainer = select$1(this.columnGroupingLegendDomElement)
      .append("svg")
      .attr("id", "column-group")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("overflow", "visible");

    const xScale = linear$2()
      .domain(visibleRange) // Input range is currently visible range
      .range([0, svgWidth]); // Output range is SVG width

    this.groupingColumnData.forEach((group, idx) => {
      const normalizedStart = (group.startIndex * 2) / totalData - 1;
      const normalizedEnd = ((group.endIndex + 1) * 2) / totalData - 1;

      if (
        normalizedEnd >= visibleRange[0] &&
        normalizedStart <= visibleRange[1]
      ) {
        const rectStartInView = Math.max(normalizedStart, visibleRange[0]);
        const rectEndInView = Math.min(normalizedEnd, visibleRange[1]);

        const rectX = xScale(rectStartInView);
        const rectWidth = Math.abs(
          xScale(rectEndInView) - xScale(rectStartInView)
        );

        svgContainer
          .append("rect")
          .attr("x", rectX)
          .attr("y", 0)
          .attr("width", rectWidth)
          .attr("height", legendHeight)
          .style("fill", group.color)
          .on("mouseover", (e) => {
            const text = group.label;
            createTooltip(this.elem, text, e.pageX, e.pageY);
          })
          .on("mouseout", (e) => {
            removeTooltip(this.elem);
          });
      }
    });

    // Update margins to account for the legend only if dom element is not provided
    if (!this.isColumnGroupingLegendDomElementProvided) {
      // set svg container to position absolute and position value to 0
      svgContainer.style("position", "absolute").style(position, "0px");

      if (position === "right" || position === "left") {
        svgContainer.style("margin-top", parsedMargins.top);
      } else if (position === "top" || position === "bottom") {
        svgContainer.style("margin-left", parsedMargins.left);
      }
    }
  }

  /**
   * Renders the grouping labels for the grouping legend
   * @param {HTMLElement} parentElement - The parent element to render the grouping labels in
   * @param {Array} groupingRowData - The data to render the grouping labels with
   * @param {string} orientation - The orientation of the grouping labels
   * @returns {void}
   **/
  renderGroupingLabels(parentElement, groupingRowData, orientation) {
    const parent = select$1(parentElement);
    const svg = parent.append("svg");

    svg.attr("width", "100%").style("overflow", "inherit");
    if (orientation === "horizontal") {
      svg.attr("height", 25);
    } else {
      svg.attr("height", groupingRowData.length * 25);
    }

    const labelHeight = 25;
    let xOffset = 0;
    let yOffset = 0;

    groupingRowData.forEach((data) => {
      const group = svg.append("g");

      group
        .append("rect")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", data.color);

      group
        .append("text")
        .attr("x", xOffset + 25)
        .attr("y", yOffset + 15)
        .text(data.label);

      if (orientation === "horizontal") {
        xOffset += 25 + data.label.length * 8 + 20;
      } else {
        yOffset += labelHeight;
      }
    });
  }

  /**
   * Update the margins to account for the legend
   */
  updateMarginsToAccountForLegend() {
    const parsedMargins = parseMargins(this._spec.margins);

    const marginsToAddIn = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    if (this.groupingRowData && !this.isRowGroupingLegendDomElementProvided) {
      marginsToAddIn[this.rowGroupingLegendPosition] =
        GROUPING_LEGEND_SIZE_IN_PX;
    }

    if (
      this.groupingColumnData &&
      !this.isColumnGroupingLegendDomElementProvided
    ) {
      marginsToAddIn[this.columnGroupingLegendPosition] =
        GROUPING_LEGEND_SIZE_IN_PX;
    }

    if (this.intensityLegendData && !this.isLegendDomElementProvided) {
      marginsToAddIn[this.legendPosition] = INTENSITY_LEGEND_SIZE_IN_PX;
    }

    this._spec.margins = {
      top: parsedMargins.top + marginsToAddIn.top + "px",
      bottom: parsedMargins.bottom + marginsToAddIn.bottom + "px",
      left: parsedMargins.left + marginsToAddIn.left + "px",
      right: parsedMargins.right + marginsToAddIn.right + "px",
    };
  }

  /**
   * Highlight the indices on the plot.
   * @memberof BaseGL
   * @param {Array} indices, indices to be highlighted.
   * @param {boolean} forceSet, if true, set the indices to be highlighted, else toggle the indices.
   * @example
   * // Highlight indices
   * plot.highlightIndices([1, 2, 3]);
   **/
  highlightIndices(indices, shouldHighlight, forceSet = false) {
    if (forceSet) {
      this.highlightedIndices = [...indices];
      indices.forEach((index) => (this.indexStates[index] = true));
    } else {
      indices.forEach((index) => {
        const foundIndex = this.highlightedIndices.indexOf(index);
        if (!shouldHighlight && foundIndex > -1) {
          this.highlightedIndices.splice(foundIndex, 1);
        } else if (shouldHighlight && foundIndex === -1) {
          this.highlightedIndices.push(index);
        }
      });
    }
    this.highlightedIndicesCallback(this.highlightedIndices);
    this.reRenderOnHighlight();
  }

  /**
   * Enable highlight for the plot. This is useful when the plot is rendered with
   * a subset of data and we want to highlight the points that are not rendered.
   * @memberof BaseGL
   * @example
   * // Enable highlight
   * plot.enableHighlight();
   */
  enableHighlight() {
    this.highlightEnabled = true;
  }

  /**
   * Disable highlight for the plot. This is useful when the plot is rendered with
   * a subset of data and we want to highlight the points that are not rendered.
   * @memberof BaseGL
   * @example
   * // Disable highlight
   * plot.disableHighlight();
   */
  disableHighlight() {
    this.highlightEnabled = false;
    this.clearHighlight();
  }

  /**
   * Clear the highlight for the plot.
   * @memberof BaseGL
   * @example
   * // Clear highlight
   * plot.clearHighlight();
   **/
  clearHighlight() {
    this.highlightedIndices = [];
    this.indexStates = {};
    this.highlightedIndicesCallback(this.highlightedIndices);
    this.reRenderOnHighlight();
  }

  /**
   * Re-render the plot. This is useful when the highlight data is updated.
   * @memberof BaseGL
   */
  reRenderOnHighlight() {
    const opacityData = this.createOpacityArray(
      this._spec.defaultData.color.length,
      this.highlightedIndices
    );
    this._generateSpecForEncoding(this._spec, "opacity", opacityData);
    this.plot.updateSpecification(this._spec);
  }

  /**
   * Create an array of length `length` with the specified indexes set to 1
   * @memberof BaseGL
   * @param {number} length, length of the array
   * @param {Array} indexes, indexes to be set to 1
   * @return {Array} an array of length `length` with the specified indexes set to 1
   **/
  createOpacityArray(length, indexes) {
    // Create an array of length `length` with all values set to 0.4 if indexes are specified else 1
    const arr = new Array(length).fill(indexes.length ? 0.4 : 1);
    for (let i of indexes) {
      arr[i] = 1; // Set the specified indexes to 1
    }
    return arr;
  }

  /**
   * Clear the highlighted indices
   * @memberof BaseGL
   * @return {void}
   * @example
   * clearHighlightedIndices()
   * // clears all the highlighted indices
   */
  clearHighlightedIndices() {
    this.highlightedIndices = [];
    this.reRenderOnHighlight();
  }

  /**
   * Default callback handler when a lasso or box selection is made on the plot
   *
   * @param {object} pointIdxs, an object with points within the selection
   * @return {object} an object with points within the selection
   * @memberof BaseGL
   */
  selectionCallback(pointIdxs) {
    return pointIdxs;
  }

  /**
   * Default callback handler when a point is clicked
   *
   * @param {object} pointIdx, an object with the nearest point to the click event.
   * @return {object} an object with the nearest point to the click event.
   * @memberof BaseGL
   */
  clickCallback(pointIdx) {
    return pointIdx;
  }

  /**
   * Default callback handler when mouse if hovered over the rending
   * provides information on nearest points and their distance.
   *
   * @param {object} pointIdx, points close to range from the mouse
   * @return {object} points close to range from the mouse
   * @memberof BaseGL
   */
  hoverCallback(pointIdx) {
    return pointIdx;
  }

  /**
   * Default callback handler when highlighted indices are updated
   * @return {array} highlighted indices
   * @memberof BaseGL
   * @example
   * highlightedIndicesCallback()
   * // returns highlighted indices
   * // [1, 2, 3]
   * // [4, 5, 6]
   * // [7, 8, 9]
   */
  highlightedIndicesCallback(highlightedIndices) {
    return highlightedIndices;
  }
}

/**
 * Make a DotPlot like plot
 *
 * @class DotplotGL
 * @extends {BaseGL}
 */
class DotplotGL extends BaseGL {
  /**
   * Creates an instance of DotplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof DotplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);
  }

  /**
   * Generate the specification for Dot Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof DotplotGL
   */
  generateSpec() {

    let spec_inputs = {};
    let xlen = getMinMax(this.input.x)[1] + 1,
      ylen = getMinMax(this.input.y)[1] + 1;
    spec_inputs.x = this.input.x.map((e, i) => -1 + (2 * e + 1) / xlen);
    spec_inputs.y = this.input.y.map((e, i) => -1 + (2 * e + 1) / ylen);

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
      defaultData: {
        x: spec_inputs.x,
        y: spec_inputs.y,
      },
      xAxis: "none",
      yAxis: "none",
      tracks: [
        {
          mark: "point",
          x: {
            attribute: "x",
            type: "quantitative",
            domain: [-1, 1],
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: [-1, 1],
          },
          opacity: { value: this.state.opacity },
        },
      ],
    };

    // scale size of dots
    let max_r = getMinMax([198 / (xlen + 1), 198 / (ylen + 1)])[1] - 5;
    let tsize = this.state["size"];
    if (Array.isArray(this.state["size"])) {
      let sMinMax = getMinMax(this.state["size"]);
      tsize = this.state["size"].map(
        (e) => (max_r - 5) * ((e - sMinMax[0]) / (sMinMax[1] - sMinMax[0])) + 5
      );
    }

    this._generateSpecForLabels(spec);
    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", tsize);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
  }
}

/**
 * Class to create traditional heatmap plots
 *
 * @class RectplotGL
 * @extends {BaseGL}
 */
class RectplotGL extends BaseGL {
  /**
   * Creates an instance of RectplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof RectplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    // state
    this.state = {
      size: 20,
      opacity: 0.8,
      color: "#3182bd",
      xgap: 0,
      ygap: 0,
    };
  }

  /**
   * Generate the specification for Rect heatmap Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof RectplotGL
   */
  generateSpec() {
    let xGaps = (i) => {
      return (
        1 +
        (Array.isArray(this.state["xgap"])
          ? this.state["xgap"][i]
          : this.state["xgap"])
      );
    };

    let yGaps = (i) => {
      return (
        1 +
        (Array.isArray(this.state["ygap"])
          ? this.state["ygap"][i]
          : this.state["ygap"])
      );
    };

    let spec_inputs = {};
    spec_inputs.x = this.input.x.map((e, i) => String(e));
    spec_inputs.y = this.input.y.map((e, i) => String(e));

    let default_width = 198 / (getMinMax(this.input.x)[1] + 1);
    let default_height = 198 / (getMinMax(this.input.y)[1] + 1);

    spec_inputs.width = this.input.x.map((e, i) => default_width - xGaps(i));
    spec_inputs.height = this.input.y.map((e, i) => default_height - yGaps(i));

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
      defaultData: {
        x: spec_inputs.x,
        y: spec_inputs.y,
      },
      xAxis: "none",
      yAxis: "none",
      tracks: [
        {
          mark: "rect",
          x: {
            attribute: "x",
            type: "categorical",
            scale: "linear",
            cardinality: getMinMax(this.input.x)[1] + 1,
          },
          y: {
            attribute: "y",
            type: "categorical",
            scale: "linear",
            cardinality: getMinMax(this.input.y)[1] + 1,
          },
          opacity: { value: this.state.opacity },
          width: { value: default_width },
          height: { value: default_height },
        },
      ],
    };

    this._generateSpecForLabels(spec);
    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);
    this._generateSpecForEncoding(spec, "width", spec_inputs.width);
    this._generateSpecForEncoding(spec, "height", spec_inputs.height);

    return spec;
  }
}

/**
 * Class to create tick plots.
 * These are extremely useful for quickly rendering large amounts of data.
 *
 * @class TickplotGL
 * @extends {BaseGL}
 */
class TickplotGL extends BaseGL {
  /**
   * Creates an instance of TickplotGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof TickplotGL
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    // state
    this.state = {
      size: 20,
      opacity: 0.8,
      color: "#3182bd",
      xgap: 0,
      ygap: 0,
    };
  }

  /**
   * Generate the specification for Tick Plots.
   * checkout epiviz.gl for more information.
   *
   * @return {object} a specification object that epiviz.gl can understand
   * @memberof TickplotGL
   */
  generateSpec() {
    let default_width = 198 / (getMinMax(this.input.x)[1] + 1);
    let default_height = 198 / (getMinMax(this.input.y)[1] + 1);

    // config for labels
    let labels = null;
    if ("xlabels" in this.input && this.input["xlabels"] !== null) {
      labels = [];

      const xlabels_len = this.input["xlabels"].length;
      for (let ilx = 0; ilx < xlabels_len; ilx++) {
        labels.push({
          x: -1 + (2 * ilx + 1) / xlabels_len,
          y: 1.05,
          type: "row",
          index: ilx,
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

      const ylabels_len = this.input["ylabels"].length;
      for (let ily = 0; ily < ylabels_len; ily++) {
        labels.push({
          x: -1.1,
          y: -1 + (2 * ily + 1) / ylabels_len,
          type: "column",
          index: ily,
          text: this.input["ylabels"][ily],
          fixedX: true,
          "text-anchor": "end",
        });
      }
    }

    let spec = {
      margins: {
        top: "25px",
        bottom: "50px",
        left: "50px",
        right: "10px",
      },
      defaultData: {
        x: this.input.x,
        y: this.input.y,
      },
      xAxis: "bottom",
      yAxis: "left",
      tracks: [
        {
          mark: "tick",
          x: {
            attribute: "x",
            type: "quantitative",
            domain: getMinMax(this.input.x),
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: getMinMax(this.input.y),
          },
          opacity: { value: this.state.opacity },
          width: { value: default_width },
          height: { value: default_height },
        },
      ],
    };

    if (labels !== null) {
      spec["labels"] = labels;
    }

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    return spec;
  }
}

export { DotplotGL, RectplotGL, TickplotGL };
