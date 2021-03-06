"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require("./utils/core");

var _constants = require("./utils/constants");

var _eventEmitter = require("event-emitter");

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Figures out the CSS values to apply for a layout
 * @class
 * @param {object} settings
 * @param {string} [settings.layout='reflowable']
 * @param {string} [settings.spread]
 * @param {int} [settings.minSpreadWidth=800]
 * @param {boolean} [settings.evenSpreads=false]
 */
var Layout = function () {
	function Layout(settings) {
		_classCallCheck(this, Layout);

		this.settings = settings;
		this.name = settings.layout || "reflowable";
		this._spread = settings.spread === "none" ? false : true;
		this._minSpreadWidth = settings.minSpreadWidth || 800;
		this._evenSpreads = settings.evenSpreads || false;

		if (settings.flow === "scrolled" || settings.flow === "scrolled-continuous" || settings.flow === "scrolled-doc") {
			this._flow = "scrolled";
		} else {
			this._flow = "paginated";
		}

		this.width = 0;
		this.height = 0;
		this.spreadWidth = 0;
		this.delta = 0;

		this.columnWidth = 0;
		this.gap = 0;
		this.divisor = 1;

		this.props = {
			name: this.name,
			spread: this._spread,
			flow: this._flow,
			width: 0,
			height: 0,
			spreadWidth: 0,
			delta: 0,
			columnWidth: 0,
			gap: 0,
			divisor: 1
		};
	}

	/**
  * Switch the flow between paginated and scrolled
  * @param  {string} flow paginated | scrolled
  */


	_createClass(Layout, [{
		key: "flow",
		value: function flow(_flow) {
			if (typeof _flow != "undefined") {
				if (_flow === "scrolled" || _flow === "scrolled-continuous" || _flow === "scrolled-doc") {
					this._flow = "scrolled";
				} else {
					this._flow = "paginated";
				}
				// this.props.flow = this._flow;
				this.update({ flow: this._flow });
			}
			return this._flow;
		}

		/**
   * Switch between using spreads or not, and set the
   * width at which they switch to single.
   * @param  {string} spread true | false
   * @param  {boolean} min integer in pixels
   */

	}, {
		key: "spread",
		value: function spread(_spread, min) {

			if (_spread) {
				this._spread = _spread === "none" ? false : true;
				// this.props.spread = this._spread;
				this.update({ spread: this._spread });
			}

			if (min >= 0) {
				this._minSpreadWidth = min;
			}

			return this._spread;
		}

		/**
   * Calculate the dimensions of the pagination
   * @param  {number} _width  [description]
   * @param  {number} _height [description]
   * @param  {number} _gap    [description]
   */

	}, {
		key: "calculate",
		value: function calculate(_width, _height, _gap) {

			var divisor = 1;
			var gap = _gap || 0;

			//-- Check the width and create even width columns
			// var fullWidth = Math.floor(_width);
			var width = _width;
			var height = _height;

			var section = Math.floor(width / 12);

			var columnWidth;
			var spreadWidth;
			var pageWidth;
			var delta;

			if (this._spread && width >= this._minSpreadWidth) {
				divisor = 2;
			} else {
				divisor = 1;
			}

			if (this.name === "reflowable" && this._flow === "paginated" && !(_gap >= 0)) {
				gap = section % 2 === 0 ? section : section - 1;
			}

			if (this.name === "pre-paginated") {
				gap = 0;
			}

			//-- Double Page
			if (divisor > 1) {
				// width = width - gap;
				// columnWidth = (width - gap) / divisor;
				// gap = gap / divisor;
				columnWidth = width / divisor - gap;
				pageWidth = columnWidth + gap;
			} else {
				columnWidth = width;
				pageWidth = width;
			}

			if (this.name === "pre-paginated" && divisor > 1) {
				width = columnWidth;
			}

			spreadWidth = columnWidth * divisor + gap;

			delta = width;

			this.width = width;
			this.height = height;
			this.spreadWidth = spreadWidth;
			this.pageWidth = pageWidth;
			this.delta = delta;

			this.columnWidth = columnWidth;
			this.gap = gap;
			this.divisor = divisor;

			// this.props.width = width;
			// this.props.height = _height;
			// this.props.spreadWidth = spreadWidth;
			// this.props.pageWidth = pageWidth;
			// this.props.delta = delta;
			//
			// this.props.columnWidth = colWidth;
			// this.props.gap = gap;
			// this.props.divisor = divisor;

			this.update({
				width: width,
				height: height,
				spreadWidth: spreadWidth,
				pageWidth: pageWidth,
				delta: delta,
				columnWidth: columnWidth,
				gap: gap,
				divisor: divisor
			});
		}

		/**
   * Apply Css to a Document
   * @param  {Contents} contents
   * @return {Promise}
   */

	}, {
		key: "format",
		value: function format(contents) {
			var formating;

			if (this.name === "pre-paginated") {
				formating = contents.fit(this.columnWidth, this.height);
			} else if (this._flow === "paginated") {
				formating = contents.columns(this.width, this.height, this.columnWidth, this.gap);
			} else {
				// scrolled
				formating = contents.size(this.width, null);
			}

			return formating; // might be a promise in some View Managers
		}

		/**
   * Count number of pages
   * @param  {number} totalLength
   * @param  {number} pageLength
   * @return {{spreads: Number, pages: Number}}
   */

	}, {
		key: "count",
		value: function count(totalLength, pageLength) {

			var spreads = void 0,
			    pages = void 0;

			if (this.name === "pre-paginated") {
				spreads = 1;
				pages = 1;
			} else if (this._flow === "paginated") {
				pageLength = pageLength || this.delta;
				spreads = Math.ceil(totalLength / pageLength);
				pages = spreads * this.divisor;
			} else {
				// scrolled
				pageLength = pageLength || this.height;
				spreads = Math.ceil(totalLength / pageLength);
				pages = spreads;
			}

			return {
				spreads: spreads,
				pages: pages
			};
		}
	}, {
		key: "update",
		value: function update(props) {
			var _this = this;

			// Remove props that haven't changed
			Object.keys(props).forEach(function (propName) {
				if (_this.props[propName] === props[propName]) {
					delete props[propName];
				}
			});

			if (Object.keys(props).length > 0) {
				var newProps = (0, _core.extend)(this.props, props);
				this.emit(_constants.EVENTS.LAYOUT.UPDATED, newProps, props);
			}
		}
	}]);

	return Layout;
}();

(0, _eventEmitter2.default)(Layout.prototype);

exports.default = Layout;
module.exports = exports["default"];