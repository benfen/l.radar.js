# l.radar.js

A radar type object for [Leaflet](http://leafletjs.com), a JS mapping tool.  A user can specify the inner radius, outer radius, and the starting and ending angles.

## Usage

Include the radar javasript file:

    <script src="l.radar.js"></script>

After instantiating the map create a new radar object.

    L.radar([50.5, 30.5], {radarDescriptor: L.Radar.radarDescriptor(100, 200, 0, 4)}).addTo(map);;

## API

*Factory method*

    L.ellipse( <LatLng> latlng, <Object> options )

 * latlng  - The position of the center of the radar object.
 * options - Object with radar properties.  Include a radarDescriptor field (as described above) to control the display of the radar object.
