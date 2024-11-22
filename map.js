// Display map
var map = L.map('map').setView([49.276292, -122.92], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Set incident location by clicking on map
var popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("Set the incident location to " + e.latlng.toString())
        .openOn(map);

}
map.on('click', onMapClick);