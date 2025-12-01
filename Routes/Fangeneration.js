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
              <li><a href="/EntryWeight">ENTRY BRIDGE</a></li>
              <li><a href="/ExitWeigh">EXIT BRIDGE</a></li>
              <li><a href="/InvoiceGeneration">INVOICE GENERATION</a></li>
              <li><a href="/WeighingBill">WEIGHING BILL</a></li>
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
        <option value="4">Fan Reauthorised</option>
        <option value="5">Entry Weight Accept</option>
        <option value="6">Truck at bay</option>
        <option value="7">Earthing Clamp Engaged</option>
        <option value="8">Loading started</option>
        <option value="9">Loading stopped</option>
        <option value="12">Loading Completed: Disengage Earthing Clamp</option>
        <option value="13">Aborted</option>
        <option value="14">Loading Completed</option>
        <option value="15">Exit Weight Accepted</option>
        <option value="16">Invoice Generated</option>

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
    <button onclick="closeFanPopup()">Close</button>
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
<div id="overlay"></div>
<div id="popupMsg" style="
    display:none;
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%, -50%);
    background:#fff;
    border:1px solid #ccc;
    padding:30px 40px;
    z-index:1000;
    box-shadow:0 0 15px rgba(0,0,0,0.3);
    border-radius:8px;
    font-weight:bold;
    width:250px;
    max-width: 90%;
    overflow-wrap: break-word;  /* Wrap long words */
    word-wrap: break-word;
    word-break: break-word;
    text-align:center;
    box-sizing:border-box;
">
  <!-- Close button top-right -->
  <button id="closePopup"
  ">✖</button>
  <div id="popupText"></div>
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



<img id="somgasLogo" src="/Icons/Somgas.png" alt="" style="display:none">

  
          <!-- Inline Script -->
          <script>

    // Define the fetch function
   // Replace your existing fetchTruckData() with this version
// Replace your existing fetchTruckData() with this version
async function fetchTruckData() {
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  const cardNo = document.getElementById("CARD_NO").value.trim();

  function isCardSearch() {
    return Boolean(cardNo) && !truckRegNo;
  }

  function clearFieldsExceptCard() {
    const keep = new Set(["CARD_NO"]);
    const inputs = document.querySelectorAll("input, select");
    inputs.forEach(el => {
      if (!el.id) return;
      if (keep.has(el.id)) return;
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    });
    // reset explicit fields
    const ts = document.getElementById("truckStatus");
    if (ts) ts.value = "-1";
    setBtnState("LOADED_ONLY_ASSIGN");
  }

  // Choose endpoint
  let url = "";
  if (cardNo) url = "/Fan-Generation/api/fan-generation/card/" + encodeURIComponent(cardNo);
  else if (truckRegNo) url = "/Fan-Generation/api/fan-generation/truck/" + encodeURIComponent(truckRegNo);
  else {
    showPopup("Please enter Truck No or Card Allocated No");
    return;
  }

  try {
    const res = await fetch(url);
    let data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON safe */ }

    // If backend says NOT FOUND and user searched by card -> show only card
    if (!res.ok) {
      if (res.status === 404 && isCardSearch()) {
        document.getElementById("CARD_NO").value = cardNo;
        clearFieldsExceptCard();
        showPopup("Card " + cardNo + " is not assigned to any truck. You can assign it now.");
        return;
      }

      // backend might send 400 with useful info about assignment
      if (res.status === 400 && data?.TRUCK_REG_NO) {
        document.getElementById("CARD_NO").value = cardNo;
        document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";
        showPopup("Card " + cardNo + " is already assigned to Truck " + data.TRUCK_REG_NO);
        return;
      }

      showPopup(data.message || "Truck or Card not found");
      return;
    }

    // If success but user searched by card and returned record has no TRUCK_REG_NO -> treat as unassigned
    if (isCardSearch() && (!data.TRUCK_REG_NO || data.TRUCK_REG_NO === "")) {
      document.getElementById("CARD_NO").value = cardNo;
      clearFieldsExceptCard();
      showPopup("Card " + cardNo + " is not assigned to any truck. You can assign it now.");
      return;
    }

    // Otherwise fill all fields (card is assigned or truck lookup)
      updateButtonsFromData(data);


    const allFields = [
      "TRUCK_REG_NO","TRAILER_NO","OWNER_NAME","DRIVER_NAME","HELPER_NAME","CARRIER_COMPANY",
      "TRUCK_SEALING_REQUIREMENT","BLACKLIST_STATUS","REASON_FOR_BLACKLIST",
      "SAFETY_CERTIFICATION_NO","CALIBRATION_CERTIFICATION_NO",
      "TARE_WEIGHT","MAX_WEIGHT","MAX_FUEL_CAPACITY",
      "CUSTOMER_NAME","ADDRESS_LINE_1","ADDRESS_LINE_2","ITEM_DESCRIPTION",
      "FAN_TIME_OUT","WEIGHT_TO_FILLED","CARD_NO"
    ];

    function formatDate(dStr){
      if(!dStr) return "";
      const d = new Date(dStr);
      if(isNaN(d)) return dStr;
      return d.toLocaleDateString("en-GB");
    }

    allFields.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      if(id === "SAFETY_CERTIFICATION_NO" || id === "CALIBRATION_CERTIFICATION_NO") el.value = formatDate(data[id]);
      else el.value = data[id] ?? "";
    });

    // Truck Status & Process Type
    const ts = document.getElementById("truckStatus");
    if(ts) ts.value = data.PROCESS_STATUS ?? "-1";
    const pt = document.getElementById("processType");
    if(pt && data.PROCESS_TYPE != null) pt.value = data.PROCESS_TYPE;

    toggleWeightField();


    // Fill top Truck Reg No input
    document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";

    // Fuel min/max & weight validation
    const minField = document.getElementById("MIN");
    const maxField = document.getElementById("MAX");
    const weightField = document.getElementById("WEIGHT_TO_FILLED");
    if(minField) minField.value = 0;
    if(maxField) maxField.value = data.MAX_FUEL_CAPACITY ?? 0;
    if(weightField) {
      weightField.max = data.MAX_FUEL_CAPACITY ?? 0;
      weightField.addEventListener("input", function(){
        const maxVal = parseFloat(this.max) || 0;
        let val = parseFloat(this.value) || 0;
        if(val > maxVal) this.value = maxVal;
        if(val < 0) this.value = 0;
      });
    }

  } catch (err) {
    console.error(err);
    showPopup(err.message || "Error fetching truck or card data.");
  }
}




  // Trigger fetch on Enter key for Truck No
  document.getElementById("truckRegInput").addEventListener("keydown", async function (e) {
    if (e.key === "Enter") {
        e.preventDefault(); // prevent form submission
        const truckRegNo = this.value.trim();
        if (!truckRegNo) {
            showPopup("Please enter Truck Number");
            return;
        }

        // Ask confirmation
        const confirmLoad = await confirmPopup("Do you want to reload the data for this truck?");
        if (confirmLoad) {
            await fetchTruckData(); // ✅ load truck data only on YES
        }
    }
})

  // Trigger fetch on Enter key for Card Allocated
  document.getElementById("CARD_NO").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchTruckData();
    }
  });

  

    // Trigger fetch on Enter key
    // document.getElementById("truckRegInput").addEventListener("keypress", function(e) {
    //   if (e.key === "Enter") {
    //     e.preventDefault(); // Prevent form submission/refresh
    //     fetchTruckData();
    //   }
    // });

    // Trigger fetch on button click
    window.addEventListener('DOMContentLoaded', () => {
    const assignBtn = document.getElementById("assignCardBtn");
    if (assignBtn) {
      assignBtn.addEventListener("click", async () => {
        const truckRegNo = document.getElementById("truckRegInput").value.trim();
        const cardNo = document.getElementById("CARD_NO").value.trim();
        if (!truckRegNo) return showPopup("Enter Truck Reg No");
        if (!cardNo) return showPopup("Enter Card Allocated");

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
            setBtnState("ASSIGNED_CAN_FANGEN");

            //document.getElementById("CARD_NO").value = "";
          } else {
            showPopup(data.message || "Something went wrong while assigning the card");
          }
        } catch (err) {
          console.error(err);
          alert("Server Error");
        }
      });
    }
  });



  //===============
  //find Using URL
  //==============
//     (function () {
//   // Parse query parameters from URL
//   const params = new URLSearchParams(window.location.search);
//   const cardNo = params.get('CARD_NO');

//   // If CARD_NO is present, fill the input and optionally trigger fetch
//   if (cardNo) {
//     const input = document.getElementById('CARD_NO');
//     if (input) {
//       input.value = cardNo;

//       // Optional: call your fetch function to load related data
//       if (typeof fetchTruckData === "function") {
//         fetchTruckData();
//       }
//     } else {
//       console.warn('CARD_NO field not found in iframe.');
//     }
//   }
// })();


//=================
// URL-THROW SEARCH (uses TRUCK_NO)
//==================
(function () {
  const params = new URLSearchParams(window.location.search);
  const truckNo = params.get('TRUCK_NO');
  if (truckNo) {
    const truckInput = document.getElementById('truckRegInput');
    if (truckInput) {
      truckInput.value = truckNo;
      // call your fetch function for truck (rename accordingly)
      if (typeof fetchByTruck === 'function') {
        fetchByTruck(truckNo); // Auto-fetch on page load
      } else {
        console.warn('fetchByTruck is not defined — ensure you renamed fetchByCard to fetchByTruck.');
      }
    }
  }
})();


//========================================================================================
// Listen for messages from Unified control (EntryWeightBridge)
//========================================================================================
window.addEventListener('message', function (event) {
  const data = event.data || {};
  if (data.source !== 'EntryWeightBridge') return;

  // Truck number update
  if (data.type === 'TruckNo') {
    const truckInput = document.getElementById('truckRegInput');
    if (truckInput) {
      truckInput.value = data.value ?? '';

      // Optional visual flash to indicate an update
      truckInput.style.transition = 'background 0.25s';
      truckInput.style.background = 'rgba(0, 200, 255, 0.18)';
      setTimeout(() => (truckInput.style.background = 'transparent'), 250);
    }

    // Trigger fetch (if your page has fetchByTruck)
    if (data.value && typeof fetchByTruck === 'function') {
      fetchByTruck(data.value);
    }
  }

  // ---- Replaced MeasuredWeight with CardNo (behavior unchanged) ----
  if (data.type === 'CardNo') {
    const cardInput = document.getElementById('CARD_NO'); // your element id
    if (cardInput) {
      // show empty string if null/undefined
      cardInput.value = data.value == null ? '' : data.value;

      // Flash indicator (optional)
      cardInput.style.transition = 'background 0.25s';
      cardInput.style.background = 'rgba(0, 255, 0, 0.18)';
      setTimeout(() => (cardInput.style.background = 'transparent'), 250);
    }
  }
});






  // Handle Reassign Button Click
const reassignBtn = document.getElementById("ReassignCardBtn");
if (reassignBtn) {
  reassignBtn.addEventListener("click", async () => {
    const truckRegNo = document.getElementById("truckRegInput").value.trim();
    const cardNo = document.getElementById("CARD_NO").value.trim();
    if (!truckRegNo) return showPopup("Enter Truck Reg No");
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
  showPopup(data.message || "Unknown Error");
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
function closeFanPopup() {
  document.getElementById("fanPopup").style.display = "none";
}

  // Fan Generation button
    document.getElementById("FanGeneration").addEventListener("click", async () => {
      try {
        const truckRegNo = document.getElementById("truckRegInput").value.trim();
        if(!truckRegNo) return showPopup("Enter Truck No first!");

        // Hide ReAuth button, show FanSave button
          document.getElementById("reAuthSavePdfBtn").style.display = "none";
          document.getElementById("fanSavePdfBtn").style.display = "inline-block";

        // 1️⃣ Update PROCESS_STATUS = 2
        // 🆕  Generate FAN number in backend
const fanGenRes = await fetch('/Fan-Generation/api/fan-generation/generate', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ truckRegNo })
});
const fanGenData = await fanGenRes.json();
if (!fanGenRes.ok) throw new Error(fanGenData.message || "Failed to generate FAN");

        // const updateData = await updateRes.json();
        // if (!updateRes.ok) throw new Error(updateData.message || "Failed to update status");

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
        document.getElementById("FAN_NO").textContent = fanGenData.FAN_NO;
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
        setBtnState("FAN_GENERATED");


      } catch(err){
        alert("Error: "+err.message);
      }
    });


   // Close Bay popup
function closeBayPopup() {
  document.getElementById("bayPopup").style.display = "none";
}

// After Save PDF, open Bay Allocation popup
// After Save PDF, open Bay Allocation popup (styled layout)
document.getElementById("fanSavePdfBtn").addEventListener("click", async function () {
  try {
    // robust jsPDF resolve
    var jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFLib) { console.warn("jsPDF not loaded"); return; }
    var doc = new jsPDFLib({ unit: "pt", format: "a4" });

    // ====== read all values from the popup table ======
    function get(label) {
      var rows = document.querySelectorAll("#fanTable tr");
      for (var i = 0; i < rows.length; i++) {
        var c = rows[i].querySelectorAll("th,td");
        if (c.length >= 2 && c[0].innerText.trim().toLowerCase() === label.toLowerCase()) {
          return c[1].innerText.trim();
        }
      }
      return "";
    }

    var data = {
      fanNo: get("FAN NO"),
      cardNo: get("Card No"),
      dateTime: get("Date Time"),
      expiry: get("Fan Expiry"),
      truckNo: get("Truck Reg No"),
      customer: get("Customer Name"),
      carrier: get("Carrier Company"),
      itemDesc: get("Item Description"),
      processType: get("Process Type"),
      qty: get("Weight Filled")
    };

    // ====== layout helpers ======
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var M = 28, labelW = 140, rowH = 22, fieldW = W - M*2 - labelW - 10;
    var y = 96;

    function textFit(t){ return doc.splitTextToSize(t || "", fieldW - 10); }
    function row(label, value, suffix){
      doc.setFont("helvetica","bold"); doc.setFontSize(10);
      doc.text(label, M, y + 14);
      doc.setDrawColor(180);
      doc.roundedRect(M + labelW, y, fieldW, rowH, 3, 3);
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      var lines = textFit((value || "") + (suffix ? "  " + suffix : ""));
      doc.text(lines, M + labelW + 6, y + 14);
      y += rowH + 6;
    }

    // ====== header (logo + title + gray bar) ======
    var logo = document.getElementById("somgasLogo");
    if (logo && logo.complete) { try { doc.addImage(logo, "PNG", M, 18, 140, 36); } catch(e){} }
    doc.setFont("helvetica","bold"); doc.setFontSize(18);
    doc.text("FILLING ADVISORY NOTE", W/2, 40, { align: "center" });

    doc.setFillColor(235,235,235); doc.setDrawColor(200);
    doc.rect(0, 64, W, 20, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9);
    doc.text("Detail page 1", M, 78);

    // ====== body fields ======
    row("FAN No.", data.fanNo);
    row("Card No.", data.cardNo);
    row("Date & Time", data.dateTime);
    row("FAN Expiry Time", data.expiry);

    doc.setDrawColor(220); doc.line(M, y + 4, W - M, y + 4); y += 14;

    row("Truck No.", data.truckNo);
    row("Customer", data.customer);
    row("Carrier Company", data.carrier);

    // Item & Description (taller box)
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text("Item & Description", M, y + 14);
    doc.setDrawColor(180); doc.roundedRect(M + labelW, y, fieldW, 70, 3, 3);
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    doc.text(textFit(data.itemDesc), M + labelW + 6, y + 14);
    y += 80;

    row("Process Type", data.processType);
    row("Qty To Be Filled", data.qty, "kg");

    // footer
    doc.setFont("helvetica","normal"); doc.setFontSize(8);
    doc.text("Generated on " + new Date().toLocaleString(), M, H - 24);

    // ====== save ======
    doc.save("FAN_" + (data.fanNo || Date.now()) + ".pdf");

    // ====== your existing flow (unchanged) ======
    closeFanPopup(); // close the fan popup

    // prefill Bay from backend then show Bay popup
    var truckRegNo = document.getElementById("truckRegInput").value.trim();
    if (!truckRegNo) return;
    try {
      var res = await fetch('/Fan-Generation/api/get-bay/' + encodeURIComponent(truckRegNo));
      if (res.ok) {
        var d = await res.json();
        document.getElementById("BAY_NO").value = d.BAY_NO || "";
      }
    } catch(e){ console.error(e); }
    document.getElementById("bayPopup").style.display = "flex";
  } catch (err) {
    console.error("PDF error:", err);
    // fail silently so other buttons continue working
  }
});


  // 1️⃣ Download PDF
 // doc.save("Fan_Generation_Report.pdf");

  // 2️⃣ Close the Fan Generation popup
 // closeFanPopup();

  // 3️⃣ Prefill BAY_NO from backend
  // const truckRegNo = document.getElementById("truckRegInput").value.trim();
  // if (!truckRegNo) return;

  // try {
  //   const res = await fetch('/Fan-Generation/api/get-bay/' + encodeURIComponent(truckRegNo));
  //   if (!res.ok) throw new Error("Failed to fetch Bay No");
  //   const data = await res.json();
  //   document.getElementById("BAY_NO").value = data.BAY_NO || "";
  // } catch (err) {
  //   console.error(err);
  //   document.getElementById("BAY_NO").value = "";
  // }

  // 4️⃣ Show Bay Allocation popup
//   document.getElementById("bayPopup").style.display = "flex";
// });

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
      const assigned = data?.BAY_NO || bayNo || "N/A";
      showCenterPopup("Bay Assigned Successfully! — Bay: " + assigned);
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
    return showPopup("Enter Truck Reg No or Card No");
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
      setBtnState("ABORTED");

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
  if (!truckRegNo) return showPopup("Enter Truck Reg No");

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
function closeFanPopup() {
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
    generateStyledFANPDF();

    // ✅ Conditional logic — only open Bay Allocation if FAN popup, not ReAuth
    const fanPopupVisible = document.getElementById("fanPopup").style.display === "flex";
    const bayPopupVisible = document.getElementById("bayPopup")?.style.display === "flex";

    if (fanPopupVisible && !bayPopupVisible) {
      // ❌ No bay popup for ReAuth
      console.log("ReAuth PDF saved — Bay popup not opened");
    }
  });
}

//=================
//RE-AUTHORIZE PDF
//=================
function generateStyledFANPDF() {
  // resolve jsPDF safely
  var jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPDFLib) { console.warn("jsPDF not loaded"); return; }
  var doc = new jsPDFLib({ unit: "pt", format: "a4" });

  // read values from popup table
  function get(label) {
    var rows = document.querySelectorAll("#fanTable tr");
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelectorAll("th,td");
      if (c.length >= 2 && c[0].innerText.trim().toLowerCase() === label.toLowerCase()) {
        return c[1].innerText.trim();
      }
    }
    return "";
  }

  var W = doc.internal.pageSize.getWidth();
  var H = doc.internal.pageSize.getHeight();
  var M = 28, labelW = 140, rowH = 22, fieldW = W - M*2 - labelW - 10;
  var y = 96;

  function textFit(t){ return doc.splitTextToSize(t || "", fieldW - 10); }
  function row(label, value, suffix){
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text(label, M, y + 14);
    doc.setDrawColor(180);
    doc.roundedRect(M + labelW, y, fieldW, rowH, 3, 3);
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    var lines = textFit((value || "") + (suffix ? "  " + suffix : ""));
    doc.text(lines, M + labelW + 6, y + 14);
    y += rowH + 6;
  }

  var data = {
    fanNo: get("FAN NO"),
    cardNo: get("Card No"),
    dateTime: get("Date Time"),
    expiry: get("Fan Expiry"),
    truckNo: get("Truck Reg No"),
    customer: get("Customer Name"),
    carrier: get("Carrier Company"),
    itemDesc: get("Item Description"),
    processType: get("Process Type"),
    qty: get("Weight Filled")
  };

  // header
  var logo = document.getElementById("somgasLogo");
  if (logo && logo.complete) { try { doc.addImage(logo, "PNG", M, 18, 140, 36); } catch(_){} }
  doc.setFont("helvetica","bold"); doc.setFontSize(18);
  doc.text("FILLING ADVISORY NOTE", W/2, 40, { align: "center" });
  doc.setFillColor(235,235,235); doc.setDrawColor(200);
  doc.rect(0, 64, W, 20, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("Detail page 1", M, 78);

  // body
  row("FAN No.", data.fanNo);
  row("Card No.", data.cardNo);
  row("Date & Time", data.dateTime);
  row("FAN Expiry Time", data.expiry);

  doc.setDrawColor(220); doc.line(M, y + 4, W - M, y + 4); y += 14;

  row("Truck No.", data.truckNo);
  row("Customer", data.customer);
  row("Carrier Company", data.carrier);

  // Item & Description big box
  doc.setFont("helvetica","bold"); doc.setFontSize(10);
  doc.text("Item & Description", M, y + 14);
  doc.setDrawColor(180); doc.roundedRect(M + labelW, y, fieldW, 70, 3, 3);
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text(textFit(data.itemDesc), M + labelW + 6, y + 14);
  y += 80;

  row("Process Type", data.processType);
  row("Qty To Be Filled", data.qty, "kg");

  // footer + save
  doc.setFont("helvetica","normal"); doc.setFontSize(8);
  doc.text("Generated on " + new Date().toLocaleString(), M, H - 24);
  doc.save("FAN_" + (data.fanNo || Date.now()) + ".pdf");
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
    if (!truckRegNo) return showPopup("Truck Reg No missing");

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
      const assigned = data?.BAY_NO || bayNo || "N/A";
      showCenterPopup("Bay Assigned Successfully! — Bay: " + assigned);
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
const popup = document.getElementById("popupMsg");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closePopup");

function showPopup(msg) {
    document.getElementById("popupText").textContent = msg;
    popup.style.display = "block";
    overlay.style.display = "block"; // show blur
}

function closePopup() {
    popup.style.display = "none";
    overlay.style.display = "none"; // hide blur
}

closeBtn.addEventListener("click", closePopup);


// Main logic
document.getElementById("checkBtn").addEventListener("click", async () => {
  const cardInput = document.getElementById("CARD_NO");
  const truckStatusSelect = document.getElementById("truckStatus");

  if (!cardInput) {
    console.error("❌ CARD_NO input not found in DOM");
    return;
  }

  const cardNo = cardInput.value.trim();

  if (!cardNo) {
    showPopup("Please enter Card No");
    return;
  }

  // ✅ If SmartTags not available, default processType = 0
  let processType = 0;
  try {
    if (typeof SmartTags === "function") {
      processType = SmartTags("PROCESS_TYPE");
    }
  } catch (err) {
    console.warn("⚠️ SmartTags not found, defaulting processType = 0");
  }

  try {
    const response = await fetch("/Fan-Generation/api/check-common-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNo, processType })
    });

    if (!response.ok) {
      throw new Error("HTTP error! Status:" + response.status );
    }

    const data = await response.json();

    // === ✅ Abort flow ===
    if (data.status === "Abort") {
      // Already aborted check
      if (truckStatusSelect && truckStatusSelect.value === "13") {
        showPopup("Card No " + cardNo + " is already aborted.");
        return;
      }

      // Add "Abort" option if missing
      if (truckStatusSelect) {
        let abortOption = [...truckStatusSelect.options].find(opt => opt.value === "13");
        if (!abortOption) {
          abortOption = new Option("Abort", "13");
          truckStatusSelect.add(abortOption);
        }
        truckStatusSelect.value = "13";
      }

      // Sequential popups
      showCenterPopup("Fan Abort Successful");

      setTimeout(() => {
    // ✅ Corrected logic — same as backend
    if (Number(processType) === 0) {
      showPopup("UnLoading Successfully Aborted");
    } else {
      showPopup("Loading Successfully Aborted");
    }
  }, 3000);

      return;
    }

    // === Other responses ===
    if (data.message === "No Data") {
      showPopup("Data not found");
    } else {
      showPopup(data.message || "Unexpected response");
    }

  } catch (err) {
    console.error("❌ Error in abort flow:", err);
    showPopup("Error connecting to server or processing request");
  }
});



//============
//  Range
//============
// 🟢 Simple Popup Confirmation Helper
function confirmPopup(message) {
    return new Promise(function (resolve) {
        // Create overlay
        var overlay = document.createElement("div");
        overlay.id = "popupOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        // Create popup box
        var box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "20px 30px";
        box.style.borderRadius = "10px";
        box.style.textAlign = "center";
        box.style.fontFamily = "Arial";
        box.style.width = "350px";

        // Message
        var msg = document.createElement("p");
        msg.textContent = message;
        msg.style.marginBottom = "20px";
        msg.style.fontSize = "16px";
        box.appendChild(msg);

        // Yes button
        var yesBtn = document.createElement("button");
        yesBtn.textContent = "Yes";
        yesBtn.style.marginRight = "20px";
        yesBtn.style.padding = "6px 16px";
        yesBtn.style.border = "none";
        yesBtn.style.background = "green";
        yesBtn.style.color = "#fff";
        yesBtn.style.borderRadius = "5px";

        // No button
        var noBtn = document.createElement("button");
        noBtn.textContent = "No";
        noBtn.style.padding = "6px 16px";
        noBtn.style.border = "none";
        noBtn.style.background = "red";
        noBtn.style.color = "#fff";
        noBtn.style.borderRadius = "5px";

        // Add buttons to box
        box.appendChild(yesBtn);
        box.appendChild(noBtn);

        // Add box to overlay
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Handle clicks
        yesBtn.addEventListener("click", function () {
            document.body.removeChild(overlay);
            resolve(true);
        });
        noBtn.addEventListener("click", function () {
            document.body.removeChild(overlay);
            resolve(false);
        });
    });
}




</script>
<script>
// document.addEventListener("DOMContentLoaded", () => setBtnState("LOADED_ONLY_ASSIGN")); // will flip once data loads
// </script>
// <script>
// // helper to enable/disable buttons in one place
// function setBtnState(state){
//   const $ = (id) => document.getElementById(id);
//   const btns = {
//     assign: $("assignCardBtn"),
//     reassign: $("ReassignCardBtn"),
//     fanGen: $("FanGeneration"),
//     abort: $("FanAbortBtn"),
//     reauth: $("ReAuthBtn"),
//     reallocate: $("reAllocateBtn"),
//     checkAbort: $("checkBtn")
//   };

//   // default: all disabled
//   Object.values(btns).forEach(b => b && (b.disabled = true));

//   // states
//   if (state === "LOADED_ONLY_ASSIGN") {
//     btns.assign.disabled = false;
//   }
//   if (state === "ASSIGNED_CAN_FANGEN") {
//     btns.reassign.disabled = false;
//     btns.fanGen.disabled = false;
//   }
//   if (state === "FAN_GENERATED") {
//     btns.reassign.disabled = false;
//     btns.abort.disabled = false;
//     btns.reauth.disabled = false;
//     btns.reallocate.disabled = false;
//   }
//   if (state === "ABORTED") {
//     // everything remains disabled
//   }
// }

// // decide state from current data
// function decideStateFromData(data){
//   // PROCESS_STATUS: -1 Registered, 1 Reported, 2 Fan Generation, 4 Reauthorised, 13 Aborted
//   const ps = Number(data?.PROCESS_STATUS ?? -1);
//   const hasCard = !!data?.CARD_NO;

//   if (ps === 13) return "ABORTED";
//   if (ps === 2 || ps === 4) return "FAN_GENERATED";
//   if (hasCard) return "ASSIGNED_CAN_FANGEN";
//   return "LOADED_ONLY_ASSIGN";
// }



// -----------------------------
// New: button logic using PROCESS_STATUS + other checks
// -----------------------------
function getBtnRefs(){
  return {
    assign: document.getElementById("assignCardBtn"),
    reassign: document.getElementById("ReassignCardBtn"),
    fanGen: document.getElementById("FanGeneration"),
    abort: document.getElementById("FanAbortBtn"),
    reauth: document.getElementById("ReAuthBtn"),
    reallocate: document.getElementById("reAllocateBtn"),
    checkAbort: document.getElementById("checkBtn")
  };
}

/**
 * applyButtonLogic(data)
 * data should be the object you get from backend (combined DATA_MASTER + TRUCK_MASTER)
 * Ensures every button's enabled/disabled state considers PROCESS_STATUS, CARD_NO, blacklisting etc.
 */
function applyButtonLogic(data){
  const btns = getBtnRefs();
  // fallback: if button refs missing, do nothing
  if(!btns.assign) return;

  // Normalize values
  const ps = Number(data?.PROCESS_STATUS ?? -1); // -1 = Registered / no process
  const hasCard = Boolean(data?.CARD_NO && String(data.CARD_NO).trim() !== "");
  const batchActive = data?.BATCH_STATUS != null ? Boolean(data.BATCH_STATUS) : true;
  const blacklisted = Number(data?.BLACKLIST_STATUS) === 1;
  const invoicedOrCompleted = (ps === 14 || ps === 16); // treat these as final/completed states

  // Default: disable everything first
  Object.values(btns).forEach(b => b && (b.disabled = true));

  // If blacklisted or record not active -> only allow assign (if no card) otherwise nothing
  if (blacklisted) {
    // If blacklisted but no card assigned allow assign? usually no — keep all disabled and show popup externally
    // Keep all disabled to prevent actions
    return;
  }

  // If aborted -> disable all
  if (ps === 13) {
    return;
  }

  // If completed/invoiced -> disable all
  if (invoicedOrCompleted) {
    return;
  }

  // If no active batch (BATCH_STATUS != 1) -> only allow assign
  if (!batchActive && !hasCard) {
    btns.assign.disabled = false;
    return;
  }

  // Decision rules (common-sense defaults):
  // - If there is NO card: allow Assign (user must allocate card)
  if (!hasCard) {
    btns.assign.disabled = false;
    return;
  }

  // From here, card exists
  // If PROCESS_STATUS < 2  (i.e. Reported or Registered) -> allow Reassign and Fan Generation
  if (ps === -1 || ps === 1) {
    btns.reassign.disabled = false;
    btns.fanGen.disabled = false;
    // Allow check/abort if logically allowed (abort only if not loading)
    btns.checkAbort.disabled = (ps === 8); // if loading (8) disable abort check
    return;
  }

  // If Fan Generated (2) or Reauthorised (4):
  if (ps === 2 || ps === 4) {
    btns.reassign.disabled = false;
    btns.fanGen.disabled = true;     // already generated
    btns.reauth.disabled = false;    // allow reauth (if needed)
    btns.abort.disabled = false;     // allow abort unless loading
    btns.reallocate.disabled = false;
    btns.checkAbort.disabled = false;
    return;
  }

  // If truck is at bay or loading started (6 or 8) -> restrict some actions
  if (ps === 6) { // truck at bay
    btns.reassign.disabled = false;
    btns.reallocate.disabled = false;
    btns.abort.disabled = false;
    return;
  }

  if (ps === 8) { // Loading started - DO NOT allow abort, do not reauth
    btns.reassign.disabled = true;
    btns.reauth.disabled = true;
    btns.abort.disabled = true;
    btns.reallocate.disabled = false; // reallocate maybe allowed depending on policy
    btns.checkAbort.disabled = true;
    return;
  }

  // Exit weight accepted or further states -> restrictive
  if (ps === 15 || ps === 9 || ps === 12) {
    // allow minimal actions only (maybe reassign not allowed)
    btns.reassign.disabled = true;
    btns.reallocate.disabled = false;
    btns.abort.disabled = true;
    btns.reauth.disabled = true;
    return;
  }

  // Default fallback: if we reach here, enable safe read-only actions
  btns.reassign.disabled = false;
  btns.reallocate.disabled = false;
  btns.checkAbort.disabled = false;
}

// -----------------------------
// Backwards-compatible helper:
// keep your original setBtnState(state) for quick state strings you used elsewhere.
// But we'll keep it simpler and call applyButtonLogic when you have real data.
// -----------------------------
function setBtnState(state){
  const $ = (id) => document.getElementById(id);
  const btns = {
    assign: $("assignCardBtn"),
    reassign: $("ReassignCardBtn"),
    fanGen: $("FanGeneration"),
    abort: $("FanAbortBtn"),
    reauth: $("ReAuthBtn"),
    reallocate: $("reAllocateBtn"),
    checkAbort: $("checkBtn")
  };

  // default: all disabled
  Object.values(btns).forEach(b => b && (b.disabled = true));

  if (state === "LOADED_ONLY_ASSIGN") {
    btns.assign.disabled = false;
  }
  if (state === "ASSIGNED_CAN_FANGEN") {
    btns.reassign.disabled = false;
    btns.fanGen.disabled = false;
  }
  if (state === "FAN_GENERATED") {
    btns.reassign.disabled = false;
    btns.abort.disabled = false;
    btns.reauth.disabled = false;
    btns.reallocate.disabled = false;
  }
  if (state === "ABORTED") {
    // keep all disabled
  }
}

// -----------------------------
// Small util: call this after you have fetched the data object
// It will prefer applyButtonLogic(data) but fall back to decideStateFromData for compatibility
// -----------------------------
function updateButtonsFromData(data){
  try {
    if (data && typeof data === "object") {
      applyButtonLogic(data);
    } else {
      // fallback to old behaviour if no data
      setBtnState(decideStateFromData(data || {}));
    }
  } catch (err) {
    console.error("updateButtonsFromData error:", err);
    setBtnState("LOADED_ONLY_ASSIGN");
  }
}



// ===============================
// Enable / Disable Weight To Filled field
// ===============================
function toggleWeightField() {
    const pt = document.getElementById("processType").value;
    const weight = document.getElementById("WEIGHT_TO_FILLED");

    if (!weight) return;

    if (pt === "0") {         
        // UNLOADING → DISABLE
        weight.disabled = true;
        weight.value = ""; // optional clear
        weight.style.background = "#e8e8e8";
    } else {
        // LOADING → ENABLE
        weight.disabled = false;
        weight.style.background = "";
    }
}

// ===============================
// Trigger on dropdown change
// ===============================
document.getElementById("processType").addEventListener("change", toggleWeightField);


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
        AND BATCH_STATUS = 1
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

    // 0️⃣ Sanity
    if (!cardNo) return res.status(400).json({ message: "Card No required" });

    // 1️⃣ Check CARD_MASTER — does this card exist & is it active?
    const cardMasterResult = await pool.request()
      .input("cardNo", sql.VarChar, cardNo)
      .query(`SELECT CARD_NO, CARD_STATUS FROM CARD_MASTER WHERE CARD_NO = @cardNo`);

    if (cardMasterResult.recordset.length === 0) {
      // Card not in master at all
      return res.status(404).json({ message: `Card ${cardNo} not found in Card Master` });
    }

    const cardMasterRow = cardMasterResult.recordset[0];
    // optional: check cardStatus (0=blocked, 1=active)
    if (cardMasterRow.CARD_STATUS !== 1) {
      return res.status(400).json({ message: `Card ${cardNo} is blocked or inactive.` });
    }

    // 2️⃣ Look for an **active** DATA_MASTER row for this card (BATCH_STATUS = 1)
    const cardResult = await pool.request()
      .input("cardNo", sql.VarChar, cardNo)
      .query(`
        SELECT TOP 1 
            FAN_NO, TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, 
            ITEM_DESCRIPTION, FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED, PROCESS_STATUS
        FROM DATA_MASTER 
        WHERE CARD_NO = @cardNo
        ORDER BY FAN_TIME_OUT DESC
      `);

    // If no active DATA_MASTER row => card exists but not assigned right now
    if (cardResult.recordset.length === 0) {
      // return 404 so frontend shows "not assigned" message
      return res.status(404).json({ message: `Card ${cardNo} is not assigned to any truck.You can assign it now.`, cardExists: true });
    }

    const dataMaster = cardResult.recordset[0];

    // If the DATA_MASTER row exists but TRUCK_REG_NO is empty/null -> treat as unassigned
    if (!dataMaster.TRUCK_REG_NO || dataMaster.TRUCK_REG_NO.toString().trim() === "") {
      return res.status(404).json({ message: `Card ${cardNo} is not assigned to any truck.You can assign it now.`, cardExists: true, data: dataMaster });
    }

    // 3️⃣ If TRUCK_REG_NO present, fetch truck info (if any)
    let truckData = {};
    if (dataMaster.TRUCK_REG_NO) {
      const truckResult = await pool
        .request()
        .input("truckRegNo", sql.VarChar, dataMaster.TRUCK_REG_NO)
        .query("SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo");

      if (truckResult.recordset.length > 0) truckData = truckResult.recordset[0];
    }

    // ====== Condition Checks (only if truckData exists) ======
    const today = new Date();
    if (truckData && truckData.BLACKLIST_STATUS === 1) {
      return res.status(400).json({ message: "This truck is blacklisted." });
    }

    if (truckData && truckData.SAFETY_CERTIFICATION_NO && new Date(truckData.SAFETY_CERTIFICATION_NO) < today) {
      return res.status(400).json({ message: "Truck's safety certification date is expired." });
    }

    if (truckData && truckData.CALIBRATION_CERTIFICATION_NO && new Date(truckData.CALIBRATION_CERTIFICATION_NO) < today) {
      return res.status(400).json({ message: "Truck's calibration certificate date is expired." });
    }

    // ✅ Calculate Truck Status
    let processStatus = dataMaster.PROCESS_STATUS ?? -1;
    let truckStatusText = "Registered";
    if (processStatus === 1) truckStatusText = "Reported";
    else if (processStatus === 2) truckStatusText = "Fan Generation";

    // ✅ Return combined object
    res.json({
      ...dataMaster,
      ...truckData,
      CARD_NO: dataMaster.CARD_NO,
      PROCESS_TYPE: dataMaster.PROCESS_TYPE ?? "",
      PROCESS_STATUS: processStatus,
      TRUCK_STATUS_TEXT: truckStatusText,
    });
  } catch (err) {
    console.error("Database Error (card lookup):", err);
    res.status(500).json({ message: "Database Error", error: err.message });
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
//     function pad(n) {
//       return n < 10 ? "0" + n : n;
//     }
//     const now = new Date();
//     function getFanNo() {
  const now = new Date();
//   const pad = (n) => (n < 10 ? "0" + n : n);
//   const dd = pad(now.getDate());
//   const MM = pad(now.getMonth() + 1);
//   const yyyy = now.getFullYear();
//   const HH = pad(now.getHours());
//   const mm = pad(now.getMinutes());
//   const ss = pad(now.getSeconds());
//   return `${dd}${MM}${yyyy}${HH}${mm}${ss}`;
// }

// const fanNo = getFanNo();

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
      // .input("FAN_NO", sql.VarChar, fanNo)
      .input("FAN_TIME_OUT", sql.Int, fanTimeOutMinutes)
      .input("FAN_EXPIRY", sql.DateTime, fanExpiryUTC)
      .input("WEIGHT_TO_FILLED", sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
      .query(`
        INSERT INTO DATA_MASTER 
          (TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, PROCESS_STATUS, BATCH_STATUS,
           CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, 
           FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED)
        VALUES 
          (@TRUCK_REG_NO, @CARD_NO, @PROCESS_TYPE, @PROCESS_STATUS,  @BATCH_STATUS,
           @CUSTOMER_NAME, @ADDRESS_LINE_1, @ADDRESS_LINE_2, @ITEM_DESCRIPTION,
           @FAN_TIME_OUT, @FAN_EXPIRY, @WEIGHT_TO_FILLED)
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
  const { truckRegNo, cardNo } = req.body;

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
      return res
        .status(400)
        .json({ message: `Card ${cardNo} is BLOCKED or inactive.` });
    }

    // 2️⃣ Check if truck exists with BATCH_STATUS = 1
    const existingTruck = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(`
        SELECT CARD_NO 
        FROM DATA_MASTER 
        WHERE TRUCK_REG_NO = @truckRegNo AND BATCH_STATUS = 1
      `);

    if (existingTruck.recordset.length === 0) {
      return res.status(404).json({
        message: `No active record found for Truck ${truckRegNo}`,
      });
    }

    // ✅ If same card already assigned, skip
    if (existingTruck.recordset[0].CARD_NO === cardNo) {
      return res.status(400).json({
        message: `Truck ${truckRegNo} already has this card (${cardNo}) assigned.`,
      });
    }

    // 3️⃣ Check if this card is already used elsewhere
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

    // 4️⃣ Update only CARD_NO where BATCH_STATUS = 1
    const result = await pool
      .request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("cardNo", sql.VarChar, cardNo)
      .query(`
        UPDATE DATA_MASTER
        SET CARD_NO = @cardNo
        WHERE TRUCK_REG_NO = @truckRegNo
          AND BATCH_STATUS = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: `Card reassign failed — no active record found (BATCH_STATUS != 1).`,
      });
    }

    res.json({
      message: `Card ${cardNo} successfully re-assigned to Truck ${truckRegNo}`,
    });
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
  const { cardNo, processType } = req.body;

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
      // ✅ 2️⃣ Check DATA_MASTER PROCESS_STATUS
      const statusCheck = await pool.request()
        .input("cardNo", sql.VarChar, cardNo)
        .query(`
          SELECT TOP 1 PROCESS_STATUS 
          FROM dbo.DATA_MASTER 
          WHERE CARD_NO = @cardNo
        `);

      if (
        statusCheck.recordset.length > 0 &&
        statusCheck.recordset[0].PROCESS_STATUS === 8
      ) {
        // 🟠 If PROCESS_STATUS = 8 → show warning, don’t abort
        return res.json({
          message: "Abort not allowed while loading/unloading is active",
          popup: "First Stop Loading/Unloading before Aborted",
          writeCondition: false,
          status: "Blocked"
        });
      }

      // ✅ 3️⃣ Update DATA_MASTER table PROCESS_STATUS = 13 (abort)
      await pool.request()
        .input("cardNo", sql.VarChar, cardNo)
        .query(`
          UPDATE dbo.DATA_MASTER 
          SET PROCESS_STATUS = 13 
          WHERE CARD_NO = @cardNo
        `);

      // ✅ 4️⃣ Conditional popup message (corrected mapping)
      const popupMessage =
        processType === 0
          ? "UnLoading Successfully Aborted"
          : "Loading Successfully Aborted";

      // ✅ 5️⃣ Return both message and popup info
      res.json({
        message: "Data Exist",
        popup: popupMessage,
        writeCondition: true,
        status: "Abort"
      });
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




router.put("/api/fan-generation/generate", async (req, res) => {
  const { truckRegNo } = req.body;

  if (!truckRegNo) return res.status(400).json({ message: "Truck Reg No is required" });

  try {
    const pool = await sql.connect(dbConfig);

    // 1️⃣ Generate FAN_NO
    function pad(n) { return n < 10 ? "0" + n : n; }
    const now = new Date();
    const dd = pad(now.getDate());
    const MM = pad(now.getMonth() + 1);
    const yyyy = now.getFullYear();
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const fanNo = `${dd}${MM}${yyyy}${HH}${mm}${ss}`;

    // 2️⃣ Fetch FAN_TIME_OUT for expiry calculation
    const data = await pool.request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query("SELECT FAN_TIME_OUT FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo");

    if (data.recordset.length === 0) {
      return res.status(404).json({ message: "Truck not found in DATA_MASTER" });
    }

    const FAN_TIME_OUT = parseInt(data.recordset[0].FAN_TIME_OUT) || 0;

    // 3️⃣ Calculate expiry
    const fanExpiryLocal = new Date(now.getTime() + FAN_TIME_OUT * 60000);
    const fanExpiryUTC = new Date(
      fanExpiryLocal.getTime() - fanExpiryLocal.getTimezoneOffset() * 60000
    );

    // 4️⃣ Update record with FAN_NO and FAN_EXPIRY
    await pool.request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("FAN_NO", sql.VarChar, fanNo)
      .input("FAN_EXPIRY", sql.DateTime, fanExpiryUTC)
      .query(`
        UPDATE DATA_MASTER 
        SET FAN_NO = @FAN_NO, FAN_EXPIRY = @FAN_EXPIRY, PROCESS_STATUS = 2
        WHERE TRUCK_REG_NO = @truckRegNo
      `);

    res.json({ message: "FAN generated successfully", FAN_NO: fanNo });
  } catch (err) {
    console.error("Error generating FAN:", err);
    res.status(500).json({ message: "Server Error while generating FAN" });
  }
});

router.put("/api/fan-generation/generate", async (req, res) => {
  const { truckRegNo } = req.body;
  if (!truckRegNo) return res.status(400).json({ message: "Truck Reg No is required" });

  try {
    const pool = await sql.connect(dbConfig);

    // 🚫 PRE-CHECK: already generated?
    const existing = await pool.request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query(`
        SELECT TOP 1 FAN_NO, PROCESS_STATUS
        FROM DATA_MASTER
        WHERE TRUCK_REG_NO = @truckRegNo
        ORDER BY FAN_TIME_OUT DESC
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: "Truck not found in DATA_MASTER" });
    }

    const row = existing.recordset[0];
    if (row.FAN_NO || (row.PROCESS_STATUS != null && row.PROCESS_STATUS >= 2)) {
      return res.status(400).json({ message: "FAN already generated for this truck" });
    }

    // 1️⃣ Generate FAN_NO
    function pad(n){ return n < 10 ? "0"+n : n; }
    const now = new Date();
    const fanNo = `${pad(now.getDate())}${pad(now.getMonth()+1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // 2️⃣ Read FAN_TIME_OUT
    const tmoRes = await pool.request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .query("SELECT FAN_TIME_OUT FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo");

    const FAN_TIME_OUT = parseInt(tmoRes.recordset[0]?.FAN_TIME_OUT) || 0;

    // 3️⃣ Compute expiry (UTC)
    const fanExpiryLocal = new Date(now.getTime() + FAN_TIME_OUT * 60000);
    const fanExpiryUTC = new Date(fanExpiryLocal.getTime() - fanExpiryLocal.getTimezoneOffset() * 60000);

    // 4️⃣ Persist + set PROCESS_STATUS = 2
    await pool.request()
      .input("truckRegNo", sql.VarChar, truckRegNo)
      .input("FAN_NO", sql.VarChar, fanNo)
      .input("FAN_EXPIRY", sql.DateTime, fanExpiryUTC)
      .query(`
        UPDATE DATA_MASTER
        SET FAN_NO = @FAN_NO, FAN_EXPIRY = @FAN_EXPIRY, PROCESS_STATUS = 2
        WHERE TRUCK_REG_NO = @truckRegNo
      `);

    res.json({ message: "FAN generated successfully", FAN_NO: fanNo });
  } catch (err) {
    console.error("Error generating FAN:", err);
    res.status(500).json({ message: "Server Error while generating FAN" });
  }
});



module.exports = router;