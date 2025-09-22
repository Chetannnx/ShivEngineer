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

<div class="top-actions">
  <div class="input-group">
    <label for="truckStatus">Truck Status:</label>
    <input id="truckStatus" type="text" placeholder="Truck Status">
  </div>

  <div class="input-group">
    <label for="processType">Process Type:</label>
    <select id="processType">
      <option value="1">Loading</option>
      <option value="0">Unloading</option>
    </select>
  </div>
</div>
</div>

<div class="top-actions1">
  <button type="button" id="assignCardBtn" class="btn">Assign Card</button>
</div>
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
            <div class="form-group"><label>Item Description :</label><input id="ITEM_DESCRIPTION" name="ITEM_DESCRIPTION" type="text"></div>
            <div class="form-group"><label>Fan Time Out :</label><input id="FAN_TIME_OUT" name="FAN_TIME_OUT" type="time"></div>
            <div class="form-group"><label>Weight to Fill :</label><input id="WEIGHT_TO_FILLED" name="WEIGHT_TO_FILLED" type="number"></div>
          </div>
        </div>

        

        <!-- Inline Script -->
        <script>
  // Define the fetch function
 async function fetchTruckData() {
  const truckRegNo = document.getElementById("truckRegInput").value.trim();
  const cardNo = document.getElementById("CARD_NO").value.trim();

  if (!truckRegNo && !cardNo) return alert("Please enter Truck No or Card Allocated No");

  try {
    // ✅ Use unified route for both
    const inputValue = truckRegNo || cardNo;
    const url = '/Fan-Generation/api/fan-generation/truck/' + inputValue;

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Truck or Card not found");
    }

    const data = await res.json();

    // Map CARD_NO to CARD_NO
    if (data.CARD_NO) data.CARD_NO = data.CARD_NO;

    // Fill all fields
    const allFields = [
      "TRUCK_REG_NO", "TRAILER_NO", "OWNER_NAME", "DRIVER_NAME", "HELPER_NAME", "CARRIER_COMPANY",
      "TRUCK_SEALING_REQUIREMENT", "BLACKLIST_STATUS", "REASON_FOR_BLACKLIST",
      "SAFETY_CERTIFICATION_NO", "CALIBRATION_CERTIFICATION_NO",
      "TARE_WEIGHT", "MAX_WEIGHT", "MAX_FUEL_CAPACITY",
      "CUSTOMER_NAME", "ADDRESS_LINE_1", "ADDRESS_LINE_2", "ITEM_DESCRIPTION",
      "FAN_TIME_OUT", "WEIGHT_TO_FILLED", "CARD_NO"
    ];
    allFields.forEach(id => {
      const field = document.getElementById(id);
      if (field) field.value = data[id] ?? "";
    });

        // ✅ Fill the top Truck Reg No input separately
    document.getElementById("truckRegInput").value = data.TRUCK_REG_NO || "";


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

      try {
        const res = await fetch('/Fan-Generation/api/assign-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            truckRegNo, cardNo,
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

// API route: Fetch Truck Master + optional Fan Generation data
// Fetch by Truck No (existing)
// Fetch by Card No (with Truck Master details)
// Fetch by Truck No (with Truck Master + Data Master)
// Unified API: Fetch by Truck No OR Card Allocated No
// Unified API: Fetch by Truck No OR Card Allocated No
// Unified API: Fetch by Truck No OR Card Allocated No
router.get('/api/fan-generation/truck/:inputValue', async (req, res) => {
  const inputValue = req.params.inputValue?.trim();
  try {
    const pool = await sql.connect(dbConfig);

    let truckData = {};
    let dataMaster = {};

    // 1️⃣ Try fetching as Truck No first
    const truckResult = await pool.request()
      .input('truckRegNo', sql.VarChar, inputValue)
      .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    if (truckResult.recordset.length > 0) {
      truckData = truckResult.recordset[0];

      // Fetch latest DATA_MASTER for this truck
      const dataResult = await pool.request()
        .input('truckRegNo', sql.VarChar, truckData.TRUCK_REG_NO)
        .query('SELECT TOP 1 * FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo ORDER BY FAN_TIME_OUT DESC');

      if (dataResult.recordset.length > 0) {
        dataMaster = dataResult.recordset[0];
      }

      return res.json({
  ...dataMaster,
  ...truckData, // overwrite TRUCK_REG_NO from truckData
  CARD_NO: dataMaster.CARD_NO
});
    }

    // 2️⃣ If not found as Truck, try Card No
    const cardResult = await pool.request()
      .input('cardNo', sql.VarChar, inputValue)
      .query('SELECT TOP 1 * FROM DATA_MASTER WHERE CARD_NO = @cardNo ORDER BY FAN_TIME_OUT DESC');

    if (cardResult.recordset.length === 0) {
      return res.status(404).json({ message: "Truck or Card not found" });
    }

    dataMaster = cardResult.recordset[0];

    // Fetch truck info if TRUCK_REG_NO exists in dataMaster
    if (dataMaster.TRUCK_REG_NO) {
      const truckResultByCard = await pool.request()
        .input('truckRegNo', sql.VarChar, dataMaster.TRUCK_REG_NO)
        .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

      if (truckResultByCard.recordset.length > 0) {
        truckData = truckResultByCard.recordset[0];
      }
    }

    // Merge truck info + dataMaster
   // Merge truck info + dataMaster, but ensure TRUCK_REG_NO is filled
res.json({
  ...dataMaster,
  ...truckData, // overwrite TRUCK_REG_NO from truckData
  CARD_NO: dataMaster.CARD_NO
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
  const { truckRegNo, cardNo, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, FAN_TIME_OUT, WEIGHT_TO_FILLED } = req.body;

  if (!truckRegNo || !cardNo) 
    return res.status(400).json({ message: "Truck Reg No and Card No are required" });

  try {
    const pool = await sql.connect(dbConfig);

    // Check if this truck already has a card
    const existing = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('SELECT CARD_NO FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    if (existing.recordset.length > 0) {
      // Truck already has a card → don't allow assigning another
      return res.status(400).json({ message: `Truck ${truckRegNo} already has a card allocated (${existing.recordset[0].CARD_NO})` });
    }

    // Truck has no card → assign new card
    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, truckRegNo)
      .input('CARD_NO', sql.VarChar, cardNo)
      .input('CUSTOMER_NAME', sql.VarChar, CUSTOMER_NAME || "")
      .input('ADDRESS_LINE_1', sql.VarChar, ADDRESS_LINE_1 || "")
      .input('ADDRESS_LINE_2', sql.VarChar, ADDRESS_LINE_2 || "")
      .input('ITEM_DESCRIPTION', sql.VarChar, ITEM_DESCRIPTION || "")
      .input('FAN_TIME_OUT', sql.Int, parseInt(FAN_TIME_OUT) || 0)
      .input('WEIGHT_TO_FILLED', sql.BigInt, parseInt(WEIGHT_TO_FILLED) || 0)
      .query(`INSERT INTO DATA_MASTER 
              (TRUCK_REG_NO, CARD_NO, CUSTOMER_NAME, ADDRESS_LINE_1, ADDRESS_LINE_2, ITEM_DESCRIPTION, FAN_TIME_OUT, WEIGHT_TO_FILLED)
              VALUES (@TRUCK_REG_NO, @CARD_NO, @CUSTOMER_NAME, @ADDRESS_LINE_1, @ADDRESS_LINE_2, @ITEM_DESCRIPTION, @FAN_TIME_OUT, @WEIGHT_TO_FILLED)`);

    res.json({ message: "Card assigned successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database Error" });
  }
});



module.exports = router;
