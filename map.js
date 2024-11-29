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

// There was some error, it was not letting the form to submit, related to map, added just a temporary 
// solution to test table, keep if you want or remove it
map.on('styleimagemissing', function (e) {
  console.warn(`Missing image: ${e.id}`);
  map.addImage(e.id, {
    width: 1,
    height: 1,
    data: new Uint8Array(4) // Transparent pixel
  });
});


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
    const picture = document.getElementById("Picture").files[0]; // changed this a little for file.
    const comment = document.getElementById("comment").value;


    // change a little for picture file handling.
  let pictureURL = "N/A";
  if (picture){
    pictureURL = URL.createObjectURL (picture);
  }


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
    picture: pictureURL,
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







// Adding a new function to get the values to populate data.
function populateTable() {
    const reports = JSON.parse (localStorage.getItem("reports")) || [];
    const tbody = document.querySelector("#table tbody");

    tbody.innerHTML = "";

    reports.forEach((report, index) => {
        const row = document.createElement("tr");


        let locString;

        if(report.location.address) {
            locString = report.location.address;
        }
        else{
            locString = `${report.location.address || ""}, ${report.location.city || "" }, ${report.location.region || "" }, ${report.location.postal || "" } `;
        }

        const statusCell = document.createElement("td");
        const statusIcon = document.createElement("span");
        const statusButton = document.createElement("button");

        if (report.status === "OPEN") {
          statusIcon.textContent = "✔️ OPEN";
          statusIcon.style.color = "green";
        }
        else{
          statusIcon.textContent = "❌ RESOLVED";
          statusIcon.style.color = "red";
        }

        statusButton.textContent = "Change Status";
        statusButton.style.marginLeft = "10px";
        statusButton.onclick = () => {
          report.status = report.status === "OPEN" ? "RESOLVED" : "OPEN";

          reports[index] = report;
          localStorage.setItem("reports", JSON.stringify(reports));

          populateTable();
        };


        statusCell.appendChild(statusIcon);
        statusCell.appendChild(statusButton);

        row.innerHTML = `
        <td>${locString}</td>
        <td>${new Date(report.dateTime).toLocaleString()}</td>
        <td>${report.comment}</td>
        `;

        row.appendChild(statusCell);

        tbody.appendChild(row);
    });
}


document.addEventListener("DOMContentLoaded", populateTable());

document.getElementById("form-container").addEventListener("submit", () => {
    setTimeout(populateTable, 100);
});