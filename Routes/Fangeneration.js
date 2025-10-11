const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");
const router = express.Router();


// Serve the Fan Generation HTML page
router.get("/", async (req, res) => {
  try {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Fan Generation</title>
          <meta charset="UTF-8" />
          <link href="https://fonts.googleapis.com/css?family=DM Sans" rel="stylesheet">
          <link rel="stylesheet" href="/Css/FanGeneration.css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
        </head>
        <body>
          <nav>
            <ul>
              <li><a href="/">HOME</a></li>
              <li><a href="/tees">CARD MASTER</a></li>
              <li><a href="/truck-master">TRUCK MASTER</a></li>
              <li><a class="active" href="/Fan-Generation">FAN GENERATION</a></li>
              <li><a>ENTRY BRIDGE</a></li>
            </ul>
          </nav>

          <h2 style="text-align:center;font-family: 'DM Sans', sans-serif;">
            <i class="fa-solid fa-truck-fast" style="font-size: 21px;"></i>
            TRUCK DATA ENTRY
          </h2>

          <!-- Search Bar -->
          <div class="top-actions">
    <div class="input-group">
      <label>Truck Reg No : </label>
      <input id="truckRegInput" type="text" placeholder="Enter Truck Reg No">
    </div>
    <div class="input-group">
      <label>Card Allocated : </label>
      <input id="CARD_NO" type="text" placeholder="Card Allocated">
    </div>
  </div>

  <div class="top-actionss">
    <div class="input-group">
      <label for="truckStatus">Truck Status:</label>
      <select id="truckStatus" disabled>
        <option value="">-- Select --</option>
        <option value="-1">Registered</option>
        <option value="1">Reported</option>
        <option value="2">Fan Generation</option>
        <option value="4">Re Authorized</option>
        <option value="13">Abort</option>

      </select>
    </div>

    <div class="input-group">
      <label for="processType">Process Type:</label>
      <select id="processType">
        <option value="">-- Select --</option>
        <option value="1">Loading</option>
        <option value="0">Unloading</option>
      </select>
    </div>
  </div>
  </div>

 
    <button type="button" id="assignCardBtn" class="btn">Assign Card</button>
    <button type="button" id="ReassignCardBtn" class="btn">Re AssignCard</button>
    <button type="button" id="FanGeneration" class="btn">Fan Generation</button>
    <button type="button" id="FanAbortBtn" class="btn">Fan Abort</button>
    <button type="button" id="ReAuthBtn" class="btn">Re Authorized</button>
    <button type="button" id="reAllocateBtn" class="btn" onclick="openReallocatePopup()">Re Allocate</button>
    <button type="button" id="checkBtn" class="btn">Abort</button>

    <p id="result"></p>


  
          <div class="form-container">
            <!-- LEFT: CARD_MASTER from Truck Master -->
            <div>
              <div class="form-group"><label>Truck Number :</label><input id="TRUCK_REG_NO" name="TRUCK_REG_NO" type="text" readonly></div>
              <div class="form-group"><label>Trailer No :</label><input id="TRAILER_NO" name="TRAILER_NO" type="text" readonly></div>
              <div class="form-group"><label>Owner Name :</label><input id="OWNER_NAME" name="OWNER_NAME" type="text" readonly></div>
              <div class="form-group"><label>Driver Name :</label><input id="DRIVER_NAME" name="DRIVER_NAME" type="text" readonly></div>
              <div class="form-group"><label>Helper Name :</label><input id="HELPER_NAME" name="HELPER_NAME" type="text" readonly></div>
              <div class="form-group"><label>Carrier Company :</label><input id="CARRIER_COMPANY" name="CARRIER_COMPANY" type="text" readonly></div>

              <div class="form-group">
                <label for="TRUCK_SEALING_REQUIREMENT">Truck Sealing Requirement :</label>
                <select id="TRUCK_SEALING_REQUIREMENT" name="TRUCK_SEALING_REQUIREMENT" disabled>
                  <option value="">-- Select --</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>

              <div class="form-group">
                <label for="BLACKLIST_STATUS">Blacklist Status :</label>
                <select id="BLACKLIST_STATUS" name="BLACKLIST_STATUS" disabled>
                  <option value="">-- Select --</option>
                  <option value="1">Blacklist</option>
                  <option value="0">Not_Blacklist</option>
                </select>
              </div>

              <div class="form-group"><label>Reason For Blacklist :</label><input id="REASON_FOR_BLACKLIST" name="REASON_FOR_BLACKLIST" type="text" readonly></div>
              <div class="form-group"><label>Safety Cer. Valid Upto :</label><input id="SAFETY_CERTIFICATION_NO" name="SAFETY_CERTIFICATION_NO" type="text" readonly></div>
              <div class="form-group"><label>Calibration Cer. Valid Upto :</label><input id="CALIBRATION_CERTIFICATION_NO" name="CALIBRATION_CERTIFICATION_NO" type="text" readonly></div>
              <div class="form-group"><label>Tare Weight :</label><input id="TARE_WEIGHT" name="TARE_WEIGHT" type="number" readonly></div>
              <div class="form-group"><label>Max Weight :</label><input id="MAX_WEIGHT" name="MAX_WEIGHT" type="number" readonly></div>
              <div class="form-group"><label>Max Fuel Capacity :</label><input id="MAX_FUEL_CAPACITY" name="MAX_FUEL_CAPACITY" type="number" readonly></div>
            </div>

            <!-- RIGHT: DATA_MASTER (editable fields) -->
            <div>
              <div class="form-group"><label>Customer Name :</label><input id="CUSTOMER_NAME" name="CUSTOMER_NAME" type="text"></div>
              <div class="form-group"><label>Address Line 1 :</label><input id="ADDRESS_LINE_1" name="ADDRESS_LINE_1" type="text"></div>
              <div class="form-group"><label>Address Line 2 :</label><input id="ADDRESS_LINE_2" name="ADDRESS_LINE_2" type="text"></div>
              <div class="form-group">
  <label for="ITEM_DESCRIPTION">Item Description :</label>
  <select id="ITEM_DESCRIPTION" name="ITEM_DESCRIPTION">
    <option value="">-- Select --</option>
    <option value="Petrol">Petrol</option>
    <option value="Diesel">Diesel</option>
    <option value="Jetkero">Jetkero</option>
    
  </select>
</div>
              <div class="form-group"><label>Fan Time Out :</label><input id="FAN_TIME_OUT" name="FAN_TIME_OUT" type="text"></div>
              <div class="form-group three-inputs">
  <label>Weight Filled:</label>
  <input type="text" id="MIN" name="MAX1" placeholder="Min" readonly>
  <input type="number" id="WEIGHT_TO_FILLED" name="WEIGHT_TO_FILLED" placeholder="Weight to Fill">
  <input type="text" id="MAX" name="MAX2" placeholder="Max" readonly>
</div>
            </div>
          </div>


          <!-- Fan Generation Popup -->
<div id="fanPopup" class="popup-overlay" style="display:none;">
  <div class="popup-content">
    <h3>Fan Generation</h3>
    <table id="fanTable">
      <tr><th>FAN NO</th><td id="FAN_NO"></td></tr>
      <tr><th>Card No</th><td id="POP_CARD_NO"></td></tr>
      <tr><th>Date Time</th><td id="DATE_TIME"></td></tr>
      <tr><th>Fan Expiry</th><td id="FAN_EXPIRY"></td></tr>
      <tr><th>Truck Reg No</th><td id="POP_TRUCK_REG_NO"></td></tr>
      <tr><th>Customer Name</th><td id="POP_CUSTOMER_NAME"></td></tr>
      <tr><th>Carrier Company</th><td id="POP_CARRIER_COMPANY"></td></tr>
      <tr><th>Item Description</th><td id="POP_ITEM_DESCRIPTION"></td></tr>
      <tr><th>Process Type</th><td id="POP_PROCESS_TYPE"></td></tr>
      <tr><th>Weight Filled</th><td id="POP_WEIGHT_TO_FILLED"></td></tr>
    </table>

    <button id="fanSavePdfBtn" style="display:none;">Save PDF</button>
    <button id="reAuthSavePdfBtn" style="display:none;">Save PDF</button>
    <button onclick="closePopup()">Close</button>
  </div>
</div>


<!-- Bay Allocation Popup -->
<div id="bayPopup" class="popup-overlay" style="display:none;">
  <div class="popup-content">
    <h3>FAN Number Successfully Generated</h3>
    <p>How do you want to Allocate the Bay:</p>
    <div>
      <label><input type="radio" name="bayType" value="auto" checked> Auto</label>
      <label><input type="radio" name="bayType" value="manual"> Manual</label>
    </div>
    <div class="form-group" >
      <label>Assign Bay :</label>
      <input id="BAY_NO" type="text" placeholder="Enter Bay No">
    </div>
    <button id="assignBayBtn">Assign</button>
    <button onclick="closeBayPopup()">Close</button>
  </div>
</div>


<!-- Reallocate Bay Popup -->
<div id="bayPopup1" style="display:none;" class="popup-overlay">
  <div class="popup-content">
    <h3>How do you want to Reallocate Bay?</h3>
    <div>
      <label><input type="radio" name="bayType1" value="auto" checked> Auto</label>
      <label><input type="radio" name="bayType1" value="manual"> Manual</label>
    </div>
    <div class="form-group">
      <label>Assign Bay :</label>
      <input type="text" id="BAY_NO1">
    </div>
    <button id="assignBayBtn1">Assign Bay</button>
    <button onclick="closeBayPopup1()">Close</button>
  </div>
</div>


<!-- Add this somewhere in your HTML, ideally near the end of <body> -->
<div id="popupMsg" style="
    display:none;
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%, -50%);
    background:#fff;
    border:1px solid #ccc;
    padding:20px 30px;
    z-index:1000;
    box-shadow:0 0 15px rgba(0,0,0,0.3);
    border-radius:8px;
    text-align:center;
    font-weight:bold;
">
  <span id="popupText"></span>
  <br><br>
  <button id="closePopup" style="
      padding:5px 15px;
      border:none;
      background:#007bff;
      color:#fff;
      border-radius:5px;
      cursor:pointer;
  ">X</button>
</div>


<div id="truckPopup" style="
    display:none;
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%, -50%);
    background:#fff;
    border:1px solid #ccc;
    padding:20px 30px;
    z-index:1000;
    box-shadow:0 0 15px rgba(0,0,0,0.3);
    border-radius:10px;
    text-align:center;
    font-weight:bold;
    color:#333;
"></div>
  
          <!-- Inline Script -->
          <script>

          

           // ✅ Disable Reassign button initially
  window.addEventListener('DOMContentLoaded', () => {
      const reassignBtn = document.getElementById("ReassignCardBtn");
      if (reassignBtn) reassignBtn.disabled = true; // start disabled
  });



    // Define the fetch function
   async function fetchTruckData() {
    const truckRegNo = document.getElementById("truckRegInput").value.trim();
    const cardNo = document.getElementById("CARD_NO").value.trim();

    // ✅ Determine correct API endpoint
    let url = "";
    if (truckRegNo) {
        url = "/Fan-Generation/api/fan-generation/truck/" + encodeURIComponent(truckRegNo);
    } else if (cardNo) {
        url = "/Fan-Generation/api/fan-generation/card/" + encodeURIComponent(cardNo);
    } else {
        showPopup("Please enter Truck No or Card Allocated No");
        return;
    }

    try {
        const res = await fetch(url);

        // ✅ Read JSON once and safely
        let data = {};
        try {
            data = await res.json();
        } catch {
            // ignore if response is not JSON
        }

        if (!res.ok) {
            // Special handling for card already assigned
            if (res.status === 400 && data.truckRegNo) {
                showPopup(
                    "This Card (" + (truckRegNo || cardNo) + ") is already registered with Truck " + data.truckRegNo
                );
                return;
            }

            showPopup(data.message || "Truck or Card not found");
            return; // stop further processing
        }

        // ✅ Fill all fields
        const allFields = [
            "TRUCK_REG_NO", "TRAILER_NO", "OWNER_NAME", "DRIVER_NAME", "HELPER_NAME", "CARRIER_COMPANY",
            "TRUCK_SEALING_REQUIREMENT", "BLACKLIST_STATUS", "REASON_FOR_BLACKLIST",
            "SAFETY_CERTIFICATION_NO", "CALIBRATION_CERTIFICATION_NO",
            "TARE_WEIGHT", "MAX_WEIGHT", "MAX_FUEL_CAPACITY",
            "CUSTOMER_NAME", "ADDRESS_LINE_1", "ADDRESS_LINE_2", "ITEM_DESCRIPTION",
            "FAN_TIME_OUT", "WEIGHT_TO_FILLED", "CARD_NO"
        ];

        function formatDate(dateStr) {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            return d.toLocaleDateString("en-GB");
        }

        allFields.forEach(id => {
            const field = document.getElementById(id);
            if (!field) return;
            if (id === "SAFETY_CERTIFICATION_NO" || id === "CALIBRATION_CERTIFICATION_NO") {
                field.value = formatDate(data[id]);
            } else {
                field.value = data[id] ?? "";
            }
        });

        // ✅ Truck Status
        document.getElementById("truckStatus").value = data.PROCESS_STATUS ?? "-1";

        // Process Type select
        const processTypeField = document.getElementById("processType");
        if (processTypeField && data.PROCESS_TYPE != null) {
            processTypeField.value = data.PROCESS_TYPE;
        }

        // Fill top Truck Reg No input
        document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";

        // Reassign button
        const reassignBtn = document.getElementById("ReassignCardBtn");
        if (reassignBtn) {
            reassignBtn.disabled = !data.CARD_NO;
        }

        // Fuel min/max
        const minField = document.getElementById("MIN");
        const maxField = document.getElementById("MAX");
        const weightField = document.getElementById("WEIGHT_TO_FILLED");

        if (minField) minField.value = 0;
        if (maxField) maxField.value = data.MAX_FUEL_CAPACITY ?? 0;

        if (weightField) {
            weightField.max = data.MAX_FUEL_CAPACITY ?? 0;
            weightField.addEventListener("input", function () {
                const maxVal = parseFloat(this.max);
                let val = parseFloat(this.value) || 0;
                if (val > maxVal) this.value = maxVal;
                if (val < 0) this.value = 0;
            });
        }

    } catch (err) {
        console.error(err);
        showPopup(err.message || "Error fetching truck or card data.");
    }
}


  // Trigger fetch on Enter key for Truck No
  document.getElementById("truckRegInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchTruckData();
    }
  });

  // Trigger fetch on Enter key for Card Allocated
  document.getElementById("CARD_NO").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchTruckData();
    }
  });





    // Trigger fetch on Enter key
    document.getElementById("truckRegInput").addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission/refresh
        fetchTruckData();
      }
    });

    // Trigger fetch on button click
    window.addEventListener('DOMContentLoaded', () => {
    const assignBtn = document.getElementById("assignCardBtn");
    if (assignBtn) {
      assignBtn.addEventListener("click", async () => {
        const truckRegNo = document.getElementById("truckRegInput").value.trim();
        const cardNo = document.getElementById("CARD_NO").value.trim();
        if (!truckRegNo) return alert("Enter Truck Reg No");
        if (!cardNo) return alert("Enter Card Allocated");

        // Collect other fields
        const customerName = document.getElementById("CUSTOMER_NAME").value.trim();
        const address1 = document.getElementById("ADDRESS_LINE_1").value.trim();
        const address2 = document.getElementById("ADDRESS_LINE_2").value.trim();
        const itemDesc = document.getElementById("ITEM_DESCRIPTION").value.trim();
        const fanTimeOut = document.getElementById("FAN_TIME_OUT").value.trim();
        const weightToFill = document.getElementById("WEIGHT_TO_FILLED").value.trim();
        const processType = document.getElementById("processType").value;  // ✅ ADD THIS
        const truckStatus = document.getElementById("truckStatus").value;  // 👈 get dropdown value


        try {
          const res = await fetch('/Fan-Generation/api/assign-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              truckRegNo, cardNo, processType, truckStatus,   // 👈 send to backend
              CUSTOMER_NAME: customerName,
              ADDRESS_LINE_1: address1,
              ADDRESS_LINE_2: address2,
              ITEM_DESCRIPTION: itemDesc,
              FAN_TIME_OUT: fanTimeOut,
              WEIGHT_TO_FILLED: weightToFill
            })
          });

          const data = await res.json();
          if (res.ok) {
            showCenterPopup("Card Assigned Successfully!");
            //document.getElementById("CARD_NO").value = "";
          } else {
            alert("Error: " + data.message);
          }
        } catch (err) {
          console.error(err);
          alert("Server Error");
        }
      });
    }
  });



  //find Using URL
    (function () {
    // Get query parameters from URL
    const params = new URLSearchParams(window.location.search);

    // Read CARD_NO from query string
    const cardNo = params.get('CARD_NO'); // should match URL parameter

    // If CARD_NO exists, set it in input field
    if (cardNo) {
      const cardInput = document.getElementById('CARD_NO');
      if (cardInput) {
        cardInput.value = cardNo;

        // Optional: auto-fetch truck data if CARD_NO is present
        if (typeof fetchTruckData === "function") {
          fetchTruckData();
        }
      } else {
        console.warn('Input with id="CARD_NO" not found.');
      }
    }
  })();


  // Handle Reassign Button Click
const reassignBtn = document.getElementById("ReassignCardBtn");
if (reassignBtn) {
  reassignBtn.addEventListener("click", async () => {
    const truckRegNo = document.getElementById("truckRegInput").value.trim();
    const cardNo = document.getElementById("CARD_NO").value.trim();
    if (!truckRegNo) return alert("Enter Truck Reg No");
    if (!cardNo) return alert("Enter New Card Allocated");

    // Collect other fields (just like assign)
    const customerName = document.getElementById("CUSTOMER_NAME").value.trim();
    const address1 = document.getElementById("ADDRESS_LINE_1").value.trim();
    const address2 = document.getElementById("ADDRESS_LINE_2").value.trim();
    const itemDesc = document.getElementById("ITEM_DESCRIPTION").value.trim();
    const fanTimeOut = document.getElementById("FAN_TIME_OUT").value.trim();
    const weightToFill = document.getElementById("WEIGHT_TO_FILLED").value.trim();
    const processType = document.getElementById("processType").value;

    try {
      const res = await fetch('/Fan-Generation/api/reassign-card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truckRegNo, cardNo, processType,
          CUSTOMER_NAME: customerName,
          ADDRESS_LINE_1: address1,
          ADDRESS_LINE_2: address2,
          ITEM_DESCRIPTION: itemDesc,
          FAN_TIME_OUT: fanTimeOut,
          WEIGHT_TO_FILLED: weightToFill
        })
      });

      const data = await res.json();
      if (res.ok) {
        showCenterPopup("Card Reassigned Successfully!");
        fetchTruckData(); // refresh UI after update
      } else {
        if (res.ok) {
  alert("Card Assigned Successfully!");
} else {
  // Show friendly backend message (400 means logical validation fail)
  alert(data.message || "Unknown Error");
}

      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  });
}


  
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
function closePopup() {
  document.getElementById("fanPopup").style.display = "none";
}

  // Fan Generation button
    document.getElementById("FanGeneration").addEventListener("click", async () => {
      try {
        const truckRegNo = document.getElementById("truckRegInput").value.trim();
        if(!truckRegNo) return alert("Enter Truck No first!");

        // Hide ReAuth button, show FanSave button
          document.getElementById("reAuthSavePdfBtn").style.display = "none";
          document.getElementById("fanSavePdfBtn").style.display = "inline-block";

        // 1️⃣ Update PROCESS_STATUS = 2
        const updateRes = await fetch('/Fan-Generation/api/fan-generation/update-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ truckRegNo })
        });
        const updateData = await updateRes.json();
        if (!updateRes.ok) throw new Error(updateData.message || "Failed to update status");

        // 2️⃣ Update Truck Status dropdown
        const truckStatusDropdown = document.getElementById("truckStatus");
        if(truckStatusDropdown) truckStatusDropdown.value = 2;

        // 3️⃣ Fetch truck data for popup
        const res = await fetch('/Fan-Generation/api/fan-generation/truck/' + truckRegNo);
        if(!res.ok) throw new Error("Truck not found");
        const data = await res.json();

        // 4️⃣ Generate FAN_NO and DATE_TIME
        const now = new Date();
        const pad = n => n<10?'0'+n:n;
        // const fanNo = pad(now.getDate()) + pad(now.getMonth()+1) + now.getFullYear() + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
        const dateTime = now.toLocaleString();



        // 5️⃣ Fill popup values
        document.getElementById("FAN_NO").textContent = data.FAN_NO || "";
        document.getElementById("POP_CARD_NO").textContent = data.CARD_NO||"";
        document.getElementById("DATE_TIME").textContent = dateTime;

        if(data.FAN_EXPIRY){
          const dt = new Date(data.FAN_EXPIRY);
          document.getElementById("FAN_EXPIRY").textContent = pad(dt.getUTCDate())+'/'+pad(dt.getUTCMonth()+1)+'/'+dt.getUTCFullYear()+' '+pad(dt.getUTCHours())+':'+pad(dt.getUTCMinutes());
        } else {
          document.getElementById("FAN_EXPIRY").textContent = "";
        }

        document.getElementById("POP_TRUCK_REG_NO").textContent = data.TRUCK_REG_NO||"";
        document.getElementById("POP_CUSTOMER_NAME").textContent = data.CUSTOMER_NAME||"";
        document.getElementById("POP_CARRIER_COMPANY").textContent = data.CARRIER_COMPANY||"";
        document.getElementById("POP_ITEM_DESCRIPTION").textContent = data.ITEM_DESCRIPTION||"";
        document.getElementById("POP_PROCESS_TYPE").textContent = data.PROCESS_TYPE==1?"Loading":"Unloading";
        document.getElementById("POP_WEIGHT_TO_FILLED").textContent = data.WEIGHT_TO_FILLED||"";

        // 6️⃣ Show popup
        document.getElementById("fanPopup").style.display = "flex";

      } catch(err){
        alert("Error: "+err.message);
      }
    });


   // Close Bay popup
function closeBayPopup() {
  document.getElementById("bayPopup").style.display = "none";
}

// After Save PDF, open Bay Allocation popup
document.getElementById("fanSavePdfBtn").addEventListener("click", async function () {
  var jsPDFObj = window.jspdf;
  var doc = new jsPDFObj.jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Fan Generation Report", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  var y = 40;
  var rows = document.querySelectorAll("#fanTable tr");
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll("th, td");
    if (cells.length === 2) {
      doc.text(cells[0].innerText + ": " + cells[1].innerText, 14, y);
      y += 10;
    }
  }

  // 1️⃣ Download PDF
  doc.save("Fan_Generation_Report.pdf");

  // 2️⃣ Close the Fan Generation popup
  closePopup();

  // 3️⃣ Prefill BAY_NO from backend
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  if (!truckRegNo) return;

  try {
    const res = await fetch('/Fan-Generation/api/get-bay/' + encodeURIComponent(truckRegNo));
    if (!res.ok) throw new Error("Failed to fetch Bay No");
    const data = await res.json();
    document.getElementById("BAY_NO").value = data.BAY_NO || "";
  } catch (err) {
    console.error(err);
    document.getElementById("BAY_NO").value = "";
  }

  // 4️⃣ Show Bay Allocation popup
  document.getElementById("bayPopup").style.display = "flex";
});

// Assign Bay button
// ✅ Toggle Bay Input visibility (Auto / Manual)
document.addEventListener("DOMContentLoaded", function () {
  // Select the radio buttons
  const bayTypeRadios = document.querySelectorAll('input[name="bayType"]');
  // Get the BAY_NO field’s parent .form-group
  const bayFieldGroup = document.querySelector('#BAY_NO').closest('.form-group');

  // Define function to show/hide BAY_NO field
  function updateBayFieldVisibility() {
    const selected = document.querySelector('input[name="bayType"]:checked')?.value;
    if (selected === "auto") {
      bayFieldGroup.style.display = "none";
    } else {
      bayFieldGroup.style.display = "block";
    }
  }

  // Attach event listener to each radio
  bayTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateBayFieldVisibility);
  });

  // Run once initially
  updateBayFieldVisibility();
});

//=======================
// ✅ Assign Bay logic
//=======================
document.getElementById("assignBayBtn").addEventListener("click", async function () {
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  const bayNo = document.getElementById("BAY_NO").value.trim();
  const bayType = document.querySelector('input[name="bayType"]:checked').value;
  const itemDesc = document.getElementById("ITEM_DESCRIPTION").value.trim(); // Petrol / Diesel / Jetkero

  if (!truckRegNo) return alert("Truck Reg No missing");
  if (bayType === "manual" && !bayNo) return alert("Enter Bay No");

  try {
    const res = await fetch('/Fan-Generation/api/assign-bay', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ truckRegNo, bayNo, bayType, itemDesc })
    });

    const data = await res.json();
    if (res.ok) {
      showCenterPopup("Bay Assigned Successfully!");
      closeBayPopup();
    } else {
      alert("Error: " + data.message); 
    }
  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
});


// =========================
//  FAN ABORT BUTTON LOGIC
// =========================
document.getElementById("FanAbortBtn").addEventListener("click", async () => {
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  const cardNo = document.getElementById("CARD_NO").value.trim();

  if (!truckRegNo && !cardNo) {
    return alert("Enter Truck Reg No or Card No");
  }

  if (!confirm("Are you sure you want to abort this FAN?")) {
    return;
  }

  try {
    const res = await fetch('/Fan-Generation/api/fan-abort', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ truckRegNo, cardNo })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Clear all inputs
      const inputs = document.querySelectorAll('input, select');
      inputs.forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });

      // ✅ Show success popup
      showCenterPopup("Fan Abort Successfully!");

    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
});


// BAY ASSIGN SUCCESSFULL POPUP
function showCenterPopup(message) {
  // Create popup element
  const popup = document.createElement('div');
  popup.textContent = message;

  // Style it
  Object.assign(popup.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#4CAF50',  // Green for success
    color: 'white',
    padding: '20px 40px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    fontSize: '18px',
    zIndex: '2000',
    textAlign: 'center',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
});
    
   // Add to screen
  document.body.appendChild(popup);

  // Fade in
  setTimeout(() => {
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';
  }, 10);

  // Fade out and remove after 2.5 seconds
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.visibility = 'hidden';
    setTimeout(() => popup.remove(), 300);
  }, 2500);
}


//========================
// Re-Authorization Button
//========================
document.getElementById("ReAuthBtn").addEventListener("click", async () => {
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  if (!truckRegNo) return alert("Enter Truck Reg No");

  // Hide FanSave button, show ReAuth button
    document.getElementById("fanSavePdfBtn").style.display = "none";
    document.getElementById("reAuthSavePdfBtn").style.display = "inline-block";

  const processType = parseInt(document.getElementById("processType").value, 10);
  if (isNaN(processType)) return alert("Select a valid Process Type");

  const customerName = document.getElementById("CUSTOMER_NAME").value.trim();
  const address1 = document.getElementById("ADDRESS_LINE_1").value.trim();
  const address2 = document.getElementById("ADDRESS_LINE_2").value.trim();
  const itemDesc = document.getElementById("ITEM_DESCRIPTION").value.trim();
  const fanTimeOut = parseInt(document.getElementById("FAN_TIME_OUT").value, 10);
  if (isNaN(fanTimeOut) || fanTimeOut < 0) return alert("Invalid FAN Time Out");

  const weightToFill = parseInt(document.getElementById("WEIGHT_TO_FILLED").value, 10) || 0;

  // Calculate FAN expiry
  const now = new Date();
  const fanExpiry = new Date(now.getTime() + fanTimeOut * 60000); // minutes → ms

  try {
    const res = await fetch('/Fan-Generation/api/re-authorization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        truckRegNo,
        processType,
        customerName,
        address1,
        address2,
        itemDesc,
        weightToFill,
        fanTimeOut,
        fanExpiry
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Re-Authorization done!");

      // Update truck status
      document.getElementById("truckStatus").value = 4;
      document.getElementById("FAN_EXPIRY").textContent = fanExpiry.toLocaleString();

      // ✅ Show ReAuth FAN popup with data
      showFanPopup(data.data);

      // ✅ Ensure Save PDF button works ONLY for ReAuth (no Bay popup)
      setupSavePdfButton();

    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
});

// -------------------------
// Show FAN Popup Function
// -------------------------
function showFanPopup(data) {
  const pad = (n) => (n < 10 ? "0" + n : n);

  document.getElementById("FAN_NO").textContent = data.FAN_NO || "";
  document.getElementById("POP_CARD_NO").textContent = data.CARD_NO || "";
  const dateTime = new Date().toLocaleString();
  document.getElementById("DATE_TIME").textContent = dateTime;

  if (data.FAN_EXPIRY) {
    const dt = new Date(data.FAN_EXPIRY);
    document.getElementById("FAN_EXPIRY").textContent =
      pad(dt.getUTCDate()) + '/' + pad(dt.getUTCMonth() + 1) + '/' + dt.getUTCFullYear() + ' ' +
      pad(dt.getUTCHours()) + ':' + pad(dt.getUTCMinutes());
  } else {
    document.getElementById("FAN_EXPIRY").textContent = "";
  }

  document.getElementById("POP_TRUCK_REG_NO").textContent = data.TRUCK_REG_NO || "";
  document.getElementById("POP_CUSTOMER_NAME").textContent = data.CUSTOMER_NAME || "";
  document.getElementById("POP_CARRIER_COMPANY").textContent = data.CARRIER_COMPANY || "";
  document.getElementById("POP_ITEM_DESCRIPTION").textContent = data.ITEM_DESCRIPTION || "";
  document.getElementById("POP_PROCESS_TYPE").textContent = data.PROCESS_TYPE == 1 ? "Loading" : "Unloading";
  document.getElementById("POP_WEIGHT_TO_FILLED").textContent = data.WEIGHT_TO_FILLED || "";

  // Show popup
  document.getElementById("fanPopup").style.display = "flex";
}

// -------------------------
// Generate PDF Function
// -------------------------
function generateFanPDF() {
  var jsPDFObj = window.jspdf;
  var doc = new jsPDFObj.jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Fan Generation Report", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  var y = 40;
  var rows = document.querySelectorAll("#fanTable tr");
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll("th, td");
    if (cells.length === 2) {
      doc.text(cells[0].innerText + ": " + cells[1].innerText, 14, y);
      y += 10;
    }
  }

  // Download PDF
  doc.save("Fan1_Generation_Report.pdf");
}

// -------------------------
// Close popup
// -------------------------
function closePopup() {
  document.getElementById("fanPopup").style.display = "none";
}

// -------------------------
// Shared Save PDF Button Logic
// -------------------------
function setupSavePdfButton() {
  const saveBtn = document.getElementById("reAuthSavePdfBtn");
  if (!saveBtn) return;

  // Remove old listeners (to prevent bay popup from previous script)
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);

  // Add new listener only for ReAuth
  newBtn.addEventListener("click", () => {
    generateFanPDF();

    // ✅ Conditional logic — only open Bay Allocation if FAN popup, not ReAuth
    const fanPopupVisible = document.getElementById("fanPopup").style.display === "flex";
    const bayPopupVisible = document.getElementById("bayPopup")?.style.display === "flex";

    if (fanPopupVisible && !bayPopupVisible) {
      // ❌ No bay popup for ReAuth
      console.log("ReAuth PDF saved — Bay popup not opened");
    }
  });
}



//================
//BAY RE-ALLOCATE
//================

let currentTruckRegNo = "";
let previousBayNo = "";

// ✅ Close popup
function closeBayPopup1() {
  document.getElementById("bayPopup1").style.display = "none";
}

// ✅ Open popup + fetch current BAY_NO
async function openReallocatePopup() {
  try {
    const truckRegNoInput = document.getElementById("truckRegInput");
    if (!truckRegNoInput) return alert("Truck Reg Input not found in HTML!");
    const truckRegNo = truckRegNoInput.value.trim();
    if (!truckRegNo) return alert("Truck Reg No missing");

    currentTruckRegNo = truckRegNo;

    const res = await fetch('/Fan-Generation/api/get-bay/' + encodeURIComponent(truckRegNo));
    if (!res.ok) throw new Error("Failed to fetch Bay No");

    const data = await res.json();
    previousBayNo = data.BAY_NO || "";
    document.getElementById("BAY_NO1").value = previousBayNo;

    document.getElementById("bayPopup1").style.display = "flex";
  } catch (err) {
    console.error("openReallocatePopup error:", err);
    alert("Could not open popup. Check console for details.");
  }
}

// ✅ Toggle BAY_NO field (Auto / Manual)
function updateBayFieldVisibility() {
  const selected = document.querySelector('input[name="bayType1"]:checked')?.value;
  const bayFieldGroup = document.querySelector('#BAY_NO1').closest('.form-group');
  if (!bayFieldGroup) return;

  if (selected === "auto") {
    bayFieldGroup.style.display = "none";
  } else {
    bayFieldGroup.style.display = "block";
    document.getElementById("BAY_NO1").value = previousBayNo;
  }
}

document.querySelectorAll('input[name="bayType1"]').forEach(radio => {
  radio.addEventListener('change', updateBayFieldVisibility);
});
updateBayFieldVisibility();

// ✅ Assign / Reallocate Bay
document.getElementById("assignBayBtn1").addEventListener("click", async function () {
  try {
    const truckRegNo = currentTruckRegNo;
    const bayNo = document.getElementById("BAY_NO1").value.trim();
    const bayType = document.querySelector('input[name="bayType1"]:checked').value;
    const itemDesc = document.getElementById("ITEM_DESCRIPTION")?.value?.trim() || "";

    if (!truckRegNo) return alert("Truck Reg No missing");
    if (bayType === "manual" && !bayNo) return alert("Enter Bay No");

    const res = await fetch('/Fan-Generation/api/reallocate-bay', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ truckRegNo, bayNo, bayType, itemDesc })
    });

    const data = await res.json();
    if (res.ok) {
      showCenterPopup("Bay Reallocated Successfully!");
      closeBayPopup1();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("assignBayBtn1 error:", err);
    alert("Server Error");
  }
});


//===============
//    Abort 
//===============
// Function to show popup
function showPopup(msg) {
  const popup = document.getElementById("popupMsg");
  const text = document.getElementById("popupText");
  text.textContent = msg;
  popup.style.display = "block";
}

// Close button
document.getElementById("closePopup").addEventListener("click", () => {
  document.getElementById("popupMsg").style.display = "none";
});

// Main logic
document.getElementById("checkBtn").addEventListener("click", async () => {
  const cardNo = document.getElementById("CARD_NO").value.trim();
  const truckStatusSelect = document.getElementById("truckStatus");

  if (!cardNo) {
    showPopup("Please enter Card No");
    return;
  }

  try {
    const response = await fetch("/Fan-Generation/api/check-common-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNo })
    });

    const data = await response.json();

    if (data.status === "Abort") {
      // Check if already selected
      if (truckStatusSelect.value === "13") {
        showPopup("Card No " + cardNo + " is already aborted.");

      } else {
        // Add abort option if not present
        let abortOption = [...truckStatusSelect.options].find(opt => opt.text === "Abort");
        if (!abortOption) {
          abortOption = new Option("Abort", "13");
          truckStatusSelect.add(abortOption);
        }
        truckStatusSelect.value = "13";
        showPopup("Card No " + cardNo + " status set to Abort.");

      }
    } else {
      showPopup("Data not found");
    }

  } catch (err) {
    console.error("Error:", err);
    showPopup("Error connecting to server");
  }
});






</script>






        </body>
        </html>
      `;
    res.send(html);
  } catch (err) {
    console.error("Error loading Fan Generation page:", err);
    res.status(500).send("Error loading Fan Generation page: " + err.message);
  }
});

// Unified API: Fetch by Truck No OR Card Allocated No
// =========================
// 🔹 1. Search by Truck Reg No
// =========================
router.get("/api/fan-generation/truck/:truckRegNo", async (req, res) => {
  const truckRegNo = req.params.truckRegNo?.trim();

  try {
    const pool = await sql.connect(dbConfig);

    // Fetch Truck info
    const truckResult = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query("SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo");

    if (truckResult.recordset.length === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const truckData = truckResult.recordset[0];

    // ====== Condition Checks ======
    const today = new Date();

    // 1️⃣ Blacklist check
    if (truckData.BLACKLIST_STATUS === 1) {
      return res.status(400).json({ message: "This truck is blacklisted." });
    }

    // 2️⃣ Safety certificate check
    if (truckData.SAFETY_CERTIFICATION_NO && new Date(truckData.SAFETY_CERTIFICATION_NO) < today) {
      return res.status(400).json({ message: "Truck's safety certification date is expired." });
    }

    // 3️⃣ Calibration certificate check
    if (truckData.CALIBRATION_CERTIFICATION_NO && new Date(truckData.CALIBRATION_CERTIFICATION_NO) < today) {
      return res.status(400).json({ message: "Truck's calibration certificate date is expired." });
    }

    // Fetch latest DATA_MASTER for this truck
    const dataResult = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(`
        SELECT TOP 1 
            FAN_NO, TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, 
            ITEM_DESCRIPTION, FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED, PROCESS_STATUS
        FROM DATA_MASTER 
        WHERE TRUCK_REG_NO = @truckRegNo 
        ORDER BY FAN_TIME_OUT DESC
      `);

    let dataMaster = dataResult.recordset.length > 0 ? dataResult.recordset[0] : {};

    // Calculate Truck Status
    let processStatus = dataMaster.PROCESS_STATUS ?? -1;
    let truckStatusText = "Registered";

    if (processStatus === 1) truckStatusText = "Reported";
    else if (processStatus === 2) truckStatusText = "Fan Generation";

    res.json({
      ...dataMaster,
      ...truckData,
      CARD_NO: dataMaster.CARD_NO,
      PROCESS_TYPE: dataMaster.PROCESS_TYPE ?? "",
      PROCESS_STATUS: processStatus,
      TRUCK_STATUS_TEXT: truckStatusText,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
});


// =========================
// 🔹 2. Search by Card No
// =========================
router.get("/api/fan-generation/card/:cardNo", async (req, res) => {
  const cardNo = req.params.cardNo?.trim();

  try {
    const pool = await sql.connect(dbConfig);

    // Fetch latest data by Card No
    const cardResult = await pool.request().input("cardNo", sql.VarChar, cardNo)
      .query(`
        SELECT TOP 1 
            FAN_NO,TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, 
            ITEM_DESCRIPTION, FAN_TIME_OUT,FAN_EXPIRY, WEIGHT_TO_FILLED, PROCESS_STATUS
        FROM DATA_MASTER 
        WHERE CARD_NO = @cardNo 
        ORDER BY FAN_TIME_OUT DESC
      `);

    if (cardResult.recordset.length === 0) {
      return res.status(404).json({ message: "Card not found" });
    }

    const dataMaster = cardResult.recordset[0];
    let truckData = {};

    // Fetch truck info linked to this card
    if (dataMaster.TRUCK_REG_NO) {
      const truckResult = await pool
        .request()
        .input("truckRegNo", sql.VarChar, dataMaster.TRUCK_REG_NO)
        .query("SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo");

      if (truckResult.recordset.length > 0) {
        truckData = truckResult.recordset[0];
      }
    }

    // ✅ Calculate Truck Status
    let processStatus = dataMaster.PROCESS_STATUS ?? -1;
    let truckStatusText = "Registered";

    if (processStatus === 1) truckStatusText = "Reported";
    else if (processStatus === 2) truckStatusText = "Fan Generation";

    res.json({
      ...dataMaster,
      ...truckData,
      CARD_NO: dataMaster.CARD_NO,
      PROCESS_TYPE: dataMaster.PROCESS_TYPE ?? "",
      PROCESS_STATUS: processStatus,
      TRUCK_STATUS_TEXT: truckStatusText,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
});


//=============================================
// API route: Assign Card & Save to DATA_MASTER
//=============================================
router.post("/api/assign-card", async (req, res) => {
  const {
    truckRegNo,
    cardNo,
    processType,
    CUSTOMER_NAME,
    ADDRESS_LINE_1,
    ADDRESS_LINE_2,
    ITEM_DESCRIPTION,
    FAN_TIME_OUT,
    WEIGHT_TO_FILLED,
  } = req.body;

  if (!truckRegNo || !cardNo) {
    return res
      .status(400)
      .json({ message: "Truck Reg No and Card No are required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // 1️⃣ Check if card exists in CARD_MASTER
    const cardCheck = await pool
      .request()
      .input("cardNo", sql.VarChar, cardNo)
      .query("SELECT CARD_STATUS FROM CARD_MASTER WHERE CARD_NO = @cardNo");

    if (cardCheck.recordset.length === 0) {
      return res.status(401).json({
        message: `Card ${cardNo} not found in Card Master (Unauthorized).`,
      });
    }

    const cardStatus = cardCheck.recordset[0].CARD_STATUS;
    if (cardStatus !== 1) {
      // assuming 1 = active, 0 = blocked
      return res
        .status(400)
        .json({ message: `Card ${cardNo} is BLOCKED or inactive.` });
    }

    // Check if this truck already has a card
    const existing = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(
        "SELECT CARD_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo"
      );

    if (existing.recordset.length > 0) {
      // Truck already has a card → don't allow assigning another
      return res.status(400).json({
        message: `Truck ${truckRegNo} already has a card allocated (${existing.recordset[0].CARD_NO})`,
      });
    }

    // 2️⃣ Check if this CARD_NO is already assigned to another truck
    const existingCard = await pool
      .request()
      .input("cardNo", sql.VarChar, cardNo)
      .query("SELECT TRUCK_REG_NO FROM DATA_MASTER WHERE CARD_NO = @cardNo");

    if (existingCard.recordset.length > 0) {
      return res.status(400).json({
        message: `Card ${cardNo} is already assigned to Truck ${existingCard.recordset[0].TRUCK_REG_NO}`,
      });
    }

    // 4️⃣ Generate FAN_NO (ddMMyyyyHHmmss)
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }
    const now = new Date();
    const fanNo =
      pad(now.getDate()) +
      pad(now.getMonth() + 1) +
      now.getFullYear() +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    // 5️⃣ Calculate FAN_EXPIRY (UTC)
    const fanTimeOutMinutes = parseInt(FAN_TIME_OUT) || 0;
    const fanExpiryLocal = new Date(now.getTime() + fanTimeOutMinutes * 60000);
    const fanExpiryUTC = new Date(
      fanExpiryLocal.getTime() - fanExpiryLocal.getTimezoneOffset() * 60000
    );

    // 6️⃣ Insert new record into DATA_MASTER
    await pool
      .request()
      .input("TRUCK_REG_NO", sql.VarChar, truckRegNo)
      .input("CARD_NO", sql.VarChar, cardNo)
      .input("PROCESS_TYPE", sql.Int, parseInt(processType))
      .input("PROCESS_STATUS", sql.Int, 1) // 1 = Reported
      .input("BATCH_STATUS", sql.Int, 1)   // ✅ Mark as active
      .input("CUSTOMER_NAME", sql.VarChar, CUSTOMER_NAME || "")
      .input("ADDRESS_LINE_1", sql.VarChar, ADDRESS_LINE_1 || "")
      .input("ADDRESS_LINE_2", sql.VarChar, ADDRESS_LINE_2 || "")
      .input("ITEM_DESCRIPTION", sql.VarChar, ITEM_DESCRIPTION || "")
      .input("FAN_NO", sql.VarChar, fanNo)
      .input("FAN_TIME_OUT", sql.Int, fanTimeOutMinutes)
      .input("FAN_EXPIRY", sql.DateTime, fanExpiryUTC)
      .input("WEIGHT_TO_FILLED", sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
      .query(`
        INSERT INTO DATA_MASTER 
          (TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, PROCESS_STATUS, BATCH_STATUS,
           CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, 
           FAN_NO, FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED)
        VALUES 
          (@TRUCK_REG_NO, @CARD_NO, @PROCESS_TYPE, @PROCESS_STATUS,  @BATCH_STATUS,
           @CUSTOMER_NAME, @ADDRESS_LINE_1, @ADDRESS_LINE_2, @ITEM_DESCRIPTION,
           @FAN_NO, @FAN_TIME_OUT, @FAN_EXPIRY, @WEIGHT_TO_FILLED)
      `);

    res.json({
      message: `Card ${cardNo} assigned to Truck ${truckRegNo} successfully`,
    });
  } catch (err) {
    console.error("Error in /api/assign-card:", err);
    res.status(500).json({ message: "Database Error" });
  }
});


//==================================================
// API route: Reassign Card (Update existing record)
//==================================================
router.put("/api/reassign-card", async (req, res) => {
  const {
    truckRegNo,
    cardNo,
    processType,
    CUSTOMER_NAME,
    ADDRESS_LINE_1,
    ADDRESS_LINE_2,
    ITEM_DESCRIPTION,
    FAN_TIME_OUT,
    WEIGHT_TO_FILLED,
  } = req.body;

  if (!truckRegNo || !cardNo)
    return res
      .status(400)
      .json({ message: "Truck Reg No and Card No are required" });

  try {
    const pool = await sql.connect(dbConfig);

    // 1️⃣ Check if card exists in CARD_MASTER
    const cardCheck = await pool
      .request()
      .input("cardNo", sql.VarChar, cardNo)
      .query("SELECT CARD_STATUS FROM CARD_MASTER WHERE CARD_NO = @cardNo");

    if (cardCheck.recordset.length === 0) {
      return res.status(401).json({
        message: `Card ${cardNo} not found in Card Master (Unauthorized).`,
      });
    }

    const cardStatus = cardCheck.recordset[0].CARD_STATUS;
    if (cardStatus !== 1) {
      // assuming 1 = active, 0 = blocked
      return res
        .status(400)
        .json({ message: `Card ${cardNo} is BLOCKED or inactive.` });
    }

    // 1️⃣ Check if truck exists
    const existing = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(
        "SELECT CARD_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo"
      );

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        message: `Truck ${truckRegNo} not found. Please assign a card first.`,
      });
    }

    // ✅ If truck already has the same card, no need to reassign
    if (existing.recordset[0].CARD_NO === cardNo) {
      return res.status(400).json({
        message: `Truck ${truckRegNo} already has this card (${cardNo}) assigned`,
      });
    }

    // 2️⃣ Check if this CARD_NO is already assigned to another truck
    const existingCard = await pool
      .request()
      .input("cardNo", sql.VarChar, cardNo)
      .query("SELECT TRUCK_REG_NO FROM DATA_MASTER WHERE CARD_NO = @cardNo");

    if (
      existingCard.recordset.length > 0 &&
      existingCard.recordset[0].TRUCK_REG_NO !== truckRegNo
    ) {
      return res.status(400).json({
        message: `Card ${cardNo} is already assigned to Truck ${existingCard.recordset[0].TRUCK_REG_NO}`,
      });
    }

    // 3️⃣ Safe to update
    const updateResult = await pool
      .request()
      .input("TRUCK_REG_NO", sql.VarChar, truckRegNo)
      .input("CARD_NO", sql.VarChar, cardNo)
      .input("PROCESS_TYPE", sql.Int, parseInt(processType) || 0)
      .input("CUSTOMER_NAME", sql.VarChar, CUSTOMER_NAME || "")
      .input("ADDRESS_LINE_1", sql.VarChar, ADDRESS_LINE_1 || "")
      .input("ADDRESS_LINE_2", sql.VarChar, ADDRESS_LINE_2 || "")
      .input("ITEM_DESCRIPTION", sql.VarChar, ITEM_DESCRIPTION || "")
      .input("FAN_TIME_OUT", sql.Int, parseInt(FAN_TIME_OUT) || 0)
      .input("WEIGHT_TO_FILLED", sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
      .query(`
        UPDATE DATA_MASTER
        SET CARD_NO = @CARD_NO,
            PROCESS_TYPE = @PROCESS_TYPE,
            CUSTOMER_NAME = @CUSTOMER_NAME,
            ADDRESS_LINE_1 = @ADDRESS_LINE_1,
            ADDRESS_LINE_2 = @ADDRESS_LINE_2,
            ITEM_DESCRIPTION = @ITEM_DESCRIPTION,
            FAN_TIME_OUT = @FAN_TIME_OUT,
            WEIGHT_TO_FILLED = @WEIGHT_TO_FILLED
        WHERE TRUCK_REG_NO = @TRUCK_REG_NO
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return res
        .status(500)
        .json({ message: "Reassign failed, no rows were updated." });
    }

    res.json({ message: "Card re-assigned successfully" });
  } catch (err) {
    console.error("Reassign Card Error:", err);
    res.status(500).json({ message: "Database Error: " + err.message });
  }
});



//================================
// API: Update PROCESS_STATUS to 2
//================================
router.put("/api/fan-generation/update-status", async (req, res) => {
  const { truckRegNo } = req.body;
  if (!truckRegNo)
    return res.status(400).json({ message: "Truck Reg No is required" });
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("processStatus", sql.Int, 2)
      .query(
        `UPDATE DATA_MASTER SET PROCESS_STATUS=@processStatus WHERE TRUCK_REG_NO=@truckRegNo`
      );
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: "Truck not found" });
    res.json({ message: "PROCESS_STATUS updated to Fan Generated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database Error" });
  }
});


//=======================
// Get BAY_NO for a truck
//=======================
router.get("/api/get-bay/:truckRegNo", async (req, res) => {
  const truckRegNo = req.params.truckRegNo?.trim();
  if (!truckRegNo)
    return res.status(400).json({ message: "Truck Reg No required" });
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(
        "SELECT TOP 1 BAY_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo ORDER BY FAN_TIME_OUT DESC"
      );

    res.json({ BAY_NO: result.recordset[0]?.BAY_NO || "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database Error" });
  }
});


// =================================================
// 🔹 3. Assign Bay (Auto/Manual) using TRUCK_MASTER
// =================================================
router.post("/api/assign-bay", async (req, res) => {
  const { truckRegNo, bayNo, bayType, itemDesc } = req.body; // itemDesc = "Petrol", "Jetkero", or "Diesel"

  if (!truckRegNo) {
    return res
      .status(400)
      .json({ message: "Truck Registration No is required" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    let finalBayNo = bayNo;

    // ✅ Auto Allocation Logic
    if (bayType === "auto") {
      let bayGroup = [];

      // Select bay group based on item description (fuel type)
      if (itemDesc && itemDesc.toLowerCase() === "petrol") {
        bayGroup = ["1", "2"];
      } else if (itemDesc && itemDesc.toLowerCase() === "jetkero") {
        bayGroup = ["3", "4"];
      } else if (itemDesc && itemDesc.toLowerCase() === "diesel") {
        bayGroup = ["1", "2", "3", "4"];
      } else {
        return res
          .status(400)
          .json({ message: "Invalid or missing item type" });
      }

      // 1️⃣ Get truck count per bay from TRUCK_MASTER
      const countQuery = `
        SELECT BAY_NO, COUNT(*) AS TRUCK_COUNT
        FROM DATA_MASTER
        WHERE BAY_NO IN (${bayGroup.map((b) => `'${b}'`).join(",")})
        GROUP BY BAY_NO
      `;
      const result = await pool.request().query(countQuery);

      // Initialize counts
      const bayCount = {};
      bayGroup.forEach((b) => (bayCount[b] = 0));

      // Fill with database results
      result.recordset.forEach(
        (row) => (bayCount[row.BAY_NO] = row.TRUCK_COUNT)
      );

      // 2️⃣ Pick bay with least assigned trucks
      finalBayNo = Object.keys(bayCount).reduce((a, b) =>
        bayCount[a] <= bayCount[b] ? a : b
      );

      console.log(`Auto selected bay for ${itemDesc}: ${finalBayNo}`);
    }

    // 3️⃣ Update the TRUCK_MASTER with the selected bay
    await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("bayNo", sql.VarChar, finalBayNo).query(`
        UPDATE DATA_MASTER
        SET BAY_NO = @bayNo
        WHERE TRUCK_REG_NO = @truckRegNo
      `);

    res.json({ message: "Bay assigned successfully", BAY_NO: finalBayNo });
  } catch (err) {
    console.error("Error assigning bay:", err);
    res.status(500).json({ message: "Database Error: " + err.message });
  }
});


// =================
// 🔹 FAN ABORT API
// =================
router.delete("/api/fan-abort", async (req, res) => {
  const { truckRegNo, cardNo } = req.body;

  if (!truckRegNo && !cardNo) {
    return res.status(400).json({ message: "Truck No or Card No required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Delete the record from DATA_MASTER
    const deleteQuery = `
      DELETE FROM DATA_MASTER 
      WHERE TRUCK_REG_NO = @truckRegNo OR CARD_NO = @cardNo
    `;

    await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo || "")
      .input("cardNo", sql.VarChar, cardNo || "")
      .query(deleteQuery);

    res.json({ message: "Fan Abort Successful" });
  } catch (err) {
    console.error("Fan Abort Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
});


//======================================
// Re-Authorized and updated data in SQL
//======================================
router.put("/api/re-authorization", async (req, res) => {
  const {
    truckRegNo,
    processType,
    customerName,
    address1,
    address2,
    itemDesc,
    fanTimeOut,
    weightToFill,
  } = req.body;

  if (!truckRegNo)
    return res.status(400).json({ message: "Truck Reg No required" });

  try {
    const pool = await sql.connect(dbConfig);

    // Calculate FAN_EXPIRY
    const fanMinutes = parseInt(fanTimeOut) || 0;
    const now = new Date();
    const fanExpiry = new Date(now.getTime() + fanMinutes * 60000);
    const fanExpiryUTC = new Date(fanExpiry.getTime() - fanExpiry.getTimezoneOffset() * 60000);

    // Update record
    const result = await pool.request()
      .input("TRUCK_REG_NO", sql.VarChar, truckRegNo)
      .input("PROCESS_TYPE", sql.Int, parseInt(processType) || 0)
      .input("PROCESS_STATUS", sql.Int, 4)
      .input("CUSTOMER_NAME", sql.VarChar, customerName || "")
      .input("ADDRESS_LINE_1", sql.VarChar, address1 || "")
      .input("ADDRESS_LINE_2", sql.VarChar, address2 || "")
      .input("ITEM_DESCRIPTION", sql.VarChar, itemDesc || "")
      .input("FAN_TIME_OUT", sql.Int, fanMinutes)
      .input("FAN_EXPIRY", sql.DateTime, fanExpiryUTC)
      .input("WEIGHT_TO_FILLED", sql.BigInt, parseInt(weightToFill) || 0)
      .query(`
        UPDATE DATA_MASTER
        SET PROCESS_TYPE = @PROCESS_TYPE,
            PROCESS_STATUS = @PROCESS_STATUS,
            CUSTOMER_NAME = @CUSTOMER_NAME,
            ADDRESS_LINE_1 = @ADDRESS_LINE_1,
            ADDRESS_LINE_2 = @ADDRESS_LINE_2,
            ITEM_DESCRIPTION = @ITEM_DESCRIPTION,
            FAN_TIME_OUT = @FAN_TIME_OUT,
            FAN_EXPIRY = @FAN_EXPIRY,
            WEIGHT_TO_FILLED = @WEIGHT_TO_FILLED
        WHERE TRUCK_REG_NO = @TRUCK_REG_NO
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Truck record not found" });
    }

     // ✅ Fetch the updated data (join TRUCK_MASTER for carrier company)
    const updated = await pool.request()
      .input("TRUCK_REG_NO", sql.VarChar, truckRegNo)
      .query(`
        SELECT 
            D.*, 
            T.CARRIER_COMPANY
        FROM DATA_MASTER D
        LEFT JOIN TRUCK_MASTER T
            ON D.TRUCK_REG_NO = T.TRUCK_REG_NO
        WHERE D.TRUCK_REG_NO = @TRUCK_REG_NO
      `);
    res.json({
      message: "Re-Authorization updated successfully",
      data: updated.recordset[0]
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
});




// ================================
// 🔹 Re-Allocate Bay (Auto/Manual)
// ================================
router.post("/api/reallocate-bay", async (req, res) => {
  const { truckRegNo, bayNo, bayType, itemDesc } = req.body; // itemDesc = "Petrol", "Jetkero", or "Diesel"

  if (!truckRegNo) {
    return res
      .status(400)
      .json({ message: "Truck Registration No is required" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    let finalBayNo = bayNo;

    // ✅ Auto Allocation Logic
    if (bayType === "auto") {
      let bayGroup = [];

      // Select bay group based on item description (fuel type)
      if (itemDesc && itemDesc.toLowerCase() === "petrol") {
        bayGroup = ["1", "2"];
      } else if (itemDesc && itemDesc.toLowerCase() === "jetkero") {
        bayGroup = ["3", "4"];
      } else if (itemDesc && itemDesc.toLowerCase() === "diesel") {
        bayGroup = ["1", "2", "3", "4"];
      } else {
        return res
          .status(400)
          .json({ message: "Invalid or missing item type" });
      }

      // 1️⃣ Get truck count per bay from TRUCK_MASTER
      const countQuery = `
        SELECT BAY_NO, COUNT(*) AS TRUCK_COUNT
        FROM DATA_MASTER
        WHERE BAY_NO IN (${bayGroup.map((b) => `'${b}'`).join(",")})
        GROUP BY BAY_NO
      `;
      const result = await pool.request().query(countQuery);

      // Initialize counts
      const bayCount = {};
      bayGroup.forEach((b) => (bayCount[b] = 0));

      // Fill with database results
      result.recordset.forEach(
        (row) => (bayCount[row.BAY_NO] = row.TRUCK_COUNT)
      );

      // 2️⃣ Pick bay with least assigned trucks
      finalBayNo = Object.keys(bayCount).reduce((a, b) =>
        bayCount[a] <= bayCount[b] ? a : b
      );

      console.log(`Auto selected bay for ${itemDesc}: ${finalBayNo}`);
    }

    // 3️⃣ Update the TRUCK_MASTER with the selected bay
    await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("bayNo", sql.VarChar, finalBayNo).query(`
        UPDATE DATA_MASTER
        SET BAY_NO = @bayNo
        WHERE TRUCK_REG_NO = @truckRegNo
      `);

    res.json({ message: "Bay assigned successfully", BAY_NO: finalBayNo });
  } catch (err) {
    console.error("Error assigning bay:", err);
    res.status(500).json({ message: "Database Error: " + err.message });
  }
});

router.get("/api/get-bay/:truckRegNo", async (req, res) => {
  const truckRegNo = req.params.truckRegNo?.trim();
  if (!truckRegNo)
    return res.status(400).json({ message: "Truck Reg No required" });
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(
        "SELECT TOP 1 BAY_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo ORDER BY FAN_TIME_OUT DESC"
      );

    res.json({ BAY_NO: result.recordset[0]?.BAY_NO || "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database Error" });
  }
});

//================
//     Abort
//================
router.post("/api/check-common-view", async (req, res) => {
  const { cardNo } = req.body;

  if (!cardNo) {
    return res.status(400).json({ message: "Card number required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // ✅ 1️⃣ Check COMMON_VIEW for record
    const result = await pool.request()
      .input("cardNo", sql.VarChar, cardNo)
      .query(`
        SELECT TOP 1 * 
        FROM dbo.COMMON_VIEW 
        WHERE CARD_NO = @cardNo 
          AND BATCH_STATUS = 1
      `);

    if (result.recordset.length > 0) {
      // ✅ 2️⃣ Update DATA_MASTER table PROCESS_STATUS = 13
      await pool.request()
        .input("cardNo", sql.VarChar, cardNo)
        .query(`
          UPDATE dbo.DATA_MASTER 
          SET PROCESS_STATUS = 13 
          WHERE CARD_NO = @cardNo
        `);

      // ✅ 3️⃣ Return message & status
      res.json({ message: "Data Exist", status: "Abort" });
    } else {
      res.json({ message: "No Data" });
    }

  } catch (err) {
    console.error("❌ SQL Error:", err);
    res.status(500).json({ message: "Error connecting to server", error: err.message });
  } finally {
    sql.close();
  }
});


module.exports = router;