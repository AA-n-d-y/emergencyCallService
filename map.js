const accessToken = "AAPTxy8BH1VEsoebNVZXo8HurGWUPfpCnqmtiYOporIn6aReHTWuMzBwJj870WY7-50fnNywKgwy55pAudeX1Fp_erFecK20XrulPEKH08QchSg2tb1wETJwd8rqQ7aLU_aEWeKN7a28QLrXGKoqgYfX2XzTAZcdL1G_tBXuDdSuw-9cAcCZ76mw2IXcXLIdZzBq8chznVeyHaroHSB5xCmVzv_IUb-Hka5OnuMtf5wv7e8.AT1_KKIj9iLd";
const basemapEnum = "arcgis/navigation";
// Display map
const map = L.map("map", {
  minZoom: 2
})

map.setView([49.276292, -122.92], 13); // SFU

L.esri.Vector.vectorBasemapLayer(basemapEnum, {
  token: accessToken
}).addTo(map);

const searchControl = L.esri.Geocoding.geosearch({
  position: "topright",
  placeholder: "Enter an address or place e.g. 1 York St",
  useMapBounds: false,
  
  providers: [
    L.esri.Geocoding.arcgisOnlineProvider({
      apikey: accessToken,
      nearby: {
        lat: 49.276292,
        lng: -122.92
      }
    })
  ]

}).addTo(map);


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

// Set incident location by searching
searchControl.on("results", (data) => {
  // Clear existing markers
  layerGroup.clearLayers();

  // Loop through the search results
  data.results.forEach((result) => {
    const marker = L.marker(result.latlng);
    layerGroup.addLayer(marker);
    
    const lngLatString = `${Math.round(result.latlng.lng * 100000) / 100000}, ${Math.round(result.latlng.lat * 100000) / 100000}`;
    marker.bindPopup(`<strong>${lngLatString}</strong><p>${result.text}</p>`).openPopup();

    coordinates = result.latlng;
    addressStr = result.text;
    addressBox.value = result.text;
  });
});

// Set incident location by clicking on map
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

const markers = {}; // Marker storage

// Add marker onto map after submitting form
function addMarker(event) {
  // Prevent the default form submission behavior
    event.preventDefault();
  // Create a temporary URL for the file
  if (!coordinates || !addressStr) {
    alert("Please select a location on the map or use the search bar to set the location.");
    return; // Stop form submission
  }

  layerGroup.clearLayers();

    // Collect data from the form
    const name = document.getElementById("name").value;
    const phoneNumber = document.getElementById("phone-number").value;
    const emergencyType = document.getElementById("emergency-type").value;
    const location = addressStr;
    const picture = document.getElementById("Picture").files[0]; // changed this a little for file.
    const comment = document.getElementById("comment").value;


    // change a little for picture file handling.
  let pictureURL = "N/A";
  if (picture){
    pictureURL = URL.createObjectURL (picture);
  }


  // Create an object to represent the report
  const report = {
    id: Date.now().toString(), // Unique id for each marker
    name: name,
    phoneNumber: phoneNumber,
    emergencyType: emergencyType,
    location: {
      address: location,
      coordinates: coordinates,
    },
    picture: pictureURL,
    comment: comment,
    dateTime: new Date().toISOString(), // Current timestamp
    status: "OPEN",
  };


  if (picture) {
    const reader = new FileReader();
    reader.onload = function (e) {
      report.picture = e.target.result; // Base64 encoded string
      saveReportAndUpdateMap(report);
    };
    reader.readAsDataURL(picture);
  } 
  else {
    report.picture = null; // No image provided
    saveReportAndUpdateMap(report);
  }
}
document.getElementById("form-container").addEventListener("submit", addMarker);

function saveReportAndUpdateMap(report) {
  // Save to localStorage
  const reports = JSON.parse(localStorage.getItem("reports")) || [];
  reports.push(report);
  localStorage.setItem("reports", JSON.stringify(reports));

  // Create marker
  const marker = L.marker(report.location.coordinates).addTo(map);
  marker.bindPopup(getMarkerPopupContent(report));
  markers[report.id] = marker; // Store marker

  // Reset the form
  document.getElementById("form-container").reset();
  coordinates = null;
  addressStr = "";

  alert("Incident submitted and saved successfully!");
}





function loadReports() {
  const reports = JSON.parse(localStorage.getItem("reports")) || [];

  // Clear existing markers from the map
  for (let id in markers) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
  

  reports.forEach((report) => {
    if (!report || !report.location || !report.location.coordinates) {
      console.warn("Invalid report data:", report);
      return;
    }
    const marker = L.marker(report.location.coordinates).addTo(map);
    marker.bindPopup(getMarkerPopupContent(report));
    markers[report.id] = marker;
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


function getMarkerPopupContent(report) {
  let imageContent = '';
  if (report.picture) {
    imageContent = `<img src="${report.picture}" alt="report image" style="width: 150px; height: 150px; object-fit: cover;">`;
  } 
  else {
    imageContent = `<p>No image provided.</p>`;
  }

  return `<div style="width: 300px; height: 150px; overflow-y:auto;">
    <img src="${report.picture}" alt="report image" style="width: 150px; height: 150px; object-fit: cover;">
    <p><strong>Type: </strong>${report.emergencyType}</p>
    <p><strong>Location: </strong>${report.location.address}</p>
    <p><strong>Reported by: </strong>${report.name} (${report.phoneNumber})</p>
    <p><strong>Time: </strong>${new Date(report.dateTime).toLocaleString()}</p>
    <p><strong>Status: </strong>${report.status}</p>
    <p><strong>Comments: </strong>${report.comment}</p>
  </div>`;
}



// Adding a new function to get the values to populate data. EDITED TO ONLY SHOW REPORTS CURRENTLY IN MAP VIEW
function populateTable() {
    const reports = JSON.parse (localStorage.getItem("reports")) || [];
    const tbody = document.querySelector("#table tbody");

    tbody.innerHTML = "";

    const bounds = map.getBounds();

    reports.forEach((report, index) => {
        const row = document.createElement("tr");

        if (report.location.coordinates) {
          const latlng = L.latLng(
              report.location.coordinates.lat,
              report.location.coordinates.lng
          );

          // Check if the report's location is within the current map bounds
          if (!bounds.contains(latlng)) {
              // Skip reports outside the current map view
              return;
          }
      } else {
          // Skip reports without coordinates
          return;
      }

      // Construct the location string
      let locString = report.location.address;

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
        statusButton.onclick = async () => {
        const isVerified = await promptAndVerifyPassword(); // Verify password before changing status
          if (isVerified){
            report.status = report.status === "OPEN" ? "RESOLVED" : "OPEN";

            reports[index] = report;
            localStorage.setItem("reports", JSON.stringify(reports));
            if (markers[report.id]) {
              markers[report.id].setPopupContent(getMarkerPopupContent(report));
            }
            populateTable();
          }
          
        };

        
        const deleteCell = document.createElement("td");
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.style.backgroundColor = "red";
        deleteCell.appendChild(del);
        // Delete the report
        del.onclick = async() => {
        const ver = await promptAndVerifyPassword(); // Verify password before changing status
          if(ver) {
            const reportId = reports[index].id;

    // Remove marker from map
            if (markers[reportId]) {
              map.removeLayer(markers[reportId]);
              delete markers[reportId];
            }
            reports.splice(index, 1);
            localStorage.setItem("reports", JSON.stringify(reports));
            populateTable();
          }
        };

        deleteCell.appendChild(del);
        statusCell.appendChild(statusIcon);
        statusCell.appendChild(statusButton);

        //Add "More Detail"
        const detailCell = document.createElement("td");
        const detailLink = document.createElement("a");
        detailLink.textContent = "MORE DETAIL";
        detailLink.style.cursor = "pointer";
        detailLink.style.color = "grey";
        detailLink.style.textDecoration = "underline";

        //Clicked -> Display the report card
        detailLink.onclick = () => {
          displayReportCard(report);
        };


        detailCell.appendChild(detailLink);//Add to cell

        row.innerHTML = `
        <td>${report.emergencyType}</td>
        <td>${locString}</td>
        <td>${new Date(report.dateTime).toLocaleString()}</td>
        <td>${report.comment}</td>
        `;

        //Add cells to rows
        row.appendChild(statusCell);
        row.appendChild(deleteCell);
        row.appendChild(detailCell);

        if (document.getElementById("sort").textContent.includes("old to new")){
          tbody.insertAdjacentElement("afterbegin", row);
        }
        else{
          tbody.appendChild(row);
        }
    });
};

function displayReportCard(report){
  console.log(report.picture);
  var reportDetail = `<div style="width: 300px; height: 150px; overflow-y:auto;">
    <img src="${report.picture}" alt="report image" style="width: 150px; height: 150px; object-fit: cover;">
    <p><strong>Type: </strong>${report.emergencyType}</p>
    <p><strong>Location: </strong>${report.location.address}</p>
    <p><strong>Reported by: </strong>${report.name} (${report.phoneNumber})</p>
    <p><strong>Time: </strong>${new Date(report.dateTime).toLocaleString()}</p>
    <p><strong>Status: </strong>${report.status}</p>
    <p><strong>Comments: </strong>${report.comment}</p>
  </div>`;
  
  const marker = L.marker(report.location.coordinates, {pane: 'popupPane'}).addTo(layerGroup);
  marker.bindPopup(reportDetail).openPopup();

}



map.on('moveend', populateTable); // Updates table when map zooms or pans
document.addEventListener("DOMContentLoaded", populateTable());
document.getElementById("form-container").addEventListener("submit", () => {
    setTimeout(populateTable, 100);
});





// sort the table
function Sort() {
  const table = document.getElementById("table");
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const sortButton = document.getElementById("sort");
  const ascending = sortButton.textContent.includes("old to new");

  // sorting
  rows.sort((a, b) => {
    const dA = new Date (a.cells[2].textContent.trim());
    const dB = new Date (b.cells[2].textContent.trim());
    return ascending ? dA - dB : dB - dA;
  });

  rows.forEach(row => tbody.appendChild(row));

  sortButton.textContent = ascending ? "Sort (new to old)" : "Sort (old to new)";
};
