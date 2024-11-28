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
function addMarker(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Create a temporary URL for the file


  // Collect data from the form
  const name = document.getElementById("name").value;
  const phoneNumber = document.getElementById("phone-number").value;
  const location = addressStr || document.getElementById("address").value;
  const city = document.getElementById("city").value;
  const region = document.getElementById("region").value;
  const postal = document.getElementById("postal").value;
  const picture = document.getElementById("Picture").value; // Optional
  const comment = document.getElementById("comment").value;

  // Create an object to represent the report
  const report = {
    name: name,
    phoneNumber: phoneNumber,
    location: {
      address: location,
      city: city,
      region: region,
      postal: postal,
      coordinates: coordinates,
    },
    picture: picture,
    comment: comment,
    dateTime: new Date().toISOString(), // Current timestamp
    status: "OPEN",
  };

  // Save to localStorage
  const reports = JSON.parse(localStorage.getItem("reports")) || [];
  reports.push(report);
  localStorage.setItem("reports", JSON.stringify(reports));

  var marker = L.marker(coordinates).addTo(map);
  marker.bindPopup(`<strong>${location}</strong><p>Type: </p>`);

  // Reset the form
  document.getElementById("form-container").reset();
  alert("Incident submitted and saved successfully!");
}

document.getElementById("form-container").addEventListener("submit", addMarker);


function loadReports() {
  const reports = JSON.parse(localStorage.getItem("reports")) || [];

  reports.forEach((report) => {
    if (!report || !report.location || !report.location.coordinates) {
      console.warn("Invalid report data:", report);
      return;
    }
    const marker = L.marker(report.location.coordinates).addTo(map);
    marker.bindPopup(`<strong>${report.location.address}</strong>
                        <p>${report.comment}</p>
                        <p>Status: ${report.status}</p>`);
  });
}
// Call this function when the page loads
loadReports();

//currently anyone can change the status of the report- must change this so that passcode is required
function updateReportStatus(index) {
  const reports = JSON.parse(localStorage.getItem("reports")) || [];
  if (reports[index]) {
    reports[index].status = "RESOLVED";
    localStorage.setItem("reports", JSON.stringify(reports));
    alert("Report resolved!");
    location.reload();
  }
}

function CLEARING() {
  localStorage.clear();
}
