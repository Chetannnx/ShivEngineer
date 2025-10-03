  const express = require('express');
  const sql = require('mssql/msnodesqlv8');
  const dbConfig = require('../Config/dbConfig');
  const router = express.Router();

  // Serve the Fan Generation HTML page
  router.get('/', async (req, res) => {
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
    <button type="button" id="ReassignCardBtn" class="btn">Re Assign Card</button>
    <button type="button" id="FanGeneration" class="btn">Fan Generation</button>
  
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
  </select>
</div>
              <div class="form-group"><label>Fan Time Out :</label><input id="FAN_TIME_OUT" name="FAN_TIME_OUT" type="text"></div>
              <div class="form-group three-inputs">
  <label>Weight Filled:</label>
  <input type="text" id="MIN" name="MAX1" placeholder="Min" readonly>
  <input type="number" id="WEIGHT_TO_FILLED" name="WEIGHT_TO_FILLED" placeholder="Weight to Fill">
  <input type="text" id="MAX" name="MAX2" placeholder="Max">
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

    <button id="savePdfBtn">Save PDF</button>
    <button onclick="closePopup()">Close</button>
  </div>
</div>

  
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
        return alert("Please enter Truck No or Card Allocated No");
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));

            // Special handling for card already assigned
            if (res.status === 400 && errorData.truckRegNo) {
                alert("This Card (" + (truckRegNo || cardNo) + ") is already registered with Truck " + errorData.truckRegNo);
                return;
            }

            throw new Error(errorData.message || "Truck or Card not found");
        }

        const data = await res.json();

        // Fill all fields
        const allFields = [
            "TRUCK_REG_NO", "TRAILER_NO", "OWNER_NAME", "DRIVER_NAME", "HELPER_NAME", "CARRIER_COMPANY",
            "TRUCK_SEALING_REQUIREMENT", "BLACKLIST_STATUS", "REASON_FOR_BLACKLIST",
            "SAFETY_CERTIFICATION_NO", "CALIBRATION_CERTIFICATION_NO",
            "TARE_WEIGHT", "MAX_WEIGHT", "MAX_FUEL_CAPACITY",
            "CUSTOMER_NAME", "ADDRESS_LINE_1", "ADDRESS_LINE_2", "ITEM_DESCRIPTION",
            "FAN_TIME_OUT", "WEIGHT_TO_FILLED", "CARD_NO"
        ];

        // Format date fields
        function formatDate(dateStr) {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
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


      

      // Set the Process Type select value
  const processTypeField = document.getElementById("processType");
  if (processTypeField && data.PROCESS_TYPE != null) {
    processTypeField.value = data.PROCESS_TYPE;
  }

  // ✅ Set Truck Status dropdown based on PROCESS_STATUS
if (data.PROCESS_STATUS !== undefined) {
  document.getElementById("truckStatus").value = data.PROCESS_STATUS;
} else {
  document.getElementById("truckStatus").value = "-1"; // default Registered
}

// ✅ Fill the top Truck Reg No input separately
document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";

          // ✅ Fill the top Truck Reg No input separately
      document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";

      // After filling all fields:
  document.getElementById("truckStatus").value = data.PROCESS_STATUS ?? "-1";

  // Enable or disable Reassign button based on CARD_NO presence
const reassignBtn = document.getElementById("ReassignCardBtn");
if (reassignBtn) {
    if (data.CARD_NO) {
        reassignBtn.disabled = false;  // enable if truck already has card
    } else {
        reassignBtn.disabled = true;   // disable if no card
    }
}


// Set Min = 0 and Max = MAX_FUEL_CAPACITY
const minField = document.getElementById("MIN");
const maxField = document.getElementById("MAX");
const weightField = document.getElementById("WEIGHT_TO_FILLED");

if (minField) minField.value = 0;
if (maxField) maxField.value = data.MAX_FUEL_CAPACITY ?? 0;

// Enforce max validation when user types
if (weightField) {
  weightField.max = data.MAX_FUEL_CAPACITY ?? 0;

  weightField.addEventListener("input", function() {
    const maxVal = parseFloat(this.max);
    let val = parseFloat(this.value) || 0;
    if (val > maxVal) this.value = maxVal;
    if (val < 0) this.value = 0;
  });
}



    } catch (err) {
      console.error(err);
      alert(err.message);
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
            alert("Card Assigned Successfully!");
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
        alert("Card Reassigned Successfully!");
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

document.getElementById("FanGeneration").addEventListener("click", function () {
  var truckRegNo = document.getElementById("truckRegInput").value.trim();
  if (!truckRegNo) {
    alert("Enter Truck No first!");
    return;
  }

  // Fetch truck data (using .then instead of async/await)
  fetch('/Fan-Generation/api/fan-generation/truck/' + truckRegNo)
    .then(function (res) {
      if (!res.ok) throw new Error("Truck not found");
      return res.json();
    })
    .then(function (data) {
      // Generate FAN_NO and DATE_TIME
      var now = new Date();

      function pad(n) {
        return n < 10 ? '0' + n : n;
      }

      // var fanNo = pad(now.getDate()) + 
      //             pad(now.getMonth() + 1) +  // months start from 0
      //             now.getFullYear() +
      //             pad(now.getHours()) +
      //             pad(now.getMinutes()) +
      //             pad(now.getSeconds());

      var dateTime = now.toLocaleString();
      //var expiry = new Date(now.getTime() + (24 * 60 * 60 * 1000)).toLocaleString(); // +1 day expiry


      // Fill popup values
       document.getElementById("FAN_NO").textContent = data.FAN_NO || "";
      document.getElementById("POP_CARD_NO").textContent = data.CARD_NO || "";
      document.getElementById("DATE_TIME").textContent = dateTime;

      // <-- Correct: format FAN_EXPIRY to HH:MM
      if (data.FAN_EXPIRY) {
    var dt = new Date(data.FAN_EXPIRY);
    var day = String(dt.getUTCDate()).padStart(2, '0');
    var month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    var year = dt.getUTCFullYear();
    var hours = String(dt.getUTCHours()).padStart(2, '0');
    var minutes = String(dt.getUTCMinutes()).padStart(2, '0');

    document.getElementById("FAN_EXPIRY").textContent = day + "/" + month + "/" + year + " " + hours + ":" + minutes;
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
    })
    .catch(function (err) {
      alert("Error: " + err.message);
    });
});

document.getElementById("savePdfBtn").addEventListener("click", function () {
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

  // Open print dialog directly
  var pdfBlob = doc.output("blob");
  var pdfUrl = URL.createObjectURL(pdfBlob);
  var printWindow = window.open(pdfUrl);
  printWindow.addEventListener("load", function () {
    printWindow.print();
  });
});

document.getElementById("FanGeneration").addEventListener("click", async () => {
  try {
    const truckRegNo = document.getElementById("truckRegInput").value.trim();
    if (!truckRegNo) return alert("Enter Truck No first!");

    // Fetch data from your API
    const res = await fetch('/Fan-Generation/api/fan-generation/truck/' + truckRegNo);
    if (!res.ok) throw new Error("Truck not found");
    const data = await res.json();

    // ...fill popup values and show it
  } catch(err) {
    alert("Error: " + err.message);
  }
});

</script>


        </body>
        </html>
      `;
      res.send(html);
    } catch (err) {
      console.error('Error loading Fan Generation page:', err);
      res.status(500).send('Error loading Fan Generation page: ' + err.message);
    }
  });


  // Unified API: Fetch by Truck No OR Card Allocated No
 // =========================
// 🔹 1. Search by Truck Reg No
// =========================
router.get('/api/fan-generation/truck/:truckRegNo', async (req, res) => {
  const truckRegNo = req.params.truckRegNo?.trim();

  try {
    const pool = await sql.connect(dbConfig);

    // Fetch Truck info
    const truckResult = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    if (truckResult.recordset.length === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const truckData = truckResult.recordset[0];
    let dataMaster = {};

    // Fetch latest DATA_MASTER for this truck
    const dataResult = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query(`
        SELECT TOP 1 
            FAN_NO,TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, 
            ITEM_DESCRIPTION, FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED 
        FROM DATA_MASTER 
        WHERE TRUCK_REG_NO = @truckRegNo 
        ORDER BY FAN_TIME_OUT DESC
      `);

    if (dataResult.recordset.length > 0) {
      dataMaster = dataResult.recordset[0];
    }

    // ✅ Calculate Truck Status
    const processStatus = dataMaster.CARD_NO ? 1 : -1;  
    const truckStatusText = processStatus === 1 ? "Reported" : "Registered";

    res.json({
      ...dataMaster,
      ...truckData,
      CARD_NO: dataMaster.CARD_NO,
      PROCESS_TYPE: dataMaster.PROCESS_TYPE ?? "",
      PROCESS_STATUS: processStatus,
      TRUCK_STATUS_TEXT: truckStatusText
    });

  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
});


// =========================
// 🔹 2. Search by Card No
// =========================
router.get('/api/fan-generation/card/:cardNo', async (req, res) => {
  const cardNo = req.params.cardNo?.trim();

  try {
    const pool = await sql.connect(dbConfig);

    // Fetch latest data by Card No
    const cardResult = await pool.request()
      .input('cardNo', sql.VarChar, cardNo)
      .query(`
        SELECT TOP 1 
            FAN_NO,TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, 
            ITEM_DESCRIPTION, FAN_TIME_OUT,FAN_EXPIRY, WEIGHT_TO_FILLED 
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
      const truckResult = await pool.request()
        .input('truckRegNo', sql.VarChar, dataMaster.TRUCK_REG_NO)
        .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

      if (truckResult.recordset.length > 0) {
        truckData = truckResult.recordset[0];
      }
    }

    // ✅ Calculate Truck Status
    const processStatus = dataMaster.CARD_NO ? 1 : -1;
    const truckStatusText = processStatus === 1 ? "Reported" : "Registered";

    res.json({
      ...dataMaster,
      ...truckData,
      CARD_NO: dataMaster.CARD_NO,
      PROCESS_TYPE: dataMaster.PROCESS_TYPE ?? "",
      PROCESS_STATUS: processStatus,
      TRUCK_STATUS_TEXT: truckStatusText
    });

  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
});




  // Fetch by Card No (with Truck Master fallback)
  // router.get('/api/fan-generation/card/:cardNo', async (req, res) => {
  //   const cardNo = req.params.cardNo;
  //   try {
  //     const pool = await sql.connect(dbConfig);

  //     // 1️⃣ Get Data Master by Card
  //     const dataResult = await pool.request()
  //       .input('cardNo', sql.VarChar, cardNo)
  //       .query('SELECT TOP 1 * FROM DATA_MASTER WHERE CARD_NO = @cardNo ORDER BY FAN_TIME_OUT DESC');

  //     if (dataResult.recordset.length === 0) {
  //       return res.status(404).json({ message: "Card not found in DATA_MASTER" });
  //     }

  //     const dataMaster = dataResult.recordset[0];

  //     // Safety: Trim Truck No before query (in case of spaces)
  //     const truckRegNo = (dataMaster.TRUCK_REG_NO || "").trim();

  //     // 2️⃣ Always try to get TRUCK_MASTER (if truckRegNo is available)
  //     let truckData = {};
  //     if (truckRegNo) {
  //       const truckResult = await pool.request()
  //         .input('truckRegNo', sql.VarChar, truckRegNo)
  //         .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

  //       if (truckResult.recordset.length > 0) {
  //         truckData = truckResult.recordset[0];
  //       }
  //     }

  //     // 3️⃣ Merge truck master + data master
  //     const mergedData = { ...truckData, ...dataMaster };

  //     // If truck data missing, still return dataMaster to show CARD info
  //     res.json(mergedData);
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ message: "Database Error" });
  //   }
  // });


 // API route: Assign Card & Save to DATA_MASTER
  router.post('/api/assign-card', async (req, res) => {
  const { 
    truckRegNo, 
    cardNo, 
    processType, 
    CUSTOMER_NAME, 
    ADDRESS_LINE_1, 
    ADDRESS_LINE_2, 
    ITEM_DESCRIPTION, 
    FAN_TIME_OUT, 
    WEIGHT_TO_FILLED 
  } = req.body;

  if (!truckRegNo || !cardNo) {
    return res.status(400).json({ message: "Truck Reg No and Card No are required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // 1️⃣ Check if card exists in CARD_MASTER
    const cardCheck = await pool.request()
      .input('cardNo', sql.VarChar, cardNo)
      .query('SELECT CARD_STATUS FROM CARD_MASTER WHERE CARD_NO = @cardNo');

    if (cardCheck.recordset.length === 0) {
      return res.status(401).json({ message: `Card ${cardNo} not found in Card Master (Unauthorized).` });
    }

    const cardStatus = cardCheck.recordset[0].CARD_STATUS;
    if (cardStatus !== 1) { // assuming 1 = active, 0 = blocked
      return res.status(400).json({ message: `Card ${cardNo} is BLOCKED or inactive.` });
    }

   // Check if this truck already has a card
      const existing = await pool.request()
        .input('truckRegNo', sql.VarChar, truckRegNo)
        .query('SELECT CARD_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

      if (existing.recordset.length > 0) {
        // Truck already has a card → don't allow assigning another
        return res.status(400).json({ message: `Truck ${truckRegNo} already has a card allocated (${existing.recordset[0].CARD_NO})` });
      }

      // 2️⃣ Check if this CARD_NO is already assigned to another truck
      const existingCard = await pool.request()
        .input('cardNo', sql.VarChar, cardNo)
        .query('SELECT TRUCK_REG_NO FROM DATA_MASTER WHERE CARD_NO = @cardNo');

      if (existingCard.recordset.length > 0) {
        return res.status(400).json({ 
          message: `Card ${cardNo} is already assigned to Truck ${existingCard.recordset[0].TRUCK_REG_NO}`
        });
      }

    // 4️⃣ Generate FAN_NO (ddMMyyyyHHmmss)
    function pad(n) { return n < 10 ? '0' + n : n; }
    const now = new Date();
    const fanNo = pad(now.getDate()) + pad(now.getMonth() + 1) + now.getFullYear() +
                  pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());

    // 5️⃣ Calculate FAN_EXPIRY (UTC)
    const fanTimeOutMinutes = parseInt(FAN_TIME_OUT) || 0;
    const fanExpiryLocal = new Date(now.getTime() + fanTimeOutMinutes * 60000);
    const fanExpiryUTC = new Date(fanExpiryLocal.getTime() - fanExpiryLocal.getTimezoneOffset() * 60000);

    // 6️⃣ Insert new record into DATA_MASTER
    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, truckRegNo)
      .input('CARD_NO', sql.VarChar, cardNo)
      .input('PROCESS_TYPE', sql.Int, parseInt(processType))
      .input('PROCESS_STATUS', sql.Int, 1) // 1 = Reported
      .input('CUSTOMER_NAME', sql.VarChar, CUSTOMER_NAME || "")
      .input('ADDRESS_LINE_1', sql.VarChar, ADDRESS_LINE_1 || "")
      .input('ADDRESS_LINE_2', sql.VarChar, ADDRESS_LINE_2 || "")
      .input('ITEM_DESCRIPTION', sql.VarChar, ITEM_DESCRIPTION || "")
      .input('FAN_NO', sql.VarChar, fanNo)
      .input('FAN_TIME_OUT', sql.Int, fanTimeOutMinutes)
      .input('FAN_EXPIRY', sql.DateTime, fanExpiryUTC)
      .input('WEIGHT_TO_FILLED', sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
      .query(`
        INSERT INTO DATA_MASTER 
          (TRUCK_REG_NO, CARD_NO, PROCESS_TYPE, PROCESS_STATUS, 
           CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, 
           FAN_NO, FAN_TIME_OUT, FAN_EXPIRY, WEIGHT_TO_FILLED)
        VALUES 
          (@TRUCK_REG_NO, @CARD_NO, @PROCESS_TYPE, @PROCESS_STATUS,
           @CUSTOMER_NAME, @ADDRESS_LINE_1, @ADDRESS_LINE_2, @ITEM_DESCRIPTION,
           @FAN_NO, @FAN_TIME_OUT, @FAN_EXPIRY, @WEIGHT_TO_FILLED)
      `);

    res.json({ message: `Card ${cardNo} assigned to Truck ${truckRegNo} successfully` });

  } catch (err) {
    console.error("Error in /api/assign-card:", err);
    res.status(500).json({ message: "Database Error" });
  }
});



 // API route: Reassign Card (Update existing record)
router.put('/api/reassign-card', async (req, res) => {
  const { truckRegNo, cardNo, processType, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, FAN_TIME_OUT, WEIGHT_TO_FILLED } = req.body;

  if (!truckRegNo || !cardNo)
    return res.status(400).json({ message: "Truck Reg No and Card No are required" });

  try {
    const pool = await sql.connect(dbConfig);

    // 1️⃣ Check if card exists in CARD_MASTER
    const cardCheck = await pool.request()
      .input('cardNo', sql.VarChar, cardNo)
      .query('SELECT CARD_STATUS FROM CARD_MASTER WHERE CARD_NO = @cardNo');

    if (cardCheck.recordset.length === 0) {
      return res.status(401).json({ message: `Card ${cardNo} not found in Card Master (Unauthorized).` });
    }

    const cardStatus = cardCheck.recordset[0].CARD_STATUS;
    if (cardStatus !== 1) { // assuming 1 = active, 0 = blocked
      return res.status(400).json({ message: `Card ${cardNo} is BLOCKED or inactive.` });
    }

    // 1️⃣ Check if truck exists
    const existing = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('SELECT CARD_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: `Truck ${truckRegNo} not found. Please assign a card first.` });
    }

    // ✅ If truck already has the same card, no need to reassign
    if (existing.recordset[0].CARD_NO === cardNo) {
      return res.status(400).json({ 
        message: `Truck ${truckRegNo} already has this card (${cardNo}) assigned`
      });
    }

    // 2️⃣ Check if this CARD_NO is already assigned to another truck
    const existingCard = await pool.request()
      .input('cardNo', sql.VarChar, cardNo)
      .query('SELECT TRUCK_REG_NO FROM DATA_MASTER WHERE CARD_NO = @cardNo');

    if (existingCard.recordset.length > 0 && existingCard.recordset[0].TRUCK_REG_NO !== truckRegNo) {
      return res.status(400).json({ 
        message: `Card ${cardNo} is already assigned to Truck ${existingCard.recordset[0].TRUCK_REG_NO}`
      });
    }

    // 3️⃣ Safe to update
    const updateResult = await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, truckRegNo)
      .input('CARD_NO', sql.VarChar, cardNo)
      .input('PROCESS_TYPE', sql.Int, parseInt(processType) || 0)
      .input('CUSTOMER_NAME', sql.VarChar, CUSTOMER_NAME || "")
      .input('ADDRESS_LINE_1', sql.VarChar, ADDRESS_LINE_1 || "")
      .input('ADDRESS_LINE_2', sql.VarChar, ADDRESS_LINE_2 || "")
      .input('ITEM_DESCRIPTION', sql.VarChar, ITEM_DESCRIPTION || "")
      .input('FAN_TIME_OUT', sql.Int, parseInt(FAN_TIME_OUT) || 0)
      .input('WEIGHT_TO_FILLED', sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
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
      return res.status(500).json({ message: "Reassign failed, no rows were updated." });
    }

    res.json({ message: "Card re-assigned successfully" });

  } catch (err) {
    console.error("Reassign Card Error:", err);
    res.status(500).json({ message: "Database Error: " + err.message });
  }
});

  module.exports = router;