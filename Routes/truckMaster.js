const express = require('express');
const sql = require('mssql/msnodesqlv8');
const dbConfig = require('../Config/dbConfig'); // ✅ proper config import

const router = express.Router();

// ===== Helper: escape HTML =====
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== Helper: escape JS for inline JS values =====
function escapeJs(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ====== GET Truck Master Page ======
router.get('/', (req, res) => {
  (async () => {
    try {
      const pool = await sql.connect(dbConfig); // ✅ now works, no top-level await
      const truckRegNo = req.query.truck?.trim();

      let truckData = {
        TRUCK_REG_NO: truckRegNo || '',
        OWNER_NAME: '',
        DRIVER_NAME: '',
        HELPER_NAME: '',
        CARRIER_COMPANY: '',
        TRUCK_SEALING_REQUIREMENT: '',
        BLACKLIST_STATUS: '',
        REASON_FOR_BLACKLIST: '',
        SAFETY_CERTIFICATION_NO: '',
        CALIBRATION_CERTIFICATION_NO: '',
        TARE_WEIGHT: '',
        MAX_WEIGHT: '',
        MAX_FUEL_CAPACITY: ''
      };

      let showInsertForm = false;

      if (truckRegNo) {
        const request = pool.request();
        request.input('truckRegNo', sql.VarChar, truckRegNo);
        const result = await request.query(
          `SELECT * FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo`
        );

        if (result.recordset.length > 0) {
          truckData = result.recordset[0];
        } else {
          showInsertForm = true;
        }
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Truck Master</title>
  <link rel="stylesheet" href="/Css/TruckMaster.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
</head>
<body>
  <nav  style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/truck-master" class="active">TRUCK MASTER</a></li>
      <li><a href="/about">FAN GENERATION</a></li>
      <li><a href="/contact">ENTRY BRIDGE</a></li>
    </ul>
  </nav>

  <h2 style="text-align:center;font-family: 'DM Sans', sans-serif;">TRUCK MASTER DATA</h2>

  <form method="GET" action="/truck-master" style="text-align:center; margin:20px;">
      <input id="TRUCK_REG_NO" style="font-family: 'DM Sans', sans-serif;" type="text" name="truck" placeholder="Enter Truck Reg No" value="${truckRegNo ?? ''}" required>
      <button style="font-family: 'DM Sans', sans-serif;" type="submit">Submit</button>
  </form>

  <div class="form-container">
    <div>
      <div class="form-group"><label>Truck Number :</label><input type="text" value="${truckData.TRUCK_REG_NO ?? ''}" readonly></div>
      <div class="form-group"><label>Owner Name :</label><input type="text" value="${truckData.OWNER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Driver Name :</label><input type="text" value="${truckData.DRIVER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Helper Name :</label><input type="text" value="${truckData.HELPER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Carrier Company :</label><input type="text" value="${truckData.CARRIER_COMPANY ?? ''}" readonly></div>
      <div class="form-group"><label>TRUCK SEALING REQUIREMENT :</label><input type="text" value="${truckData.TRUCK_SEALING_REQUIREMENT ?? ''}" readonly></div>
    </div>

    <div>
      <div class="form-group"><label>Blacklist Status :</label><input type="text" value="${truckData.BLACKLIST_STATUS ?? ''}" readonly></div>
      <div class="form-group"><label>Reason For Blacklist :</label><input type="text" value="${truckData.REASON_FOR_BLACKLIST ?? ''}" readonly></div>
      <div class="form-group"><label>Safety Cer. Valid Upto :</label><input type="text" value="${truckData.SAFETY_CERTIFICATION_NO ?? ''}" readonly></div>
      <div class="form-group"><label>Calibration Cer. Valid Upto :</label><input type="text" value="${truckData.CALIBRATION_CERTIFICATION_NO ?? ''}" readonly></div>
      <div class="form-group"><label>Tare Weight :</label><input type="text" value="${truckData.TARE_WEIGHT ?? ''}" readonly></div>
      <div class="form-group"><label>Max Weight :</label><input type="text" value="${truckData.MAX_WEIGHT ?? ''}" readonly></div>
      <div class="form-group"><label>Max Fuel Capacity :</label><input type="text" value="${truckData.MAX_FUEL_CAPACITY ?? ''}" readonly></div>
    </div>
  </div>

  ${showInsertForm ? `
  <div class="popup" id="popup">
  <div class="popup-content">
    <button class="close-btn" onclick="document.getElementById('popup').remove()">✖</button>
    <h3>Add New Truck</h3>

    <form id="insertForm" class="popup-form">
      <div class="form-group">
        <label>Truck Number:</label>
        <input name="TRUCK_REG_NO" value="${truckRegNo}" readonly>
      </div>
      <div class="form-group"><label>Blacklist Status:</label><input name="BLACKLIST_STATUS" required></div>
      <div class="form-group"><label>Owner Name:</label><input name="OWNER_NAME" required></div>
      <div class="form-group"><label>Reason for Blacklist:</label><input name="REASON_FOR_BLACKLIST" required></div>
      <div class="form-group"><label>Driver Name:</label><input name="DRIVER_NAME" required></div>
      <div class="form-group"><label>Safety Cert. Valid Upto:</label><input type="date" name="SAFETY_CERTIFICATION_NO" required></div>
      <div class="form-group"><label>Helper Name:</label><input name="HELPER_NAME" required></div>
      <div class="form-group"><label>Calibration Cert. Valid Upto:</label><input type="date" name="CALIBRATION_CERTIFICATION_NO" required></div>
      <div class="form-group"><label>Carrier Company:</label><input name="CARRIER_COMPANY" required></div>
      <div class="form-group"><label>Tare Weight:</label><input name="TARE_WEIGHT" id="tareWeight" required></div>
      <div class="form-group"><label>Truck Sealing Requirement:</label><input name="TRUCK_SEALING_REQUIREMENT" required></div>
      <div class="form-group"><label>Max Weight:</label><input name="MAX_WEIGHT" id="maxWeight" required></div>
      <div class="form-group"><label>Max Fuel Capacity:</label><input name="MAX_FUEL_CAPACITY" id="maxFuel" required></div>
      <button style="font-family: 'DM Sans', sans-serif;" type="submit" class="submit-btn">Insert</button>
    </form>
  </div>
</div>` : ''}

  <script>
(function () {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);

    // Read TRUCK_REG_NO from query string
    const truckRegNo = params.get('TRUCK_REG_NO');

    // If TRUCK_REG_NO exists, set it in input field
    if (truckRegNo) {
        const truckInput = document.getElementById('TRUCK_REG_NO');
        if (truckInput) {
            truckInput.value = truckRegNo;
        } else {
            console.warn('Input with id="TRUCK_REG_NO" not found.');
        }
    }
})();
</script>

  <script>
    const form = document.getElementById('insertForm');
    if(form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const res = await fetch('/truck-master/insert-truck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if(res.ok){
          window.location.href = '/truck-master?truck=' + data.TRUCK_REG_NO;
        } else {
          alert('Error inserting data');
        }
      });
    }
  </script>

  <script>
   const tareInput = document.getElementById('tareWeight');
   const maxInput = document.getElementById('maxWeight');
   const fuelInput = document.getElementById('maxFuel');
   function calculateFuel() {
     const tare = parseFloat(tareInput.value) || 0;
     const max = parseFloat(maxInput.value) || 0;
     fuelInput.value = tare + max;
   }
   if(tareInput && maxInput && fuelInput){
     tareInput.addEventListener('input', calculateFuel);
     maxInput.addEventListener('input', calculateFuel);
   }
  </script>

</body>
</html>`;
      res.send(html);
    } catch (err) {
      console.error('Error fetching truck data:', err);
      res.status(500).send('Error loading TRUCK MASTER DATA');
    }
  })();
});

// ====== INSERT TRUCK API ======
router.post('/insert-truck', express.json(), async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body;

    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, data.TRUCK_REG_NO)
      .input('OWNER_NAME', sql.VarChar, data.OWNER_NAME)
      .input('DRIVER_NAME', sql.VarChar, data.DRIVER_NAME)
      .input('HELPER_NAME', sql.VarChar, data.HELPER_NAME)
      .input('CARRIER_COMPANY', sql.VarChar, data.CARRIER_COMPANY)
      .input('TRUCK_SEALING_REQUIREMENT', sql.VarChar, data.TRUCK_SEALING_REQUIREMENT)
      .input('BLACKLIST_STATUS', sql.VarChar, data.BLACKLIST_STATUS)
      .input('REASON_FOR_BLACKLIST', sql.VarChar, data.REASON_FOR_BLACKLIST)
      .input('SAFETY_CERTIFICATION_NO', sql.VarChar, data.SAFETY_CERTIFICATION_NO)
      .input('CALIBRATION_CERTIFICATION_NO', sql.VarChar, data.CALIBRATION_CERTIFICATION_NO)
      .input('TARE_WEIGHT', sql.Decimal(10, 4), data.TARE_WEIGHT || 0)
      .input('MAX_WEIGHT', sql.Decimal(10, 4), data.MAX_WEIGHT || 0)
      .input('MAX_FUEL_CAPACITY', sql.Decimal(10, 4), data.MAX_FUEL_CAPACITY || 0)
      .query(`
        INSERT INTO TRUCK_MASTER (
          TRUCK_REG_NO, OWNER_NAME, DRIVER_NAME, HELPER_NAME, CARRIER_COMPANY,
          TRUCK_SEALING_REQUIREMENT, BLACKLIST_STATUS, REASON_FOR_BLACKLIST,
          SAFETY_CERTIFICATION_NO, CALIBRATION_CERTIFICATION_NO,
          TARE_WEIGHT, MAX_WEIGHT, MAX_FUEL_CAPACITY
        )
        VALUES (
          @TRUCK_REG_NO, @OWNER_NAME, @DRIVER_NAME, @HELPER_NAME, @CARRIER_COMPANY,
          @TRUCK_SEALING_REQUIREMENT, @BLACKLIST_STATUS, @REASON_FOR_BLACKLIST,
          @SAFETY_CERTIFICATION_NO, @CALIBRATION_CERTIFICATION_NO,
          @TARE_WEIGHT, @MAX_WEIGHT, @MAX_FUEL_CAPACITY
        )
      `);

    res.status(200).send('Inserted successfully');
  } catch (err) {
    console.error('Error inserting truck:', err);
    res.status(500).send('Error inserting data');
  }
});

module.exports = router;
