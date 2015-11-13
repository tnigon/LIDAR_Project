//=====  Tyler Nigon  ======
//=====  10/17/2015   ======

//create an ArcGIS API map
require(["dojo/dom",
    "dojo/_base/lang",
    "dojo/json",
    "esri/config",
    "esri/map",
    "esri/graphic",
    "esri/geometry/Geometry",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    "esri/tasks/GeometryService",
    "esri/tasks/AreasAndLengthsParameters",
    "esri/toolbars/draw",
    "esri/symbols/SimpleFillSymbol",
"esri/symbols/SimpleLineSymbol",
"esri/symbols/FillSymbol",
"esri/Color",
"dijit/registry",
"dojo/domReady!"],
function(dom, lang, json, esriConfig, Map, Graphic, Geometry, Extent, SpatialReference, 
	GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
	SimpleLineSymbol, FillSymbol, Color,
	registry ){

	//identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
	//If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
	esriConfig.defaults.io.proxyUrl = "/proxy/";
	esriConfig.defaults.io.alwaysUseProxy = false;
	
	map = new Map("mapDiv", {
	//extent: new Extent(-98, -42, -91, 48),
		center: [-90.606, 44.7225],
		zoom: 17,
		basemap: "hybrid",
		sliderStyle: "small"
	});

	
	map.on("load", function() {
		tb = new Draw(map);
		tb.on("draw-end", lang.hitch(map, getAreaAndLength));
	});
	
	var geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
	geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

	function getAreaAndLength(evtObj) {
		var map = this,
			geometry = evtObj.geometry;
		map.graphics.clear();
	
		var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
			new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
			new Color([255,0,0]), 2),new Color([255,206,56,0.25]))
		
		//graphic = map.graphics.add(new Graphic(geometry, symbol));
		graphicExists = 1;
		
		//setup the parameters for the areas and lengths operation
		var areasAndLengthParams = new AreasAndLengthsParameters();
		areasAndLengthParams.lengthUnit = GeometryService.UNIT_FOOT;
		areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
		areasAndLengthParams.calculationType = "geodesic";
		geometryService.simplify([geometry], function(simplifiedGeometries) {
			areasAndLengthParams.polygons = simplifiedGeometries;
			geometryService.areasAndLengths(areasAndLengthParams);
		});
	tb.deactivate(); //deactivates draw tool after polyon is drawn
	map.showZoomSlider();
	}
	
	function outputAreaAndLength(evtObj) {
		var result = evtObj.result;
		console.log(json.stringify(result));
		dom.byId("area").innerHTML = result.areas[0].toFixed(1) + " acres";
		dom.byId("perimeter").innerHTML = result.lengths[0].toFixed(0) + " feet";
	}

	//Add a click handler that lets the user draw a polygon when clicking 
	//on the div. This is enabled via the html code: onchange:"drawPolygon(this)"
	window.drawPolygon = function(e){
		if(e.value=="polygon"){
			tb.activate(Draw["POLYGON"]);
			//Resets the "Draw Boundary" button so it displays as such again
			var theText = "Draw Boundary";
			$("#draw-boundary option:contains(" + theText + ")").attr('selected', 'selected');
			}
		else if(e.value=="freehand-polygon"){
			tb.activate(Draw["FREEHAND_POLYGON"]);  
			//Resets the "Draw Boundary" button so it displays as such again
			var theText = "Draw Boundary";
			$("#draw-boundary option:contains(" + theText + ")").attr('selected', 'selected');
		}
	}

	//Clear existing polygon from map from clicking "Clear Boundary" button
	$( "#clear-boundary" ).click(function() {
		//alert( "This will remove your boundary from the map. Are you sure?" );
		map.graphics.remove(graphic);
	});
	
	$( "#infoIcon" ).click(function() {	
		$( "#instructionSteps" ).toggle( "fast", function() {
		// Animation complete.
	});
});
});