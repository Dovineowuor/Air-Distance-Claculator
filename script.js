var map;
var view;
var graphicsLayer;
var calculationHistory = [];

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/geometry/Polyline",
  "esri/geometry/geometryEngine",
  "esri/layers/GraphicsLayer"
], function (Map, MapView, Graphic, Polyline, geometryEngine, GraphicsLayer) {
  map = new Map({
    basemap: "oceans"
  });

  view = new MapView({
    container: "map",
    map: map,
    center: [0, 0],
    zoom: 1
  });

  graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  view.on("pointer-move", function (event) {
    var screenPoint = {
      x: event.x,
      y: event.y
    };

    view.hitTest(screenPoint).then(function (response) {
      var hitResult = response.results[0];

      if (hitResult && hitResult.graphic) {
        var attributes = hitResult.graphic.attributes;
        var longitude = attributes.longitude.toFixed(4);
        var latitude = attributes.latitude.toFixed(4);
        hitResult.graphic.symbol.color = "#FFFF00"; // Yellow color on hover
        hitResult.graphic.symbol.outline.color = "#000000"; // Black outline on hover
        hitResult.graphic.symbol.outline.width = 2;
        hitResult.graphic.symbol.outline.style = "solid";
        hitResult.graphic.symbol.outline.cap = "round";
        hitResult.graphic.symbol.outline.join = "round";
        hitResult.graphic.symbol.outline.miterLimit = 1;

        view.popup.open({
          title: "Location",
          location: view.toMap({ x: event.x, y: event.y }),
          content: "Latitude: " + latitude + "<br>Longitude: " + longitude
        });
      } else {
        view.popup.close();
        graphicsLayer.graphics.forEach(function (graphic) {
          graphic.symbol.color = "#FF0000"; // Red color for the line
          graphic.symbol.outline.color = "#FF0000"; // Red color for the line outline
          graphic.symbol.outline.width = 1;
          graphic.symbol.outline.style = "solid";
          graphic.symbol.outline.cap = "round";
          graphic.symbol.outline.join = "round";
          graphic.symbol.outline.miterLimit = 1;
        });
      }
    });
  });

  function calculateDistance() {
    var pointAInput = document.getElementById("pointA").value;
    var pointBInput = document.getElementById("pointB").value;

    // Validate the input
    if (!pointAInput || !pointBInput) {
      alert("Please provide both coordinates.");
      return;
    }

    var pointA = pointAInput.split(",");
    var pointB = pointBInput.split(",");

    // Convert strings to numbers
    var lat1 = parseFloat(pointA[0]);
    var lon1 = parseFloat(pointA[1]);
    var lat2 = parseFloat(pointB[0]);
    var lon2 = parseFloat(pointB[1]);

    // Calculate the distance
    var distance = getDistance(lat1, lon1, lat2, lon2);

    // Display the result
    var resultElement = document.getElementById("result");
    resultElement.textContent = "Distance: " + distance.toFixed(2) + "km";

    // Store the calculation in history
    var calculation = {
      coordinates: [lat1, lon1, lat2, lon2],
      distance: distance.toFixed(2)
    };
    calculationHistory.push(calculation);

    // Update the map visualization
    updateMap(lat1, lon1, lat2, lon2);
  }

  function getDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the Earth in kilometers

    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    return distance;
  }

  function toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  function updateMap(lat1, lon1, lat2, lon2) {
    // Clear previous graphics
    graphicsLayer.removeAll();

    // Create new polyline and graphics
    var polyline = new Polyline({
      paths: [
        [lon1, lat1],
        [lon2, lat2]
      ]
    });

    var landSymbol = {
      type: "simple-line",
      color: [0, 255, 0],
      width: 2
    };

    var waterSymbol = {
      type: "simple-line",
      color: [0, 0, 255],
      width: 2
    };

    var geometry = geometryEngine.geodesicDensify(polyline, 1000, "kilometers");
    var parts = geometryEngine.cut(geometry, map);

    parts.forEach(function (part) {
      var symbol = part.attributes.cut === "land" ? landSymbol : waterSymbol;

      var graphic = new Graphic({
        geometry: part,
        symbol: symbol
      });

      graphicsLayer.add(graphic);
    });

    // Adjust map extent to fit the graphics
    var extent = polyline.extent.clone();
    extent.expand(1.5);
    view.extent = extent;
  }

  function visualizeOnMap() {
    var pointAInput = document.getElementById("pointA").value;
    var pointBInput = document.getElementById("pointB").value;

    // Validate the input
    if (!pointAInput || !pointBInput) {
      alert("Please provide both coordinates.");
      return;
    }

    var pointA = pointAInput.split(",");
    var pointB = pointBInput.split(",");

    // Convert strings to numbers
    var lat1 = parseFloat(pointA[0]);
    var lon1 = parseFloat(pointA[1]);
    var lat2 = parseFloat(pointB[0]);
    var lon2 = parseFloat(pointB[1]);

    // Update the map visualization
    updateMap(lat1, lon1, lat2, lon2);
  }

  function visualizeHistory() {
    // Clear previous graphics
    graphicsLayer.removeAll();

    // Iterate through the history and visualize each calculation
    calculationHistory.forEach(function (calculation) {
      var coordinates = calculation.coordinates;
      var distance = calculation.distance;

      var lat1 = coordinates[0];
      var lon1 = coordinates[1];
      var lat2 = coordinates[2];
      var lon2 = coordinates[3];

      // Create new polyline and graphics
      var polyline = new Polyline({
        paths: [
          [lon1, lat1],
          [lon2, lat2]
        ]
      });

      var landSymbol = {
        type: "simple-line",
        color: [0, 255, 0],
        width: 2
      };

      var waterSymbol = {
        type: "simple-line",
        color: [0, 0, 255],
        width: 2
      };

      var geometry = geometryEngine.geodesicDensify(polyline, 1000, "kilometers");
      var parts = geometryEngine.cut(geometry, map);

      parts.forEach(function (part) {
        var symbol = part.attributes.cut === "land" ? landSymbol : waterSymbol;

        var graphic = new Graphic({
          geometry: part,
          symbol: symbol
        });

        graphicsLayer.add(graphic);
      });
    });
  }

  // Event listeners
  document.getElementById("calculateButton").addEventListener("click", calculateDistance);
  document.getElementById("visualizeButton").addEventListener("click", visualizeOnMap);
  document.getElementById("visualizeHistoryButton").addEventListener("click", visualizeHistory);

  // Mouse Event listeners
  // Add a listener for the right-click event on the map
  view.on("pointer-down", function (event) {
    if (event.button === 2) { // Check if the right mouse button is clicked
      event.stopPropagation(); // Stop the event from propagating

      var screenPoint = {
        x: event.x,
        y: event.y
      };

      view.hitTest(screenPoint).then(function (response) {
        var hitResult = response.results[0];

        if (hitResult && hitResult.graphic) {
          var attributes = hitResult.graphic.attributes;
          var latitude = attributes.latitude.toFixed(4);
          var longitude = attributes.longitude.toFixed(4);

          // Show the context menu
          showContextMenu(event.x, event.y, latitude, longitude);
        }
      });
    }
  });

  // Show the context menu at the specified screen coordinates
  function showContextMenu(x, y, latitude, longitude) {
    var contextMenu = document.getElementById("context-menu");
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.classList.add("visible");

    // Set the copy geolocation and copy coordinates options
    var copyGeolocationOption = document.getElementById("copy-geolocation-option");
    copyGeolocationOption.setAttribute("data-geolocation", latitude + "," + longitude);

    var copyCoordinatesOption = document.getElementById("copy-coordinates-option");
    copyCoordinatesOption.setAttribute("data-coordinates", latitude + "," + longitude);
  }

  // Copy the selected geolocation
  function copyGeolocation(event) {
    var geolocation = event.target.getAttribute("data-geolocation");
    navigator.clipboard.writeText(geolocation)
      .then(function () {
        console.log("Geolocation copied to clipboard:", geolocation);
      })
      .catch(function (error) {
        console.error("Failed to copy geolocation:", error);
      });
  }

  // Copy the selected coordinates
  function copyCoordinates(event) {
    var coordinates = event.target.getAttribute("data-coordinates");
    navigator.clipboard.writeText(coordinates)
      .then(function () {
        console.log("Coordinates copied to clipboard:", coordinates);
      })
      .catch(function (error) {
        console.error("Failed to copy coordinates:", error);
      });
  }

  // Add event listeners to context menu options
  var copyGeolocationOption = document.getElementById("copy-geolocation-option");
  copyGeolocationOption.addEventListener("click", copyGeolocation);

  var copyCoordinatesOption = document.getElementById("copy-coordinates-option");
  copyCoordinatesOption.addEventListener("click", copyCoordinates);
});
