var map, landLyr, utahLyr, pieChart, buffGeom;
require(["esri/map",
         "./Chart-js/Chart.js",
         "esri/graphic",
         "esri/graphicsUtils",
         "esri/geometry/Extent",
         "esri/geometry/geometryEngine",
         "esri/SpatialReference",
         "esri/symbols/SimpleFillSymbol",
         "esri/symbols/SimpleLineSymbol",
         "esri/renderers/SimpleRenderer",
         "esri/toolbars/draw",
         "esri/Color",
         "esri/layers/FeatureLayer",
         "dojo/on",
         "dojo/_base/array",
         "dojo/dom",
         "dojo/domReady!"
], function(Map, Chart, Graphic, graphicsUtils, Extent, geometryEngine, SpatialReference, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Draw, Color, FeatureLayer, on, array, dom) {
   
  //Set up map, layers, and properties    
  var initExtent = new Extent(-12525064, 4509990, -12329386, 4621283, new SpatialReference({wkid:3857}));
  map = new Map("map", {
    basemap: "hybrid",
    extent: initExtent
  });
  on(map, "load", function(){
    map.disableMapNavigation();   
  });
 
  var landUrl = "http://tlamap.trustlands.utah.gov/arcgis/rest/services/UT_SITLA_LandOwnership/MapServer/0";
  var statesUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3";
  landLyr = new FeatureLayer(landUrl, {
    opacity: 0.3,
    definitionExpression: "STATE_LGD = 'Private'"
  });
  utahLyr = new FeatureLayer(statesUrl, {
    definitionExpression: "STATE_NAME = 'Utah'",
    opacity: 0
  });
    
  var pvtRenderer = new SimpleRenderer(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color("black"), 0), new Color([211,222,4,1])));
  landLyr.setRenderer(pvtRenderer);
  map.addLayers([utahLyr, landLyr]);
    
  //Layer symbology    
  var buffSym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 1]), 3), null);
  var buffSymFade = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 0.4]), 10), null);
  var privateSym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([0, 0, 0]), 0), new Color([138, 138, 138, 0.7]));
  var publicSym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([0, 0, 0]), 0), new Color([161, 255, 156, 0.7]));
  var update = 0;
  //map event handlers  
  on(map, "click", createBuffer);
  on(map, "mouse-drag", createBuffer);
  on(map, "update-end", function(){
    update++;
    if(update === 1){
      var fakeEvt = {};
      fakeEvt.mapPoint = map.extent.getCenter();
      createBuffer(fakeEvt);  
    }
  });
  var drawPolygon = new Draw(map, { showTooltips: true });    
  
  function createBuffer(evt){
    if(buffOpt.checked){
      map.graphics.clear();
      var centerPt = evt.mapPoint;
      //Get buffer of map click point
      buffGeom = geometryEngine.geodesicBuffer(centerPt, 10, "miles");
      //check if buffer is completely within Utah
      var within = geometryEngine.within(buffGeom, utahLyr.graphics[0].geometry);
      //check if buffer overlaps Utah    
      var overlaps = geometryEngine.overlaps(buffGeom, utahLyr.graphics[0].geometry);

      if(!within && overlaps){
         //If buffer overlaps Utah, then only get the portion within Utah  
         buffGeom = geometryEngine.intersect(buffGeom, utahLyr.graphics[0].geometry);
      }
      if(!within && !overlaps){
        //If buffer is completely outside Utah, then warn the user
        console.log("outside of utah!");          
        return;
      } 
      map.graphics.add(new Graphic(buffGeom, buffSymFade));

      var privateLand = getPrivateLand(buffGeom);
      var publicLand = getPublicLand(buffGeom, privateLand.geom);
      generateChart(privateLand, publicLand);   
    } else if(drawOpt.checked){
      map.graphics.clear();
    }
    else{
      return;
    }
  }
    
  function getPrivateLand(geom){
    var privateLandGraphics = landLyr.graphics;
    var privateLandGeoms = graphicsUtils.getGeometries(privateLandGraphics);
    //Only work with private land that intersects the buffer (essentially a select by location)  
    var priInBuffer = array.filter(privateLandGeoms, function(item, i){
      if(geometryEngine.intersects(item, geom)){
        return item;
      }
    });
    if (priInBuffer.length > 0){
      //merge all the private land features that intersects buffer into one feature
      var privateUnion = geometryEngine.union(priInBuffer);
      //get intersection of buffer and merge (cookie cutter)
      var privateIntersect = geometryEngine.intersect(privateUnion, geom);
      return {
        geom: privateIntersect,
        area: calcArea(privateIntersect)  //get the area of the private land
      }  
    }
    else{
      return {
        geom: null,
        area: 0
      }
    } 
  }
    
  function getPublicLand(buffer, privateLand){
    if(privateLand){
      //most land that isn't private is public (city, county, state, or federally owned)     
      var publicLand = geometryEngine.difference(buffer, privateLand);
      return {
        geom: publicLand,
        area: calcArea(publicLand)
      }  
    } else {
      return {
        geom: buffer,
        area: calcArea(buffer)
      }
    }
  }

  function calcArea(geom){
    return (Math.round(geometryEngine.geodesicArea(geom, "square-miles")*100) / 100);
  }
    
  function generateChart(pvtData, pubData){
    if(pvtData.geom)
      map.graphics.add(new Graphic(pvtData.geom, privateSym));
    if(pubData.geom)
      map.graphics.add(new Graphic(pubData.geom, publicSym));
    if(!drawOpt.checked)
      map.graphics.add(new Graphic(buffGeom, buffSym));
    if(!pieChart){
      var data = [
      {
        label: "Private (sq mi)",
        value: pvtData.area,
        color: "#8A8A8A",
        highlight: "#B5B5B5"
      },
      {
        label: "Government (sq mi)",
        value: pubData.area,
        color: "#99F095",
        highlight: "#A1FF9C"  
      }
    ];
      
    var opts = {
    segmentShowStroke : true,
    segmentStrokeColor : "#fff",
    segmentStrokeWidth : 2,
    percentageInnerCutout : 0,
    animationSteps : 100,
    animationEasing : "easeOutBounce",
    animateRotate : true,
    animateScale : false 
    };
    
    var ctx = document.getElementById("myChart").getContext("2d");
    pieChart = new Chart(ctx).Pie(data, opts);
    pvtPer.innerHTML = Math.round(10000*pvtData.area / (pubData.area + pvtData.area))/100 + "%";   
    pubPer.innerHTML = Math.round(10000*pubData.area / (pubData.area + pvtData.area))/100 + "%";    
    }
    else{
      //update private land data
      pieChart.segments[0].value = pvtData.area;
      pvtPer.innerHTML = Math.round(10000*pvtData.area / (pubData.area + pvtData.area))/100 + "%";
      //update public land data
      pieChart.segments[1].value = pubData.area;
      pubPer.innerHTML = Math.round(10000*pubData.area / (pubData.area + pvtData.area))/100 + "%";
      pieChart.update();
    }
  }

  var buffOpt = dom.byId("buffOpt");
  var navOpt = dom.byId("navOpt");
  var drawOpt = dom.byId("drawOpt");
  var pvtPer = dom.byId("privatePer");
  var pubPer = dom.byId("publicPer");
    
  on(buffOpt, "click", function(evt){
    if(buffOpt.checked){
      map.disableMapNavigation();
      drawPolygon.deactivate();
    }
  });
    
  on(navOpt, "click", function(evt){
    if(navOpt.checked){
      map.enableMapNavigation();
      drawPolygon.deactivate();
    }
  });
    
  on(drawOpt, "click", function(evt){
    if(drawOpt.checked){
      drawPolygon.activate(Draw.POLYGON);
    }
  });  
    
  on(drawPolygon, "draw-end", function(evt){  
    drawPolygon.deactivate();
    drawPolygon.activate(Draw.POLYGON);
    var geom = evt.geometry;
    if(geom.rings[0].length <= 3){
      alert("Polygon must have at least three vertices.");
      return;
    }
      
    var within = geometryEngine.within(geom, utahLyr.graphics[0].geometry);
    //check if buffer overlaps Utah    
    var overlaps = geometryEngine.overlaps(geom, utahLyr.graphics[0].geometry);
    if(!within && overlaps){
      //If buffer overlaps Utah, then only get the portion within Utah  
      geom = geometryEngine.intersect(geom, utahLyr.graphics[0].geometry);
    }
    if(!within && !overlaps){
      //If buffer is completely outside Utah, then warn the user
      console.log("outside of utah!");          
      return;
    }  
    var privateLand = getPrivateLand(geom);
    var publicLand = getPublicLand(geom, privateLand.geom);
    generateChart(privateLand, publicLand);
  });  
     
  var loading = dom.byId("loadingImg");    
  function showLoading() {
    esri.show(loading);
  }

  function hideLoading(error) {
    esri.hide(loading);
  }
  hideLoading();
//  on(map, "update-end", hideLoading);    
    
});