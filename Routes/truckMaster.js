
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
        TRAILER_NO:'',
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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
</head>
<body>
  <nav  style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/truck-master" class="active">TRUCK MASTER</a></li>
      <li><a href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a href="/contact">ENTRY BRIDGE</a></li>
    </ul>
  </nav>

 <h2 style="text-align:center;font-family: 'DM Sans', sans-serif;">
  <i class="fa-solid fa-truck-fast" style="font-size: 21px;"></i>
  TRUCK MASTER DATA
</h2>


  <form method="GET" action="/truck-master" style="text-align:center; margin:20px;">
      <input id="TRUCK_REG_NO" style="font-family: 'DM Sans', sans-serif;" type="text" name="truck" placeholder="Enter Truck Reg No" value="${truckRegNo ?? ''}" required>
      <button style="font-family: 'DM Sans', sans-serif;" type="submit">Submit</button>
      <a href="/truck-master" class="btn-reset">Refresh</a>
  </form>
  

  <div class="form-container">
    <div>
      <div class="form-group"><label>Truck Number :</label><input name="TRUCK_REG_NO" type="text" value="${truckData.TRUCK_REG_NO ?? ''}" readonly></div>
      <div class="form-group"><label>Trailer no :</label><input name="TRAILER_NO" type="text" value="${truckData.TRAILER_NO ?? ''}" readonly></div>
      <div class="form-group"><label>Owner Name :</label><input name="OWNER_NAME" type="text" value="${truckData.OWNER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Driver Name :</label><input name="DRIVER_NAME" type="text" value="${truckData.DRIVER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Helper Name :</label><input name="HELPER_NAME" type="text" value="${truckData.HELPER_NAME ?? ''}" readonly></div>
      <div class="form-group"><label>Carrier Company :</label><input name="CARRIER_COMPANY" type="text" value="${truckData.CARRIER_COMPANY ?? ''}" readonly></div>
<div class="form-group">
  <label for="truckSealingReq">TRUCK SEALING REQUIREMENT :</label>
  <select name="TRUCK_SEALING_REQUIREMENT" id="truckSealingReq" disabled>
    <option value="">-- Select --</option>
    <option value="1" ${truckData.TRUCK_SEALING_REQUIREMENT == 1 ? 'selected' : ''}>Yes</option>
    <option value="0" ${truckData.TRUCK_SEALING_REQUIREMENT == 0 ? 'selected' : ''}>No</option>
  </select>
</div>      
    </div>

    <div>
<div class="form-group">
  <label for="blacklistStatus">Blacklist Status :</label>
  <select name="BLACKLIST_STATUS" id="blacklistStatus" disabled>
    <option value="">-- Select --</option>
    <option value="1" ${truckData.BLACKLIST_STATUS == 1 ? 'selected' : ''}>Blacklist</option>
    <option value="0" ${truckData.BLACKLIST_STATUS == 0 ? 'selected' : ''}>Not_Blacklist</option>
  </select>
</div>
      <div class="form-group"><label>Reason For Blacklist :</label><input name="REASON_FOR_BLACKLIST" type="text" value="${truckData.REASON_FOR_BLACKLIST ?? ''}" readonly></div>
      <div class="form-group"><label>Safety Cer. Valid Upto :</label><input name="SAFETY_CERTIFICATION_NO" type="date" 
  value="${truckData.SAFETY_CERTIFICATION_NO ? new Date(truckData.SAFETY_CERTIFICATION_NO).toISOString().split('T')[0] : ''}" readonly>
</div>
      <div class="form-group"><label>Calibration Cer. Valid Upto :</label><input name="CALIBRATION_CERTIFICATION_NO" type="date" 
  value="${truckData.CALIBRATION_CERTIFICATION_NO ? new Date(truckData.CALIBRATION_CERTIFICATION_NO).toISOString().split('T')[0] : ''}" readonly></div>
      <div class="form-group"><label>Tare Weight :</label><input id="tareWeight" name="TARE_WEIGHT" type="text" value="${truckData.TARE_WEIGHT ?? ''}" readonly></div>
      <div class="form-group"><label>Max Weight :</label><input id="maxWeight" name="MAX_WEIGHT" type="text" value="${truckData.MAX_WEIGHT ?? ''}" readonly></div>
      <div class="form-group"><label>Max Fuel Capacity :</label><input id="maxFuel" name="MAX_FUEL_CAPACITY" type="text" value="${truckData.MAX_FUEL_CAPACITY ?? ''}" readonly></div>
    </div>
  </div>

  <div class="button-container" style="margin: 20px; text-align: left;">
    <button class="action-btn" id="editBtn">Edit</button>
    <button class="action-btn hidden" id="saveBtn" style="padding: 8px 16px; border-radius: 8px; display:none;">Save</button>
    <button class="action-btn hidden" id="cancelBtn" style="padding: 8px 16px; border-radius: 8px; display:none;">Cancel</button>
    <button class="action-btn" id="deleteBtn" style="background-color: #ff4d4d; color: white;">Delete</button>
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
      <div class="form-group"><label>Trailer no:</label><input name="TRAILER_NO" required></div>
      <div class="form-group">
  <label for="blacklistStatusPopup">Blacklist Status:</label>
  <select name="BLACKLIST_STATUS" id="blacklistStatusPopup" required>
    <option value="">-- Select --</option>
    <option value="1">Blacklist</option>
    <option value="0">Not_Blacklist</option>
  </select>
</div>
      <div class="form-group"><label>Owner Name:</label><input name="OWNER_NAME" required></div>
      <div class="form-group"><label>Reason for Blacklist:</label><input name="REASON_FOR_BLACKLIST" id="reasonBlacklistPopup" required></div>
      <div class="form-group"><label>Driver Name:</label><input name="DRIVER_NAME" required></div>
      <div class="form-group"><label>Safety Cert. Valid Upto:</label><input type="date" name="SAFETY_CERTIFICATION_NO" required></div>
      <div class="form-group"><label>Helper Name:</label><input name="HELPER_NAME" required></div>
      <div class="form-group"><label>Calibration Cert. Valid Upto:</label><input type="date" name="CALIBRATION_CERTIFICATION_NO" required></div>
      <div class="form-group"><label>Carrier Company:</label><input name="CARRIER_COMPANY" required></div>
      <div class="form-group"><label>Tare Weight:</label><input name="TARE_WEIGHT" id="inserttareWeight" required></div>
      <div class="form-group">
  <label for="truckSealingReq">Truck Sealing Requirement:</label>
  <select name="TRUCK_SEALING_REQUIREMENT" id="truckSealingReq" required>
    <option value="">-- Select --</option>
    <option value="1">Yes</option>
    <option value="0">No</option>
  </select>
</div> 
      <div class="form-group"><label>Max Weight:</label><input name="MAX_WEIGHT" id="insertmaxWeight" required></div>
      <div class="form-group"><label>Max Fuel Capacity:</label><input name="MAX_FUEL_CAPACITY" id="insertmaxFuel" required></div>
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
   function attachFuelCalculation(tareInput, maxInput, fuelInput) {
  if(!tareInput || !maxInput || !fuelInput) return;
  
  function calculate() {
    const tare = parseFloat(tareInput.value) || 0;
    const max = parseFloat(maxInput.value) || 0;
    fuelInput.value = max - tare; // optional: 2 decimals
  }

  tareInput.addEventListener('input', calculate);
  maxInput.addEventListener('input', calculate);
}

// Attach for Edit form
attachFuelCalculation(
  document.getElementById('tareWeight'),
  document.getElementById('maxWeight'),
  document.getElementById('maxFuel')
);

// Attach for Insert form
attachFuelCalculation(
  document.getElementById('inserttareWeight'),
  document.getElementById('insertmaxWeight'),
  document.getElementById('insertmaxFuel')
);

  </script>

  
<script>
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// include selects too
const inputs = document.querySelectorAll('.form-container input, .form-container select');

// ===== Add this block here =====
const blacklistSelect = document.querySelector('select[name="BLACKLIST_STATUS"]');
const reasonInput = document.querySelector('input[name="REASON_FOR_BLACKLIST"]');

const insertFormBlacklist = document.querySelector('#insertForm select[name="BLACKLIST_STATUS"]');
const insertFormReason = document.querySelector('#insertForm input[name="REASON_FOR_BLACKLIST"]');

function toggleInsertReasonField() {
  if (insertFormBlacklist.value === "1") {
    insertFormReason.removeAttribute('readonly');
  } else {
    insertFormReason.setAttribute('readonly', true);
    insertFormReason.value = ''; // optional: clear if Not_Blacklist
  }
}

//toggleInsertReasonField();

insertFormBlacklist?.addEventListener('change', toggleInsertReasonField);

function toggleReasonField() {
  if (blacklistSelect.value === "1") {
    reasonInput.removeAttribute('readonly');
  } else {
    reasonInput.setAttribute('readonly', true);
    reasonInput.value = ''; // optional: clear if Not_Blacklist
  }
}

// Run on page load in case existing data is Blacklist


// Run whenever Blacklist dropdown changes

// ===== End of block =====

editBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  inputs.forEach(input => {
    if (input.name !== "TRUCK_REG_NO") {
      input.removeAttribute('readonly');  // input fields
      if(input.tagName === 'SELECT') input.disabled = false; // select fields
    }
  });
  toggleReasonField(); // make sure reason field is correct after clicking Edit
  blacklistSelect?.addEventListener('change', toggleReasonField);
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'inline-block';
});

cancelBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.reload(); // reset values
});

saveBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  const data = {};
  inputs.forEach(input => {
    if(input.name === 'TRUCK_SEALING_REQUIREMENT' || input.name === 'BLACKLIST_STATUS'){
      data[input.name] = parseInt(input.value); // convert "0"/"1" to number
    } else {
      data[input.name] = input.value;
    }
  });

  try {
    const res = await fetch('/truck-master/update-truck', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert('Truck updated successfully');
      window.location.reload();
    } else {
      const errorText = await res.text();
      alert('Error updating data: ' + errorText);
    }
  } catch (err) {
    alert('Failed to reach server.');
  }
});




</script>

<script>
var deleteBtn = document.getElementById('deleteBtn');

if (deleteBtn) {
  deleteBtn.addEventListener('click', function (e) {
    e.preventDefault();

    var truckRegNoInput = document.querySelector('input[name="TRUCK_REG_NO"]');
    var truckRegNo = truckRegNoInput ? truckRegNoInput.value : '';

    if (!truckRegNo) {
      alert("No truck selected for deletion!");
      return;
    }

    var confirmDelete = confirm("Are you sure you want to delete Truck: " + truckRegNo + "?");
    if (!confirmDelete) return;

    fetch('/truck-master/delete-truck/' + encodeURIComponent(truckRegNo), {
      method: 'DELETE'
    })
      .then(function (res) {
        if (res.ok) {
          alert('Truck deleted successfully');
          window.location.href = '/truck-master';
        } else {
          return res.text().then(function (errorText) {
            console.error("❌ Server responded with error:", errorText);
            alert('Error deleting data: ' + errorText);
          });
        }
      })
      .catch(function (err) {
        console.error("🚨 Network/Fetch error:", err);
        alert('Failed to reach server.');
      });
  });
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
router.post('/insert-truck', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body;

    const truckSealingReq = data.TRUCK_SEALING_REQUIREMENT; // ✅ 1 or 0

    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, data.TRUCK_REG_NO)
      .input('TRAILER_NO', sql.VarChar, data.TRAILER_NO)
      .input('OWNER_NAME', sql.VarChar, data.OWNER_NAME)
      .input('DRIVER_NAME', sql.VarChar, data.DRIVER_NAME)
      .input('HELPER_NAME', sql.VarChar, data.HELPER_NAME)
      .input('CARRIER_COMPANY', sql.VarChar, data.CARRIER_COMPANY)
      .input('TRUCK_SEALING_REQUIREMENT', sql.Bit, truckSealingReq) // ✅ FIXED NAME
      .input('BLACKLIST_STATUS', sql.Bit, data.BLACKLIST_STATUS)
      .input('REASON_FOR_BLACKLIST', sql.VarChar, data.REASON_FOR_BLACKLIST)
      .input('SAFETY_CERTIFICATION_NO', sql.Date, data.SAFETY_CERTIFICATION_NO)
      .input('CALIBRATION_CERTIFICATION_NO', sql.Date, data.CALIBRATION_CERTIFICATION_NO)
      .input('TARE_WEIGHT', sql.Decimal(10, 4), data.TARE_WEIGHT || 0)
      .input('MAX_WEIGHT', sql.Decimal(10, 4), data.MAX_WEIGHT || 0)
      .input('MAX_FUEL_CAPACITY', sql.Decimal(10, 4), data.MAX_FUEL_CAPACITY || 0)
      .query(`
        INSERT INTO TRUCK_MASTER 
        (TRUCK_REG_NO, TRAILER_NO, OWNER_NAME, DRIVER_NAME, HELPER_NAME, 
         CARRIER_COMPANY, TRUCK_SEALING_REQUIREMENT, BLACKLIST_STATUS, 
         REASON_FOR_BLACKLIST, SAFETY_CERTIFICATION_NO, 
         CALIBRATION_CERTIFICATION_NO, TARE_WEIGHT, MAX_WEIGHT, MAX_FUEL_CAPACITY)
        VALUES
        (@TRUCK_REG_NO, @TRAILER_NO, @OWNER_NAME, @DRIVER_NAME, @HELPER_NAME, 
         @CARRIER_COMPANY, @TRUCK_SEALING_REQUIREMENT, @BLACKLIST_STATUS, 
         @REASON_FOR_BLACKLIST, @SAFETY_CERTIFICATION_NO, 
         @CALIBRATION_CERTIFICATION_NO, @TARE_WEIGHT, @MAX_WEIGHT, @MAX_FUEL_CAPACITY)
      `);

    res.status(201).send('✅ Truck inserted successfully');
  } catch (err) {
    console.error('❌ Error inserting truck:', err);
    res.status(500).send('Error inserting data: ' + err.message);
  }
});


  // ====== UPDATE TRUCK API ======
router.put('/update-truck', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body;

    const truckSealingReq = data.TRUCK_SEALING_REQUIREMENT; // ✅ 1 or 0

    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, data.TRUCK_REG_NO)
      .input('TRAILER_NO', sql.VarChar, data.TRAILER_NO)
      .input('OWNER_NAME', sql.VarChar, data.OWNER_NAME)
      .input('DRIVER_NAME', sql.VarChar, data.DRIVER_NAME)
      .input('HELPER_NAME', sql.VarChar, data.HELPER_NAME)
      .input('CARRIER_COMPANY', sql.VarChar, data.CARRIER_COMPANY)
      .input('TRUCK_SEALING_REQUIREMENT', sql.Bit, truckSealingReq) // ✅ FIXED NAME
      .input('BLACKLIST_STATUS', sql.Bit, data.BLACKLIST_STATUS)
      .input('REASON_FOR_BLACKLIST', sql.VarChar, data.REASON_FOR_BLACKLIST)
      .input('SAFETY_CERTIFICATION_NO', sql.Date, data.SAFETY_CERTIFICATION_NO)
      .input('CALIBRATION_CERTIFICATION_NO', sql.Date, data.CALIBRATION_CERTIFICATION_NO)
      .input('TARE_WEIGHT', sql.Decimal(10, 4), data.TARE_WEIGHT || 0)
      .input('MAX_WEIGHT', sql.Decimal(10, 4), data.MAX_WEIGHT || 0)
      .input('MAX_FUEL_CAPACITY', sql.Decimal(10, 4), data.MAX_FUEL_CAPACITY || 0)
      .query(`
        UPDATE TRUCK_MASTER SET
          TRAILER_NO = @TRAILER_NO,
          OWNER_NAME = @OWNER_NAME,
          DRIVER_NAME = @DRIVER_NAME,
          HELPER_NAME = @HELPER_NAME,
          CARRIER_COMPANY = @CARRIER_COMPANY,
          TRUCK_SEALING_REQUIREMENT = @TRUCK_SEALING_REQUIREMENT,
          BLACKLIST_STATUS = @BLACKLIST_STATUS,
          REASON_FOR_BLACKLIST = @REASON_FOR_BLACKLIST,
          SAFETY_CERTIFICATION_NO = @SAFETY_CERTIFICATION_NO,
          CALIBRATION_CERTIFICATION_NO = @CALIBRATION_CERTIFICATION_NO,
          TARE_WEIGHT = @TARE_WEIGHT,
          MAX_WEIGHT = @MAX_WEIGHT,
          MAX_FUEL_CAPACITY = @MAX_FUEL_CAPACITY
        WHERE TRUCK_REG_NO = @TRUCK_REG_NO
      `);

    res.status(200).send('✅ Truck updated successfully');
  } catch (err) {
    console.error('❌ Error updating truck:', err);
    res.status(500).send('Error updating data: ' + err.message);
  }
});


// ====== DELETE TRUCK API (delete from DATA_MASTER + TRUCK_MASTER) ======
router.delete('/delete-truck/:truckRegNo', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const truckRegNo = req.params.truckRegNo.trim();

    // 1. Delete related records in DATA_MASTER
    await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('DELETE FROM DATA_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    // 2. Delete from TRUCK_MASTER
    const result = await pool.request()
      .input('truckRegNo', sql.VarChar, truckRegNo)
      .query('DELETE FROM TRUCK_MASTER WHERE TRUCK_REG_NO = @truckRegNo');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send('Truck not found');
    }

    res.status(200).send('Truck and related records deleted successfully');
  } catch (err) {
    console.error('❌ Error deleting truck:', err);
    res.status(500).send('Error deleting data: ' + err.message);
  }
});

module.exports = router;
