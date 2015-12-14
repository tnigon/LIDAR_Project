//=====  Tyler Nigon  ======
//=====  10/17/2015   ======

//IP address of virtual machine where ArcGIS Services can be accessed
var virtualMachine = "54.197.237.185"
var gp, map;
var selectionToolbar;	
	
//create an ArcGIS API map
require([
	"dojo/dom", "dojo/dom-construct", "dojo/dom-style", "dojo/json", "dojo/on", "dojo/parser",  "dojo/query",
	"dojo/ready", "dojo/sniff", "dojo/_base/array", "dojo/_base/lang",
	//end of dojo
	
    "esri/config", "esri/map",
	"esri/dijit/FeatureTable",
	"esri/IdentityManager",
	"esri/InfoTemplate",
    
	"application/bootstrapmap",
	//"esri/layers/ArcGISTiledMapServiceLayer",
    "esri/graphic",
	"esri/request",
    "esri/geometry/Geometry",
    "esri/geometry/geometryEngine",
	"esri/geometry/Extent",
	"esri/geometry/scaleUtils",
	"esri/geometry/webMercatorUtils",
	"esri/InfoTemplate",
    "esri/SpatialReference",
    "esri/tasks/FeatureSet", "esri/tasks/GeometryService", "esri/tasks/Geoprocessor",
    "esri/tasks/AreasAndLengthsParameters",
	"esri/tasks/query", 
	"esri/tasks/QueryTask",
	 
    "esri/toolbars/draw",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/FillSymbol",
	"esri/renderers/SimpleRenderer",
    "esri/Color",
	"esri/layers/layer",
	"esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
	"esri/layers/FeatureLayer",
    "dijit/registry", "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
	"dijit/TitlePane", "dijit/form/CheckBox", "dijit/form/ComboBox",
    "dojo/domReady!"],
function(dom, domConstruct, domStyle, json, on, parser, query, ready, sniff, arrayUtils, lang,
	//end of dojo
	
	esriConfig, Map, FeatureTable, IdentityManager, InfoTemplate, BootstrapMap, 
	Graphic, request, Geometry, geometryEngine, Extent, scaleUtils, webMercatorUtils,
	InfoTemplate, SpatialReference, FeatureSet, GeometryService, Geoprocessor,
    AreasAndLengthsParameters, Query, QueryTask, Draw, SimpleFillSymbol,
    SimpleLineSymbol, FillSymbol, SimpleRenderer, Color, Layer, ArcGISDynamicMapServiceLayer,
    ArcGISImageServiceLayer, ImageServiceParameters, FeatureLayer, 
	
    registry ){
	  
	//identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
    //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
    esriConfig.defaults.io.proxyUrl = "/proxy/";
    esriConfig.defaults.io.alwaysUseProxy = false;
    parser.parse(); // Create all dijits.
	var portalUrl = "http://www.arcgis.com"; //a place to store the imported zipped shapefile

	//var map;
	
    // Get a reference to the ArcGIS Map class
    window.map = BootstrapMap.create("mapDiv",{
		//center: [-93.0906350,  44.669956],
		center: [-118.198, 33.805],
		//zoom: 11,
		zoom: 13,
		basemap: "hybrid",
		scrollWheelZoom: true
    });
	
	////create map
    //map = new Map("mapDiv", {
	//	center: [-93.0906350,  44.669956],
	//	zoom: 11,
	//	basemap: "hybrid",
	//	sliderStyle: "small",
	//});

	//on load, initiate draw, getAreaAndLength, and hillshade layer
	map.on("load", initTools);	
	
	function initTools(evtObj) {
		var height = $(window).height();        //Get the height of the browser window
		$('#mapDiv').height(height - 60);  //Resize the mapDiv, with a size of 60 - page height.
		tb = new Draw(map);
		tb.on("load", lang.hitch(map, getAreaAndLength))
		tb.on("draw-end", lang.hitch(map, getAreaAndLength));
		//initFunctionality();
		//Add semi-transparent hillshade topo map to aerial basemap; the following link must be changed to reflect the map I made
		hillshade = new esri.layers.ArcGISTiledMapServiceLayer("http://" + virtualMachine.concat(":6080/arcgis/rest/services/LIDAR_basemap_mosaic/MapServer"));
		map.addLayer(hillshade); //add hillshade layer
		hillshade.hide();	//hide hillshade layer on first load - user can toggle it on
		visibleToggle = "false";	//variable that will change based on visibility of hillshade
	}
	
	map.addLayer("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/1");
//map.on("load", initFunctionality);


//============ Begin import .zip shapefile code ===========================

	on(dom.byId("import-boundary"), "change", function (event) {
		var fileName = event.target.value.toLowerCase();
		if (sniff("ie")) { //filename is full path in IE so extract the file name
			var arr = fileName.split("\\");
			fileName = arr[arr.length - 1];
		}
		if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
			generateFeatureCollection(fileName);
		}
		else {
			dom.byId('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
		}
	});
	
	function generateFeatureCollection (fileName) {
		var name = fileName.split(".");
		//Chrome and IE add c:\fakepath to the value - we need to remove it
		//See this link for more info: http://davidwalsh.name/fakepath
		name = name[0].replace("c:\\fakepath\\", "");
		
		dom.byId('upload-status').innerHTML = '<b>Loading: </b>' + name;
		
		//Define the input params for generate see the rest doc for details
		//http://www.arcgis.com/apidocs/rest/index.html?generate.html
		var params = {
		'name': name,
		'targetSR': map.spatialReference,
		'maxRecordCount': 1000,
		'enforceInputFileSizeLimit': true,
		'enforceOutputJsonSizeLimit': true
		};
    
		//generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
		//This should work well when using web mercator.
		var extent = scaleUtils.getExtentForScale(map, 40000);
		var resolution = extent.getWidth() / map.width;
		params.generalize = true;
		params.maxAllowableOffset = resolution;
		params.reducePrecision = true;
		params.numberOfDigitsAfterDecimal = 0;
		
		var myContent = {
			'filetype': 'shapefile',
			'publishParameters': JSON.stringify(params),
			'f': 'json',
			'callback.html': 'textarea'
		};
	
		//use the rest generate operation to generate a feature collection from the zipped shapefile
		request({
			url: portalUrl + '/sharing/rest/content/features/generate',
			content: myContent,
			form: dom.byId('import-boundary'),
			handleAs: 'json',
			load: lang.hitch(this, function (response) {
				if (response.error) {
					errorHandler(response.error);
					return;
				}
				var layerName = response.featureCollection.layers[0].layerDefinition.name;
				dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
				addShapefileToMap(response.featureCollection);
			}),
			error: lang.hitch(this, errorHandler)
		});
	}
    
	function errorHandler (error) {
		dom.byId('upload-status').innerHTML =
		"<p style='color:red'>" + error.message + "</p>";
	}
    
	function addShapefileToMap (featureCollection) {
		//add the shapefile to the map and zoom to the feature collection extent
		//If you want to persist the feature collection when you reload browser you could store the collection in
		//local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
		//for an example of how to work with local storage.
		var fullExtent;
		var importedLayers = [];
		
		//capability to show attribute information via mouse click
		arrayUtils.forEach(featureCollection.layers, function (importedLayer) {
			var infoTemplate = new InfoTemplate("Details", "${*}");
			var featureLayer = new FeatureLayer(importedLayer, {
				infoTemplate: infoTemplate
			});
			//associate the feature with the popup on click to enable highlight and zoom to
			featureLayer.on('click', function (event) {
				map.infoWindow.setFeatures([event.graphic]);
			});
			//change default symbol if desired. Comment this out and the layer will draw with the default symbology
			changeRenderer(featureLayer);
			fullExtent = fullExtent ?
			fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
			importedLayers.push(featureLayer);
		});
		importedLayersGraphic = map.addLayers(importedLayers);
		visibleLayer = "true";
		map.setExtent(fullExtent.expand(1.05), true);
    
		dom.byId('upload-status').innerHTML = "";
	}
    
	function changeRenderer (importedLayer) {
		//change the default symbol for the feature collection for polygons and points
		var importSymbol = null;
		switch (importedLayer.geometryType) {
			case 'esriGeometryPoint':
			importSymbol = new PictureMarkerSymbol({
				'angle': 0,
				'xoffset': 0,
				'yoffset': 0,
				'type': 'esriPMS',
				'url': 'http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
				'contentType': 'image/png',
				'width': 20,
				'height': 20
			});
			break;
			case 'esriGeometryPolygon':
			importSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
				new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
				new Color([255,0,0]), 2), new Color([255,206,56,0.25]));
			break;
		}
		if (importSymbol) {
			importedLayer.setRenderer(new SimpleRenderer(importSymbol));
		}
	}
//============ End import .zip shapefile code ===========================


//============ Begin draw field boundary code ===========================

	//load the ArcGIS REST GeometryServices
	var geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
	geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

	function getAreaAndLength(evtObj) {
		var map = this,
		geometry = evtObj.geometry;
		map.graphics.clear(); //clears any previous polygon that was drawn
		
		var drawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
		new SimpleLineSymbol("dash", new Color([255,0,0]), 2),
			new Color([255,206,56,0.25]))
		drawGraphic = map.graphics.add(new Graphic(geometry, drawSymbol));
		
		var queryTaskTouches = new QueryTask(drawGraphic); //once graphic is present, get it's query info
		var firstGraphic = null;
		query = new Query();
		//firstGraphic = drawGraphic.featureSet.features[0];
		firstGraphic = drawGraphic;
		var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
		firstGraphic.setSymbol(symbol);
		//firstGraphic.setInfoTemplate(infoTemplate);
		//map.graphics.add(firstGraphic);
		query.geometry = webMercatorUtils.webMercatorToGeographic(drawGraphic.geometry);
		query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
		//drawGraphicExists = 1;
		
		//setup the parameters for the areas and lengths operation
		var areasAndLengthParams = new AreasAndLengthsParameters();
		areasAndLengthParams.lengthUnit = GeometryService.UNIT_FOOT;
		areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
		areasAndLengthParams.calculationType = "geodesic";
		geometryService.simplify([geometry], function(simplifiedGeometries) {
			areasAndLengthParams.polygons = simplifiedGeometries;
			geometryService.areasAndLengths(areasAndLengthParams);
			});
		tb.deactivate(); //deactivates draw tool after polygon is drawn
		map.showZoomSlider();
	}

	//function to display the area and perimeter data from hand-drawn polygon
	function outputAreaAndLength(evtObj) {
		var result = evtObj.result;
		console.log(json.stringify(result));
		dom.byId("area").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + result.areas[0].toFixed(1) + " Ac";
		dom.byId("perimeter").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + result.lengths[0].toFixed(0) + " Ft";
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
	};
//============ End draw field boundary code ===========================


//============ Begin toggle hillshade code ===========================

	//Add a click handler that lets the user toggle the hillshade layer when clicking
	//on the button. This is enabled via the html code: onchange:"toggleHillshade(this)"
	toggleHillshade = function() {
		if(visibleToggle == "false") {
			hillshade.show();
			visibleToggle = "true";
		} else if(visibleToggle == "true") {
			hillshade.hide();
			visibleToggle = "false";
		}
	}
//============ End toggle hillshade code ===========================


//============ Begin clear boundary code ===========================

	//Clear existing polygon from map from clicking "Clear Boundary" button
	$( "#clear-boundary" ).click(function() {
		//alert( "This will remove your boundary from the map. Are you sure?" );
		map.graphics.remove(drawGraphic);
		var organicMatter = 0;
		var phosphorus = 0;
		dom.byId("area").innerHTML = "";
		dom.byId("perimeter").innerHTML = "";
		dom.byId("OM").innerHTML = "";
		dom.byId("phos").innerHTML = "";
	});
//============ End clear boundary code ===========================


//============ Begin soil test value ===========================

	// Enter soil test values into #soilModal, write to webpage, and close modal
	$('#btnSave').click(function() {
		var organicMatter = document.getElementById('organicMatter');
		var phosphorus = document.getElementById('phosphorus');
		dom.byId("OM").innerHTML = "&nbsp;" + organicMatter.value + "%";
		dom.byId("phos").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + phosphorus.value + " ppm";
		$('#soilModal').modal('hide');
		//Call organicMatter.value/phosphorus.value for geoproccessing
	});
//============ End soil test value code ===========================
	
//============ Begin toggle imported layer code ===========================

	////Hide imported polygons from map from clicking "Toggle Imported Layer" button
	//function updateLayerVisibility (importedLayersGraphic) {
	//	var inputs = query(".list_item");
	//	var inputCount = inputs.length;
	//	//in this application layer 2 is always on.
	//	visibleLayerIds = [2];
	//	
	//	for (var i = 0; i < inputCount; i++) {
	//		if (inputs[i].checked) {
	//			visibleLayerIds.push(inputs[i].value);
	//		}
	//	}
	//	
	//	if (visibleLayerIds.length === 0) {
	//		visibleLayerIds.push(-1);
	//		}
	//	
	//	layer.setVisibleLayers(visibleLayerIds);
	//}
		  
	//toggleImportedLayer = function() {
	//	alert (visibleLayer)
	//	if(visibleLayer == "false") {
	//		//updateLayerVisibility ()
	//		importedLayersGraphic.show();
	//		visibleLayer = "true";
	//		alert ("False")
	//		//visibleToggle = "true";
	//	} else if(visibleLayer == "true") {
	//		//updateLayerVisibility ()
	//		importedLayersGraphic.hide();
	//		visibleLayer = "false";
	//		alert ("True")
	//		//visibleToggle = "false";
	//	}
	//}
//============ End toggle imported layer code ===========================

//============ Begin clip code ===========================

	//First, query results
	//$( "#generate-map" ).click(function() {
	function queryByBoundary() {
	
		var queryTask = new QueryTask("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/1");
		//var queryTaskTouches = new QueryTask("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/1");
		//var queryTask = new QueryTask("http://services.arcgis.com/8df8p0NlLFEShl0r/arcgis/rest/services/DakotaQuality2/FeatureServer/0");
		//var queryTaskTouches = new QueryTask("http://services.arcgis.com/8df8p0NlLFEShl0r/arcgis/rest/services/DakotaQuality2/FeatureServer/0");
		
		//var queryTask = new QueryTask("http://services.arcgis.com/8df8p0NlLFEShl0r/arcgis/rest/services/DakotaQuality2/FeatureServer/0");
		//var queryTaskTouches = new QueryTask(drawGraphic);
	
		//identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
		//If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
		esriConfig.defaults.io.proxyUrl = "/proxy/";
		esriConfig.defaults.io.alwaysUseProxy = false;
		
		// Query
		//var query = new Query();
		query.returnGeometry = true;
		query.outFields = [ "*"
		//"OBJECTID", "ID", "GRIDCODE" 
		//"FID", "OBJECTID", "ID", "GRIDCODE", "Shape_Leng", "Shape_Area"
		];
	//	query.outFields = ["POP2000", "POP2007", "MALES", "FEMALES", "FIPS"];
		query.outSpatialReference = {
			"wkid": 102100
		};
		
		var infoTempContent = "Pop 2007 = ${POP2007}<br/>POP2000 = ${POP2000}<br/>MALES = ${MALES}<br/>FEMALES = ${FEMALES}" + "<br/><A href='#' onclick='map.graphics.clear();map.infoWindow.hide();'>Remove Selected Features</A>";
		//var infoTempContent = "Males = ${MALES}" + "<br/><A href='#' onclick='map.graphics.clear();map.infoWindow.hide();'>Remove Selected Features</A>";
		//var infoTempContent = "OBJECTID = ${OBJECTID}<br/>ID = ${ID}<br/>GRIDCODE = ${GRIDCODE}";
		//Create InfoTemplate for styling the result infowindow.
		var infoTemplate = new InfoTemplate("Block: ${FIPS}", infoTempContent);
		//var infoTemplate = new InfoTemplate("Block: ${GRIDCODE}", infoTempContent);
		map.infoWindow.resize(275, 190);
		
		//firstGraphic.setInfoTemplate(infoTemplate); //moved here
		
		var currentClick = null;
		
		// Listen for map onClick event
		//map.on("click", function(evt) {
		//	map.graphics.clear();
		//	map.infoWindow.hide();
		//	currentClick = query.geometry = evt.mapPoint;
		//	query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
		//	queryTask.execute(query);
		//	dom.byId('messages').innerHTML = "<b>1. Executing Point Intersection Query...</b>";
		//});
		
		//Instead of map.on("click.."), run as part of click "generate-map"

	//map.graphics.clear();
		//var queryTaskTouches = new QueryTask(drawGraphic);
		//map.infoWindow.hide();
		//currentClick = query.geometry = evt.mapPoint;
		//query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
		//queryTask.execute(query);
		//dom.byId('messages').innerHTML = "<b>1. Executing Point Intersection Query...</b>";
	
	
		//var firstGraphic = null;
		// Listen for QueryTask onComplete event
		
		//queryTask.on("complete", function(evt) {
			//firstGraphic = evt.featureSet.features[0];
		//	firstGraphic = drawGraphic.featureSet.features[0];
		//	var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
		//	firstGraphic.setSymbol(symbol);
		//	//firstGraphic.setInfoTemplate(infoTemplate);
		//
		//	map.graphics.add(firstGraphic);
		//	query.geometry = webMercatorUtils.webMercatorToGeographic(firstGraphic.geometry);
		//	query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
			//queryTaskTouches.execute(query);
			queryTask.execute(query);
			dom.byId('messages').innerHTML = "<b>2. Executing Polygon Intersects Query...</b>";
		//});
	
		// Listen for QueryTask executecomplete event
		//queryTaskTouches.on("complete", function(evt) {
		queryTask.on("complete", function(evt) {
			var fset = evt.featureSet;
			var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 2), new Color([0, 0, 255, 0.20]));
		
			var resultFeaturesNoClip = fset.features;
			//var resultFeatures = fset.features;
			
			//Then, clip result
			resultFeatures = geometryEngine.clip(resultFeaturesNoClip, drawGraphic);
			//console.log("geometryEngine.clip: %o", resultFeatures);
			
			for (var i = 0, il = resultFeatures.length; i < il; i++) {
				var graphic = resultFeatures[i];
				graphic.setSymbol(symbol);
				graphic.setInfoTemplate(infoTemplate);
				map.graphics.add(graphic);
			}
		
			//map.infoWindow.setTitle("Comparing " + firstGraphic.attributes.FIPS + " census block group with surrounding block groups");
			map.infoWindow.setTitle("Comparing hand-drawn field boundary with surrounding polygons in the quality layer");
			//var content = "<table border='1'><th><td>Selected</td><td>Average Surrounding</td></th>" + "<tr><td>Pop 2007</td><td>" + firstGraphic.attributes.POP2007 + "</td><td>" + average(evt.featureSet, 'POP2007') + "</td></tr>" + "<tr><td>Pop 2000</td><td>" + firstGraphic.attributes.POP2000 + "</td><td>" + average(fset, 'POP2000') + "</td></tr>" + "<tr><td>Males</td><td>" + firstGraphic.attributes.MALES + "</td><td>" + average(fset, 'MALES') + "</td></tr>" + "<tr><td>Females</td><td>" + firstGraphic.attributes.FEMALES + "</td><td>" + average(fset, 'FEMALES') + "</td></tr>" + "</table>";
			//var content = "<table border='1'><th><td>Average Surrounding</td></th>" + "<tr><td>Pop 2007</td><td>" + average(fset, 'MALES') + "</td></tr>" + "</table>"
			//var content = "<table border='1'><th><td>Average Surrounding</td></th>" + "<tr><td>Pop 2007</td><td>" + average(evt.featureSet, 'POP2007') + "</td></tr>" + "<tr><td>Pop 2000</td><td>" + average(fset, 'POP2000') + "</td></tr>" + "<tr><td>Males</td><td>" + average(fset, 'MALES') + "</td></tr>" + "<tr><td>Females</td><td>" + average(fset, 'FEMALES') + "</td></tr>" + "</table>";
			//map.infoWindow.setContent(content);
			//map.infoWindow.show(map.toScreen(currentClick), map.getInfoWindowAnchor(map.toScreen(currentClick)));
		
			dom.byId('messages').innerHTML = "";
		});
		
		//averages all values from a featureset (multiple features)
		function average(fset, att) {
			var features = fset.features;
			var sum = 0;
			var featuresLength = features.length;
			for (var x = 0; x < featuresLength; x++) {
				sum = sum + features[x].attributes[att];
			}
			return Math.round(sum / featuresLength);
		}
	};

document.getElementById ("generate-map").addEventListener ("click", queryByBoundary, false);

//	//the next several functions  are for a geoprocessor task - I'm not sure that this is what I want..
//	function initTools(evtObj) {
//		// Prevent flash of unstyled content(FOUC).
//		domStyle.set(query("body")[0], "visibility", "visible");
//		// Specify where the location of the proxy to use to communicate with the extract GP service.
//		esriConfig.defaults.io.proxyUrl = "/proxy";
//		// Keep a reference to the loading icon DOM node.
//		var loading = dom.byId("loading");
//		gp = new Geoprocessor("http://sampleserver4.arcgisonline.com/ArcGIS/rest/services/HomelandSecurity/Incident_Data_Extraction/GPServer/Extract%20Data%20Task");
//		//gp = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");
//		gp.setOutputSpatialReference({wkid:102100}); 
//		//gp.on("execute-complete", displayResults);
//		gp.returnGeometry = true;
//		gp.outFields = [ "*"];
//	}	
//
//	extractData = function() {
//		//get clip layers
//		var clipLayers = [];
//		clipLayers.push("Incident Areas"); //clipLayers tells it to clip an area
//		
//		//map.graphics.graphics.length indicates the number of queried polygons
//		if ( clipLayers.length === 0 || map.graphics.graphics.length === 0 ) { 
//			alert("Select layers to extract and draw an area of interest.");
//			return;
//		};
//		featureSet = new FeatureSet(); //FeatureSet is a function
//		var features = [];
//		features.push(map.graphics.graphics[0]); //[0] is probably the first hand-drawn polygon
//		featureSet.features = features; //adding hand-drawn poly to featureSet variable
//		
//		var params = {
//			"Layers_to_Clip": clipLayers, //clipLayers tells it to clip an area
//			"Area_of_Interest": featureSet, //tells it to clip based on hand-drawn geometry
//			"Feature_Format": registry.byId("formatBox").get("value")
//		};
//		//submits job to zip file and download it locally
//		domStyle.set(loading, "display", "inline-block");
//		gp.submitJob(params, completeCallback , statusCallback, function(error){
//			alert(error + "   Why is there an error?");
//			domStyle.set(loading, "display", "none");
//		});
//			
//		//If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
//		esriConfig.defaults.io.proxyUrl = "/proxy/";
//		esriConfig.defaults.io.alwaysUseProxy = false;
//		dom.byId('messages').innerHTML = "";
//		
//		var infoTempContent = "Pop 2007 = ${POP2007}<br/>POP2000 = ${POP2000}<br/>MALES = ${MALES}<br/>FEMALES = ${FEMALES}" + "<br/><A href='#' onclick='map.graphics.clear();map.infoWindow.hide();'>Remove Selected Features</A>";
//		var infoTemplate = new InfoTemplate("Block", infoTempContent);
//		map.infoWindow.resize(275, 190);
//		
//		dom.byId('messages').innerHTML = "<b>2. Executing Polygon Intersects Query...</b>";	
//	};
//
//	//document.getElementById ("generate-map").addEventListener ("click", extractData, false);
//	
//	//when job is submitted, zip file is created and downloaded
//	function completeCallback(jobInfo){
//		var imageParams = new esri.layers.ImageParameters();
//		imageParams.imageSpatialReference = map.spatialReference;
//		gp.getResultImageLayer(jobInfo.jobId, "SoilQuality",imageParams, function(gpLayer){
//			gpLayer.setOpacity(0.5);
//			map.addLayer(gpLayer);
//		});
//		if ( jobInfo.jobStatus !== "esriJobFailed" ) {
//			gp.getResultData(jobInfo.jobId, "Output_Zip_File", downloadFile);
//		};
//	};
//	
//	//alerts user if job failed
//	function statusCallback(jobInfo) {
//		var status = jobInfo.jobStatus;
//		if ( status === "esriJobFailed" ) {
//			alert(status + jobInfo);
//			domStyle.set("loading", "display", "none");
//		}
//		else if (status === "esriJobSucceeded"){
//			domStyle.set("loading", "display", "none");
//		}
//	};
//	
//	//subfunction - actually downloads file from url
//	function downloadFile(outputFile){
//		map.graphics.clear();
//		var theurl = outputFile.value.url;  
//		window.location = theurl;
//	};
//	
//	//Add a click handler that generates map and shows it
//	document.getElementById ("generate-map").addEventListener ("click", extractData, false);
//	
//	//Add a click handler that downloads data.
//	//document.getElementById ("download-data").addEventListener ("click", completeCallback, false);


//============ End clip code ===========================	  
	
	//take query results to a premade empty graphics layer

	//Layer is on ArcGis online

	
	
	//$.getJSON("https://drive.google.com/file/d/0B_8rMwwtlIlsd1dCNEJIZ1VsdDA/view?usp=sharing
	//
	//https://dl.dropboxusercontent.com/u/8550761/wilson-library.geojson", function(data) {
	//	new L.GeoJSON(data).addTo(map)
	//// create our basemap layer and add it to the map
	//})
    //
	//function addQuality(){
	//$.getJSON("green-line-eastbound.geojson", function(data){
	//	new L.GeoJSON(data, {
	//		style: {
	//			"color": "green"
	//		}
	//	}).addTo(map)
	//});
	//}; //end of addGreenLine()

//============ End main calculation code ===========================
	
	
	//show instructions/help menu for this application
	$( "#infoIcon" ).click(function() {
		$( "#instructionSteps" ).toggle( "fast", function() {
		// Animation complete.
		});
	});
	
});