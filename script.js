//=====  Tyler Nigon  ======
//=====  10/17/2015   ======

//create an ArcGIS API map
require([
	"esri/map",
	"esri/toolbars/draw",
    "esri/graphic",
	
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/FillSymbol",
	"esri/Color",
	"esri.Geometry",
	
	"dijit/registry",
	"dojo/domReady!"
	], function (
	Map, Draw, Graphic, 
	SimpleFillSymbol, SimpleLineSymbol, FillSymbol, Color,
	Geometry,
	registry ) {
		map = new Map("mapDiv", {
		//extent: new Extent(-98, -42, -91, 48),
			center: [-93, 46.8],
			zoom: 7,
			basemap: "hybrid",
			sliderStyle: "small"
		});
		
		function addToMap(evt) {			
			var symbol;
			toolbar.deactivate();
			map.showZoomSlider();

			//Check to see if there is already a graphic. If so, remove it.
			if (graphicExists == 1) {
				map.graphics.remove(graphic);
				graphicExists = 0;
			}			

			switch (evt.geometry.type) {
				// The following line types are not implememented..
				//case "point":
				//case "multipoint":
				//  symbol = new SimpleMarkerSymbol();
				//  break;
				//case "polyline":
				//  symbol = new SimpleLineSymbol();
				//  break;
				default:
					var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
						new Color([255,0,0]), 2),new Color([255,206,56,0.25])
					);
					break;
			}
			graphic = new Graphic(evt.geometry, symbol);
			graphicExists = 1;
			map.graphics.add(graphic);
		}
		
		function createToolbar(themap) {
			
			//$.contains( document.documentElement, document.body );
			//if (document.contains(!!document.getElementsByName("graphic"))) {
			//	map.graphics.remove(graphic);
			//	//document.getElementsByName("graphic").remove();
			//}	
			toolbar = new Draw(map);
			toolbar.on("draw-end", addToMap)
		}
		
		//Add a click handler that lets the user draw a polygon when clicking 
		//on the div. This is enabled via the html code: onchange:"drawPolygon(this)"
		window.drawPolygon = function(e){
			if(e.value=="polygon"){
				toolbar.activate(Draw["POLYGON"]);
				//Resets the "Draw Boundary" button so it displays as such again
				var theText = "Draw Boundary";
				$("#draw-boundary option:contains(" + theText + ")").attr('selected', 'selected');

			}
			else if(e.value=="freehand-polygon"){
				toolbar.activate(Draw["FREEHAND_POLYGON"]);  
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
		
		function saveGraphic(graphic) {
			var json = graphic.geometry.toJson();
			
			//send to your service
		}    

		
		//ADD IN UNDO/REDO CAPABILITIES. See "myModules/customoperation"
		graphicExists = 0; //Global variable to determine whether or not to delete current polygon
		map.on("load", createToolbar);
	});

