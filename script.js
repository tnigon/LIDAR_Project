//=====  Tyler Nigon  ======
//=====  10/17/2015   ======

//IP address of virtual machine where ArcGIS Services can be accessed
var virtualMachine = "54.197.237.185"	
	
//create an ArcGIS API map
require([
	"dojo/dom",
    "dojo/_base/lang",
    "dojo/json",
	"dojo/on",
    "esri/config",
	"esri/InfoTemplate",
    "esri/map",
	"application/bootstrapmap",
	//"esri/layers/ArcGISTiledMapServiceLayer",
    "esri/graphic",
	"esri/request",
    "esri/geometry/Geometry",
    "esri/geometry/Extent",
	"esri/geometry/scaleUtils",
    "esri/SpatialReference",
    "esri/tasks/GeometryService",
    "esri/tasks/AreasAndLengthsParameters",
    "esri/toolbars/draw",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/FillSymbol",
	"esri/renderers/SimpleRenderer",
    "esri/Color",
	"esri/layers/layer",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
	"esri/layers/FeatureLayer",
    "dojo/parser",
	"dojo/sniff",
	"dojo/_base/array",
    "dijit/registry",
    "dojo/domReady!"],
function(dom, lang, json, on, esriConfig, InfoTemplate, Map, BootstrapMap, Graphic, request, Geometry, Extent, scaleUtils, SpatialReference,
    GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
    SimpleLineSymbol, FillSymbol, SimpleRenderer, Color, Layer,
    ArcGISImageServiceLayer, ImageServiceParameters, FeatureLayer, parser, sniff, arrayUtils,
    registry ){
    //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
    //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
    esriConfig.defaults.io.proxyUrl = "/proxy/";
    esriConfig.defaults.io.alwaysUseProxy = false;
    parser.parse();
	var portalUrl = "http://www.arcgis.com"; //a place to store the imported zipped shapefile


    
    // Get a reference to the ArcGIS Map class
    window.map = BootstrapMap.create("mapDiv",{
		center: [-93.0906350,  44.669956],
		zoom: 11,
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
	map.on("load", function() {
		var height = $(window).height();        //Get the height of the browser window
		$('#mapDiv').height(height - 60);  //Resize the mapDiv, with a size of 60 - page height.
		tb = new Draw(map);
		tb.on("load", lang.hitch(map, getAreaAndLength))
		tb.on("draw-end", lang.hitch(map, getAreaAndLength));
		//Add semi-transparent hillshade topo map to aerial basemap; the following link must be changed to reflect the map I made
		hillshade = new esri.layers.ArcGISTiledMapServiceLayer("http://" + virtualMachine.concat(":6080/arcgis/rest/services/LIDAR_basemap_mosaic/MapServer"));
		map.addLayer(hillshade); //add hillshade layer
		hillshade.hide();	//hide hillshade layer on first load - user can toggle it on
		visibleToggle = "false";	//variable that will change based on visibility of hillshade
	});
	
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
	
	//Where is json code?
	
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


	//load the ArcGIS REST GeometryServices
	var geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
	geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

	function getAreaAndLength(evtObj) {
		var map = this,
		geometry = evtObj.geometry;
		map.graphics.clear(); //clears any previous polygon that was drawn
		
		var drawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
		new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
		new Color([255,0,0]), 2),new Color([255,206,56,0.25]))
		drawGraphic = map.graphics.add(new Graphic(geometry, drawSymbol));
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
		tb.deactivate(); //deactivates draw tool after polyon is drawn
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
	}

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
	
	// Enter soil test values into #soilModal, write to webpage, and close modal
	$('#btnSave').click(function() {
		var organicMatter = document.getElementById('organicMatter');
		var phosphorus = document.getElementById('phosphorus');
		dom.byId("OM").innerHTML = "&nbsp;" + organicMatter.value + "%";
		dom.byId("phos").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + phosphorus.value + " ppm";
		$('#soilModal').modal('hide');
		//Call organicMatter.value/phosphorus.value for geoproccessing
	});
	
	
	
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
	
	//show instructions/help menu for this application
	$( "#infoIcon" ).click(function() {
		$( "#instructionSteps" ).toggle( "fast", function() {
		// Animation complete.
		});
	});
	
});