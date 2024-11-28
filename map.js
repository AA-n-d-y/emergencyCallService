const accessToken = "AAPTxy8BH1VEsoebNVZXo8HurGWUPfpCnqmtiYOporIn6aReHTWuMzBwJj870WY7-50fnNywKgwy55pAudeX1Fp_erFecK20XrulPEKH08QchSg2tb1wETJwd8rqQ7aLU_aEWeKN7a28QLrXGKoqgYfX2XzTAZcdL1G_tBXuDdSuw-9cAcCZ76mw2IXcXLIdZzBq8chznVeyHaroHSB5xCmVzv_IUb-Hka5OnuMtf5wv7e8.AT1_KKIj9iLd";
const basemapEnum = "arcgis/navigation";
// Display map
const map = L.map("map", {
    minZoom: 2
  })

  map.setView([49.276292, -122.92], 13); // Paris

  L.esri.Vector.vectorBasemapLayer(basemapEnum, {
    token: accessToken
  }).addTo(map);


// Set incident location by clicking on map
const layerGroup = L.layerGroup().addTo(map);
var coordinates = 0;
var addressStr = "";
var addressBox = document.querySelector("#address");

map.on("click", function (e) {

    L.esri.Geocoding
      .reverseGeocode({
        apikey: accessToken
      })
      .latlng(e.latlng)

      .run(function (error, result) {
        if (error) {
          return;
        }

        layerGroup.clearLayers();

        marker = L.marker(result.latlng).addTo(layerGroup);

        const lngLatString = `${Math.round(result.latlng.lng * 100000) / 100000}, ${Math.round(result.latlng.lat * 100000) / 100000}`;

        marker.bindPopup(`<strong>${lngLatString}</strong><p>${result.address.Match_addr}</p>`);
        marker.openPopup();

        coordinates = result.latlng;
        addressStr = result.address.Match_addr;
        addressBox.value = result.address.Match_addr;
        
          
      });
  });

// Add marker onto map after submitting form
function addMarker(){
    var marker = L.marker(coordinates).addTo(map);
    marker.bindPopup(`<strong>${addressStr}</strong><p>Type: </p>`);
}





