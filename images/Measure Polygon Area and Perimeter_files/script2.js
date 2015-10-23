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
			center: [-93, 46.8],
			zoom: 7,
			basemap: "hybrid",
			sliderStyle: "small"
		});

      
      map.on("load", function() {
        tb = new Draw(map);
        tb.on("draw-end", lang.hitch(map, getAreaAndLength));
        //tb.activate(Draw.FREEHAND_POLYGON);
		
		//function addToMap(evt) {			
		//	var symbol;
		//	toolbar.deactivate();
		//	map.showZoomSlider();
        //
		//	//Check to see if there is already a graphic. If so, remove it.
		//	if (graphicExists == 1) {
		//		map.graphics.remove(graphic);
		//		graphicExists = 0;
		//	}			
        //
		//	switch (evt.geometry.type) {
		//		// The following line types are not implememented..
		//		//case "point":
		//		//case "multipoint":
		//		//  symbol = new SimpleMarkerSymbol();
		//		//  break;
		//		//case "polyline":
		//		//  symbol = new SimpleLineSymbol();
		//		//  break;
		//		default:
		//			var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
		//				new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
		//				new Color([255,0,0]), 2),new Color([255,206,56,0.25])
		//			);
		//			break;
		//	}
		//	graphic = new Graphic(evt.geometry, symbol);
		//	graphicExists = 1;
		//	map.graphics.add(graphic);
		//}
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
		
		graphic = map.graphics.add(new Graphic(geometry, symbol));
      
		//setup the parameters for the areas and lengths operation
		var areasAndLengthParams = new AreasAndLengthsParameters();
		areasAndLengthParams.lengthUnit = GeometryService.UNIT_FOOT;
		areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
		areasAndLengthParams.calculationType = "geodesic";
		geometryService.simplify([geometry], function(simplifiedGeometries) {
			areasAndLengthParams.polygons = simplifiedGeometries;
			geometryService.areasAndLengths(areasAndLengthParams);
		});
    }

    function outputAreaAndLength(evtObj) {
      var result = evtObj.result;
      console.log(json.stringify(result));
      dom.byId("area").innerHTML = result.areas[0].toFixed(3) + " acres";
      dom.byId("length").innerHTML = result.lengths[0].toFixed(3) + " feet";
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
  });

//require([
//	"dojo/dom", //calculate area
//	"dojo/_base/lang", //calculate area
//	"dojo/json", //calculate area
//	"esri/config", //calculate area	
//	"esri/map",
//	"esri/toolbars/draw",
//	"esri/geometry/Geometry", //Calculate area
//	"esri/SpatialReference", //calculate area
//	"esri/tasks/GeometryService", //calculate area
//	"esri/tasks/AreasAndLengthsParameters", //calculate area
//    "esri/graphic",
//	
//	"esri/symbols/SimpleFillSymbol",
//	"esri/symbols/SimpleLineSymbol",
//	"esri/symbols/FillSymbol",
//	"esri/Color",
//	//"esri.Geometry",
//	
//	"dijit/registry",
//	"dojo/domReady!"
//	], function (
//	dom, lang, json, esriConfig,
//	Map, Draw, Graphic, Geometry,
//	SpatialReference, GeometryService, AreasAndLengthsParameters,
//	SimpleFillSymbol, SimpleLineSymbol, FillSymbol, Color,
//	//Geometry,
//	registry ) {
//		
//		//identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
//		//If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
//		esriConfig.defaults.io.proxyUrl = "/proxy/"; //calculate geometry
//		esriConfig.defaults.io.alwaysUseProxy = false; //calculate geometry
//	  
//		map = new Map("mapDiv", {
//		//extent: new Extent(-98, -42, -91, 48),
//			center: [-93, 46.8],
//			zoom: 7,
//			basemap: "hybrid",
//			sliderStyle: "small"
//		});
//		
//		//on load, create toolbar and activate geometry
//		map.on("load", function() {
//			toolbar = new Draw(map);
//			toolbar.on("draw-end", addToMap);
//		});
//		
//		//createToolbar function may not need to be a function..
//		//	function createToolbar(themap) {
//		//	toolbar = new Draw(map);
//		//	toolbar.on("draw-end", addToMap);
//			//tb.activate(Draw.FREEHAND_POLYGON);
//		//}
//		
//		var geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
//		geometryService.on("areas-and-lengths-complete", outputArea);
//	
//		//map.on("load", createToolbar, function() {
//		//	var tb = new Draw(map);
//		//	
//		//});
//		
//		function addToMap(evt) {			
//			var symbol;
//			toolbar.deactivate();
//			map.showZoomSlider();
//			
//			var map = this,
//				geometry = evt.geometry;
//			map.graphics.clear(); //not sure if this is needed?
//			
//			//Check to see if there is already a graphic. If so, remove it.
//			if (graphicExists == 1) {
//				map.graphics.remove(graphic);
//				graphicExists = 0;
//			}			
//
//			switch (evt.geometry.type) {
//				// The following line types are not implememented..
//				//case "point":
//				//case "multipoint":
//				//  symbol = new SimpleMarkerSymbol();
//				//  break;
//				//case "polyline":
//				//  symbol = new SimpleLineSymbol();
//				//  break;
//				default:
//					var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
//						new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
//						new Color([255,0,0]), 2),new Color([255,206,56,0.25])
//					);
//					break;
//			}
//			//graphic = new Graphic(evt.geometry, symbol);
//			graphicExists = 1;
//			//map.graphics.add(graphic);
//			//do the above in one line
//			graphic = map.graphics.add(new Graphic(evt.geometry, symbol));
//			
//			//setup the parameters for the areas and lengths operation
//			var areasAndLengthParams = new AreasAndLengthsParameters();
//			//areasAndLengthParams.lengthUnit = GeometryService.UNIT_FOOT;
//			areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
//			areasAndLengthParams.calculationType = "geodesic";
//			geometryService.simplify([geometry], function(simplifiedGeometries) {
//				areasAndLengthParams.polygons = simplifiedGeometries;
//				geometryService.areasAndLengths(areasAndLengthParams);
//			});
//		}
//		
//		function outputArea(evtObj) {
//			var area = evtObj.result;
//			console.log(json.stringify(result));
//			dom.byId("area").innerHTML = result.areas[0].toFixed(3) + " acres";
//			//dom.byId("length").innerHTML = result.lengths[0].toFixed(3) + " feet";
//		}
//		
//		//Add a click handler that lets the user draw a polygon when clicking 
//		//on the div. This is enabled via the html code: onchange:"drawPolygon(this)"
//		window.drawPolygon = function(e){
//			if(e.value=="polygon"){
//				toolbar.activate(Draw["POLYGON"]);
//				//Resets the "Draw Boundary" button so it displays as such again
//				var theText = "Draw Boundary";
//				$("#draw-boundary option:contains(" + theText + ")").attr('selected', 'selected');
//
//			}
//			else if(e.value=="freehand-polygon"){
//				toolbar.activate(Draw["FREEHAND_POLYGON"]);  
//				//Resets the "Draw Boundary" button so it displays as such again
//				var theText = "Draw Boundary";
//				$("#draw-boundary option:contains(" + theText + ")").attr('selected', 'selected');
//			}
//		}
//		
//		//Clear existing polygon from map from clicking "Clear Boundary" button
//		$( "#clear-boundary" ).click(function() {
//			//alert( "This will remove your boundary from the map. Are you sure?" );
//			map.graphics.remove(graphic);
//		});
//		
//		function saveGraphic(graphic) {
//			var json = graphic.geometry.toJson();
//			
//			//send to your service
//		}    
//
//		
//		//ADD IN UNDO/REDO CAPABILITIES. See "myModules/customoperation"
//		graphicExists = 0; //Global variable to determine whether or not to delete current polygon
//		map.on("load", createToolbar);
//	});
//
//