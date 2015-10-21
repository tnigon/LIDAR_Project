//=====  Tyler Nigon  ======
//=====  10/17/2015   ======

//create an ArcGIS API map
require([
	"esri/map",
	"esri/toolbars/draw",
    "esri/graphic",
	"dojo/domReady!"
	], function (
	Map, Draw, Graphic ) {
		map = new Map("mapDiv", {
		//extent: new Extent(-98, -42, -91, 48),
			center: [-93, 46.8],
			zoom: 7,
			basemap: "hybrid",
			sliderStyle: "small"
		});
		
		//map.on("load", createToolbar);
		//
		//// loop through all dijits, connect onClick event
		//// listeners for buttons to activate drawing tools
		//registry.forEach(function(d) {
		//  // d is a reference to a dijit
		//  // could be a layout container or a button
		//  if ( draw.declaredClass === "dijit.form.Button" ) {
		//    d.on("click", activateTool);
		//  }
		//});
		//
		//function activateTool() {
		//  var tool = this.label.toUpperCase().replace(/ /g, "_");
		//  toolbar.activate(Draw[tool]);
		//  map.hideZoomSlider();
		//}
		//
		//function createToolbar(themap) {
		//  toolbar = new Draw(map);
		//  toolbar.on("draw-end", addToMap);
		//}
		//
		//function addToMap(evt) {
		//  var symbol;
		//  toolbar.deactivate();
		//  map.showZoomSlider();
		//  switch (evt.geometry.type) {
		//    case "point":
		//    case "multipoint":
		//      symbol = new SimpleMarkerSymbol();
		//      break;
		//    case "polyline":
		//      symbol = new SimpleLineSymbol();
		//      break;
		//    default:
		//      symbol = new SimpleFillSymbol();
		//      break;
		//  }
		//  var graphic = new Graphic(evt.geometry, symbol);
		//  map.graphics.add(graphic);
		//}
	});

//Add a click handler that lets the user draw a polygon when clicking on the div
$("#draw-boundary").click(function() {
	alert( "This button will be used to draw a polygon on the map!" );
});