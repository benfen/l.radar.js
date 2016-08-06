/*
 * @class Radar
 * @aka L.Radar
 * @inherits Path
 *
 * A class for drawing 'radar' overlays on a map. Extends `Patth`.
 *
 * Shares the same approximation weaknesses as L.Circle and may become inaccurate near the poles
 *
 * @example
 *
 * ```js
 * L.radar([50.5, 30.5], {radarDescriptor: L.Radar.radarDescriptor(100, 200, 0, 4)}).addTo(map);
 * ```
 */
L.Radar = L.Path.extend({
	
	options: {
		fill: true,

		// Default values for the radar object
		radarDescriptor: {
			_minorRadius: 0,
			_majorRadius: 0,
			_startAngle: 0,
			_endAngle: 0
		}
	},

	// @method initialize(latlng: LatLng, options: Object)
	// Performs basic setup for the radar object
	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
		if (options.radarDescriptor.type === "RadarDescriptor") {
			this._radarDescriptor = options.radarDescriptor;
		} else {
			this._radarDescriptor = this.options.radarDescriptor;
		}
	},

	// @method setLatLng(latlng: LatLng): this
	// Sets the position of a circle marker to a new location.
	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		this.redraw();
	},

	// @method getLatLng(): LatLng
	// Returns the current geographical position of the circle marker
	getLatLng: function () {
		return this._latlng;
	},

	// @method setStyle(options: Object): this
	// Sets the style of the radar object based on the given parameters.  Returns this.
	setStyle: function (options) {
		var radarDescriptor = options && options.radarDescriptor || this._radarDescriptor;
		L.Path.prototype.setStyle.call(this, options);
		this.setRadarDescriptor(radarDescriptor);
		return this;
	},

	// @method _project()
	// Projects the radar object onto the map based on the latlng coordinates
	_project: function () {

		// Pretty much all of this logic for projection is ripped from L.circle, as a radar
		// object is essentially two concentric circles
		var lng = this._latlng.lng,
		    lat = this._latlng.lat,
		    map = this._map,
			radarDescriptor = this._radarDescriptor,
			crs = map.options.crs;

		if (crs.distance === L.CRS.Earth.distance) {
			var d = Math.PI / 180,
			    latR = (radarDescriptor._mRadius / L.CRS.Earth.R) / d,
			    top = map.project([lat + latR, lng]),
			    bottom = map.project([lat - latR, lng]),
			    p = top.add(bottom).divideBy(2),
			    lat2 = map.unproject(p).lat,
			    lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
			            (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

			if (isNaN(lngR) || lngR === 0) {
				lngR = latR / Math.cos(Math.PI / 180 * lat);
			}

			this._point = p.subtract(map.getPixelOrigin());
			radarDescriptor._majorRadius = isNaN(lngR) ? 0 : Math.max(Math.round(p.x - map.project([lat2, lng - lngR]).x), 1);

			latR = (radarDescriptor._nRadius / L.CRS.Earth.R) / d;
			top = map.project([lat + latR, lng]);
			bottom = map.project([lat - latR, lng]);
			p = top.add(bottom).divideBy(2);
			lat2 = map.unproject(p).lat;
			lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
			            (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

			if (isNaN(lngR) || lngR === 0) {
				lngR = latR / Math.cos(Math.PI / 180 * lat);
			}

			radarDescriptor._minorRadius = isNaN(lngR) ? 0 : Math.max(Math.round(p.x - map.project([lat2, lng - lngR]).x), 1);
			

		} else {
			var latlng2 = crs.unproject(crs.project(this._latlng).subtract([radarDescriptor._mRadius, 0]));

			this._point = map.latLngToLayerPoint(this._latlng);
			radarDescriptor._majorRadius = this._point.x - map.latLngToLayerPoint(latlng2).x;
		}
		this._point = this._map.latLngToLayerPoint(this._latlng);
		this._updateBounds();
	},

	// @method _updateBounds()
	// Updates the bounding box of the radar.  Uses a square based on the major radius
	_updateBounds: function () {
		var r = this._radarDescriptor._majorRadius,
			w = this._clickTolerance(),
			p = [r + w, r + w];
		this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.subtract(p));
	},

	// @method setRadarDescriptor(radarDescriptor: RadarDescriptor)
	// Sets the descriptor for the radar object
	setRadarDescriptor: function (radarDescriptor) {
		this._radarDescriptor = radarDescriptor;
	},

	// @method getBounds(): LatLngBounds
	// Returns the `LatLngBounds` of the path.
	getBounds: function () {
		return this._bounds;
	},

	// @method _update()
	// Updates the radar object
	_update: function () {
		if (this._map) {
			this._updatePath();
		}
	},

	// @method _updatePath()
	// Updates the path of the radar object in the renderer
	_updatePath: function () {
		this._renderer._setPath(this, this._radarDescriptor.getPath(this._point));
	}
});

// @factory L.radar(latlng: LatLng, options: Object): L.Radar
// Instantiates a radar object given a geographical point, and an optional options object.
L.radar = function (latlng, options) {
	return new L.Radar(latlng, options);
};

// @factory L.Radar.radarDescriptor(minorRadius: Number, majorRadius: Number, startAngle: Number, endAngle: Number): RadarDescriptor
// Creates a new instance of a RadarDescriptor for defining a radar object
L.Radar.radarDescriptor = function (minorRadius, majorRadius, startAngle, endAngle) {
	function RadarDescriptor(minorRadius, majorRadius, startAngle, endAngle) {
		var self = this;
		self._minorRadius = minorRadius || 0;
		self._majorRadius = majorRadius || 0;
		self._mRadius = self._majorRadius;
		self._nRadius = self._minorRadius;
		self._startAngle = startAngle || 0;
		self._endAngle = endAngle || 0;
		self.type = "RadarDescriptor";

		// @method getPath(p: Point): String
		// Gets the SVG path of the radar object
		self.getPath = function(p) {
			var minorRadius = this._minorRadius;
			var majorRadius = this._majorRadius;
			var majorArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
			var firstVertex = {
				x: minorRadius * Math.cos(this._startAngle) + p.x,
				y: minorRadius * Math.sin(this._startAngle) + p.y
			};

			var secondVertex = {
				x: majorRadius * Math.cos(this._startAngle) + p.x,
				y: majorRadius * Math.sin(this._startAngle) + p.y
			};

			var thirdVertex = {
				x: majorRadius * Math.cos(this._endAngle) + p.x,
				y: majorRadius * Math.sin(this._endAngle) + p.y
			};

			var fourthVertex = {
				x: minorRadius * Math.cos(this._endAngle) + p.x,
				y: minorRadius * Math.sin(this._endAngle) + p.y
			};

			return 'M ' + firstVertex.x + ' ' + firstVertex.y + ' ' +
				'L ' + secondVertex.x + ' ' + secondVertex.y + ' ' +
				'A ' + majorRadius + ' ' + majorRadius + ' 0 ' + majorArc + ' 1 ' +
				thirdVertex.x + ' ' + thirdVertex.y + ' ' +
				'L ' + fourthVertex.x + ' ' + fourthVertex.y + ' ' +
				'A ' + minorRadius + ' ' + minorRadius + ' 0 ' + majorArc + ' 0 ' +
				firstVertex.x + ' ' + firstVertex.y;
		}
	}

	return new RadarDescriptor(minorRadius, majorRadius, startAngle, endAngle);
}
