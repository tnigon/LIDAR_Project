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


//var map = L.map('map-container')
//var mapLocation = [44.971724, -93.24323]; //global variable; array of lat/long;
//var timeZoneName = ''; //global variable
//var offset = 0; //global variable
//var rawOffset = 0; //global variable
////var timezoneInfo = {}; //global variable
//
//function loadMap(){
//	//set the initial view to 44.971724, -93.243239 and zoom level 16
//	map.setView(mapLocation, 16);
//	
//	//add a basemap using the url http://{s}.tile.osm.org/{z}/{x}/{y}.png
//	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//		maxZoom: 18,
//		id: 'mapbox.streets'
//		}).addTo(map);
//
//	// add a box for wilson library
//    $.getJSON("https://dl.dropboxusercontent.com/u/8550761/wilson-library.geojson", function(data) {
//		new L.GeoJSON(data).addTo(map)
//	// create our basemap layer and add it to the map
//	})
//}; //end of loadMap()
//
//function addGreenLine(){
//	$.getJSON("green-line-eastbound.geojson", function(data){
//		new L.GeoJSON(data, {
//			style: {
//				"color": "green"
//			}
//		}).addTo(map)
//	});
//}; //end of addGreenLine()
//
//function addHydrants(){
//	$.getJSON("Hydrants_WGS84.geojson", function(data){
//		new L.GeoJSON(data, {
//			style: function (feature) {
//				return {color: feature.properties.color};
//			},
//			onEachFeature: function (feature, layer) {
//				layer.bindPopup(feature.properties.description);
//			}
//		}).addTo(map)
//	});
//}; //end of addHydrants()
//
////Add the location and current timestamp to the google API url
//function addTimestampToURL(){
//	var now = {timestamp:Date.now()}; //create timestamp variable to determine the timezone
//	var timezoneAPIurl = "https://maps.googleapis.com/maps/api/timezone/json?"
//	timezoneAPIurl += "location=" + mapLocation;
//	var timestamp = now.timestamp
//	var timestamp = timestamp.toString();
//	var timestamp = timestamp.slice(0,10);
//	timezoneAPIurl += "&timestamp=" + timestamp;
//	//window.alert(timezoneAPIurl)
//	return timezoneAPIurl; 
//}; //end of addTimestampToURL()
//
////gets the time zone of var "mapLocation" so local time for that location is reported 
//function getTimezone(timezoneAPIurl) {
//	$.getJSON( timezoneAPIurl , function( data ) {
//		offset = data.dstOffset; //global variable
//		rawOffset = data.rawOffset; //global variable
//		var status = data.status; //status and timeZoneID aren't used
//		var timeZoneID = data.timeZoneID;
//		timeZoneName = data.timeZoneName; //global variable
//	})
//}; //end of getTimezone()
//
////script that is executed when page first loads
//$(window).load(function(){
//	//load map
//	loadMap();
//	
//	//Use JQuery to select the div with class set to red box and
//	//Add a click handler that does something in response to a user clicking on the div
//	$( ".red.box" ).click(function() {
//		alert( "The red box isn't serving any purpose. Let's hide it." );
//		$( ".box" ).hide( "slow" );
//	});
//
//	//request GeoJSON from the url https://dl.dropboxusercontent.com/u/8550761/wilson-library.geojson using JQuery and
//	//add a GeoJSON based layer to the map using the requested GeoJSON
//	$( "#greenLine" ).click(function() {
//		addGreenLine();
//	})
//	
//	//Add Hydrants from mouseclick
//	$( "#hydrants" ).click(function() {
//		addHydrants();
//	})
//	
//	//Load timezone info to get date/time of map being displayed
//	timezoneAPIurl = addTimestampToURL( );
//	getTimezone( timezoneAPIurl );
//	
//	//creates alert for current date/time when button is pressed.
//	$("#dateTime").click(function(){
//		today = getDateTime();
//		todayTimeZone = today+' '+timeZoneName;
//		window.alert(todayTimeZone);
//	});
//	
//	//switch basemap to satellite upon button click
//	$( "#switchBaseLayer" ).click(function() {
//		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ', {
//			maxZoom: 18,
//			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
//				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
//				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
//			id: 'mapbox.satellite'
//		}).addTo(map);
//	});
//}); // end of load function
//
////getDateTime() takes current UTC time and applies daylight savings and dst offsets so local time is reported.
//function getDateTime(){
//	var today = new Date();
//	var dd = today.getDate();
//	var mm = today.getMonth()+1; //Janurary is 0/var yyyy = today.getFullYear();
//	var yyyy = today.getFullYear();
//	var hour = today.getHours();
//	var min = today.getMinutes();
//	var midday = "AM";
//
//	if(dd<10){
//		dd='0'+dd;
//	}
//	
//	if(mm<10){
//		mm='0'+mm;
//	}
//	
//	if(hour>12){
//		hour = hour-12;
//		midday = "PM"
//	};
//	
//	if(min<10){
//		min = '0'+min
//	}
//	var offsetHour = offset/3600; // get daylight savings offset in hours
//	var rawOffsetHour= rawOffset/3600; // get dst offset in hours
//	
//	if(hour+offsetHour+rawOffsetHour<0) {
//		hour = 24-(hour+offsetHour+rawOffsetHour);
//	};
//	today = mm+'/'+dd+'/'+yyyy+' '+(hour+offsetHour+rawOffsetHour)+':'+min+' '+midday;
//	return today; // return string of current time for map position
//};
//
//
//
////switchBaseLayer