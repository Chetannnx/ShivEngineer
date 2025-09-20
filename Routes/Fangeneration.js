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
        <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
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
          <input id="truckRegInput" style="font-family: 'DM Sans', sans-serif;" type="text" placeholder="Enter Truck Reg No">
          <button id="fetchTruckBtn" class="btn">Submit</button>
          <button onclick="window.location.reload()" class="btn" style="background:#6b7280;">Refresh</button>
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
    if (!truckRegNo) return alert("Please enter a Truck Reg No");

    try {
      const res = await fetch('/Fan-Generation/api/fan-generation/' + truckRegNo);
      if (!res.ok) {
        // Get server error message if available
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Truck not found");
      }
      const data = await res.json();

      for (const key in data) {
        const field = document.getElementById(key);
        if (field) field.value = data[key] ?? "";
      }
    } catch (err) {
      console.error(err);
      alert(err.message); // <-- now shows "Truck not found" instead of generic text
    }
}


  // Trigger fetch on Enter key
  document.getElementById("truckRegInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission/refresh
      fetchTruckData();
    }
  });

  // Trigger fetch on button click
  document.getElementById("fetchTruckBtn").addEventListener("click", fetchTruckData);
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
router.get('/api/fan-generation/:truckRegNo', async (req, res) => {
  const truckRegNo = req.params.truckRegNo;
  console.log('Fetching truck data for:', truckRegNo);

  try {
    const pool = await sql.connect(dbConfig);
    const truckResult = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    console.log('Truck Result:', truckResult.recordset);

    if (truckResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.json(truckResult.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
