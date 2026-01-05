
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
// ===== Helper: format date as MM/DD/YYYY =====
function formatMMDDYYYY(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d)) return '-';

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
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
      const search = req.query.search ? req.query.search.trim() : '';

      const pool = await sql.connect(dbConfig); // ✅ now works, no top-level await
      // ===== Truck Table Data =====
let tableQuery = `
  SELECT 
    TRUCK_REG_NO,
    BLACKLIST_STATUS,
    SAFETY_CERTIFICATION_NO,
    CALIBRATION_CERTIFICATION_NO
  FROM TRUCK_MASTER
`;

if (search) {
  tableQuery += ` WHERE TRUCK_REG_NO LIKE @search `;
}

tableQuery += ` ORDER BY TRUCK_REG_NO`;

const tableRequest = pool.request();
if (search) {
  tableRequest.input('search', sql.VarChar, `%${search}%`);
}

const tableResult = await tableRequest.query(tableQuery);
const truckTableData = tableResult.recordset;


// ===== Truck Table HTML =====
const truckTableHTML = `
<div class="table-wrapper">
  <table class="truck-table">
    <thead>
    <!-- 🔍 SEARCH ROW INSIDE TABLE -->
      <tr class="table-controls">
        <th colspan="6">
          <form method="GET" action="/truck-master" class="table-search">
            <input
              type="text"
              name="search"
              placeholder="Search Truck Reg No..."
              value="${escapeHtml(search)}"
            />
            <a href="/truck-master" class="icon-btn"><i class="fa">&#xf021;</i></a>
          </form>
        </th>
      </tr>
    
      <tr>
        <th>
          <input type="checkbox" id="selectAll">
        </th>
        <th>Truck Reg No</th>
        <th>Blacklist Status</th>
        <th>Safety Cert Valid Upto</th>
        <th>Calibration Cert Valid Upto</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody>
      ${truckTableData.map(row => `
        <tr>
        <!-- Select checkbox -->
  <td>
    <input 
      type="checkbox" 
      class="row-checkbox"
      value="${escapeHtml(row.TRUCK_REG_NO)}"
    >
  </td>
          <td>${escapeHtml(row.TRUCK_REG_NO)}</td>
          <td>
            <span class="status ${row.BLACKLIST_STATUS ? 'blacklisted' : 'not-blacklisted'}">
              ${row.BLACKLIST_STATUS ? 'Blacklisted' : 'Not Blacklisted'}
            </span>
          </td>
          <td>
            ${formatMMDDYYYY(row.SAFETY_CERTIFICATION_NO)}

          </td>
          <td>
            ${formatMMDDYYYY(row.CALIBRATION_CERTIFICATION_NO)}

            <td>
    <button 
      class="action-btn edit-btn"
      onclick="editTruck('${escapeJs(row.TRUCK_REG_NO)}')">
      Edit
    </button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
`;

      // ===== Truck Count Summary (LIKE CARD MASTER) =====
const countResult = await pool.request().query(`
  SELECT 
    COUNT(*) AS totalTruck,
    SUM(CASE WHEN BLACKLIST_STATUS = 0 THEN 1 ELSE 0 END) AS notBlacklistCount,
    SUM(CASE WHEN BLACKLIST_STATUS = 1 THEN 1 ELSE 0 END) AS blacklistCount
  FROM TRUCK_MASTER
`);

const totalTruck = countResult.recordset[0].totalTruck || 0;
const notBlacklistCount = countResult.recordset[0].notBlacklistCount || 0;
const blacklistCount = countResult.recordset[0].blacklistCount || 0;

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

      // ===== Truck Summary Cards HTML =====
const totalTruckHTML = `
<div class="card-container">

  <!-- Total Trucks -->
  <div class="stat-card">
    <div>
      <p class="title">Total Trucks</p>
      <h2>${totalTruck}</h2>
    </div>
    <div class="icon blue">
      <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
        <span class="material-icons-outlined">local_shipping</span>
      </div>
    </div>
  </div>

  <!-- Not Blacklisted -->
  <div class="stat-card1">
    <div>
      <p class="title">Not Blacklisted</p>
      <h2 class="green">${notBlacklistCount}</h2>
    </div>
    <div class="icon green">
      <div class="p-3 bg-green-100 rounded-lg text-green-600">
        <span class="material-icons-outlined">check_circle</span>
      </div>
    </div>
  </div>

  <!-- Blacklisted -->
  <div class="stat-card2">
    <div>
      <p class="title">Blacklisted</p>
      <h2 class="red">${blacklistCount}</h2>
    </div>
    <div class="icon red">
      <div class="p-3 bg-red-100 rounded-lg text-red-600">
        <span class="material-icons-outlined">block</span>
      </div>
    </div>
  </div>

</div>
`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Truck Master</title>
  <link rel="stylesheet" href="/Css/TruckMaster.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
</head>
<body>
  <div id="navbar"></div>

<div class="top-header">
  <h2 class="page-title">
  <span class="p-2 bg-primary/10 rounded-lg text-primary">
   <span class="material-icons-outlined">local_shipping</span>
   </span>
  Truck Master Data
</h2>

  <button 
    class="btn btn-add"
    onclick="openAddPopup()">
    <span class="material-icons-outlined mr-2 -ml-1 text-lg">add_circle</span>
    Add New Truck
  </button>
</div>
${totalTruckHTML}
${truckTableHTML}


  
  <div class="popup" id="popup">
  <div class="popup-content">
    <button class="close-btn" onclick="closeAddPopup()">✖</button>
    <h3>Add New Truck</h3>

    <form id="insertForm" class="popup-form">
      <div class="form-group">
        <label>Truck Number:</label>
        <input name="TRUCK_REG_NO" required>
      </div>

      <div class="form-group">
        <label>Trailer No:</label>
        <input name="TRAILER_NO" required>
      </div>

      <div class="form-group">
        <label>Blacklist Status:</label>
        <select name="BLACKLIST_STATUS" required>
          <option value="0">Not Blacklisted</option>
          <option value="1">Blacklisted</option>
        </select>
      </div>

      <div class="form-group">
        <label>Reason for Blacklist:</label>
        <input name="REASON_FOR_BLACKLIST" readonly>
      </div>

      <div class="form-group">
        <label>Owner Name:</label>
        <input name="OWNER_NAME" required>
      </div>

      <div class="form-group">
        <label>Driver Name:</label>
        <input name="DRIVER_NAME" required>
      </div>

      <div class="form-group">
        <label>Helper Name:</label>
        <input name="HELPER_NAME" required>
      </div>

      <div class="form-group">
        <label>Carrier Company:</label>
        <input name="CARRIER_COMPANY" required>
      </div>

      <div class="form-group">
        <label>Safety Cert Valid Upto:</label>
        <input type="date" name="SAFETY_CERTIFICATION_NO" required>
      </div>

      <div class="form-group">
        <label>Calibration Cert Valid Upto:</label>
        <input type="date" name="CALIBRATION_CERTIFICATION_NO" required>
      </div>

      <div class="form-group">
        <label>Tare Weight:</label>
        <input name="TARE_WEIGHT" required>
      </div>

      <div class="form-group">
        <label>Max Weight:</label>
        <input name="MAX_WEIGHT" required>
      </div>

      <div class="form-group">
        <label>Truck Sealing Requirement:</label>
        <select name="TRUCK_SEALING_REQUIREMENT" required>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Max Fuel Capacity:</label>
        <input name="MAX_FUEL_CAPACITY" required>
      </div>

      <button type="submit" class="submit-btn">Insert</button>
    </form>
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
  <button id="closeTruckPopup"
  ">✖</button>
  <div id="truckPopupText"></div>
</div>



  <script>
  document.addEventListener("DOMContentLoaded", function () {
    const TruckNO = document.getElementById("TRUCK_REG_NO");
    if (TruckNO) {
      TruckNO.focus();
      TruckNO.select();   // optional: selects existing text
    }
  });

 fetch('/Css/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    // ⭐ ADD THIS PART ⭐
    const currentPath = window.location.pathname;

    document.querySelectorAll('#navbar a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  });


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
        showTruckPopup('Insert Truck Successfully');
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
    showTruckPopup('Truck updated successfully');

    // Wait for the user to click the close button
    closeBtn.addEventListener('click', () => {
        window.location.reload(); // reload after closing
    }, { once: true }); // { once: true } ensures the handler runs only once
}else {
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



// Function to show popup
const popup = document.getElementById("popupMsg");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeTruckPopup");

function showTruckPopup(msg) {
  document.getElementById("truckPopupText").textContent = msg;
  popup.style.display = "block";
  overlay.style.display = "block";
}

function closeTruckPopup() {
  popup.style.display = "none";
  overlay.style.display = "none";
}

closeBtn.addEventListener("click", closeTruckPopup);



//==========
//auto date 
//==========
document.addEventListener("DOMContentLoaded", function () {

  const popup = document.getElementById("popup");

  if (popup) {
    const today = new Date().toISOString().split("T")[0];

    const safetyDate = popup.querySelector('input[name="SAFETY_CERTIFICATION_NO"]');
    const calibrationDate = popup.querySelector('input[name="CALIBRATION_CERTIFICATION_NO"]');

    if (safetyDate && !safetyDate.value) {
      safetyDate.value = today;
    }

    if (calibrationDate && !calibrationDate.value) {
      calibrationDate.value = today;
    }
  }

});

document.addEventListener("DOMContentLoaded", function () {

  const popup = document.getElementById("popup");
  if (!popup) return;

  const blacklistSelect = popup.querySelector('select[name="BLACKLIST_STATUS"]');
  const reasonInput     = popup.querySelector('input[name="REASON_FOR_BLACKLIST"]');
  const sealingSelect   = popup.querySelector('select[name="TRUCK_SEALING_REQUIREMENT"]');

  /* ==============================
     DEFAULT VALUES ON POPUP OPEN
  ============================== */

  // ✅ Blacklist → NOT_BLACKLIST
  if (blacklistSelect) {
    blacklistSelect.value = "0";
  }

  // ✅ Truck Sealing → NO
  if (sealingSelect) {
    sealingSelect.value = "0";
  }

  // ✅ Handle Reason field
  function toggleReasonField() {
    if (blacklistSelect.value === "1") {
      reasonInput.removeAttribute("readonly");
      reasonInput.focus();
    } else {
      reasonInput.value = "";
      reasonInput.setAttribute("readonly", true);
    }
  }

  // Run once on load
  toggleReasonField();

  // Run when user changes blacklist
  blacklistSelect.addEventListener("change", toggleReasonField);

});


//================
//OPEN POPUP SCRIPT
//=================

function openAddPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "flex";   // 🔥 MUST BE FLEX
}

function closeAddPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
}

//===============
//EDIT CHECKBOX
//================
function editTruck(truckRegNo) {
  // redirect to same page with selected truck
  window.location.href = '/truck-master?truck=' + encodeURIComponent(truckRegNo);
}

//==================
//SELECT ALL
//===============
document.addEventListener("DOMContentLoaded", function () {
  const selectAll = document.getElementById("selectAll");

  if (!selectAll) return;

  selectAll.addEventListener("change", function () {
    document.querySelectorAll(".row-checkbox").forEach(cb => {
      cb.checked = selectAll.checked;
    });
  });
});
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

    const truckSealingReq =
  data.TRUCK_SEALING_REQUIREMENT === "1" ? 1 : 0; // ✅ 1 or 0

    await pool.request()
      .input('TRUCK_REG_NO', sql.VarChar, data.TRUCK_REG_NO)
      .input('TRAILER_NO', sql.VarChar, data.TRAILER_NO)
      .input('OWNER_NAME', sql.VarChar, data.OWNER_NAME)
      .input('DRIVER_NAME', sql.VarChar, data.DRIVER_NAME)
      .input('HELPER_NAME', sql.VarChar, data.HELPER_NAME)
      .input('CARRIER_COMPANY', sql.VarChar, data.CARRIER_COMPANY)
      .input('TRUCK_SEALING_REQUIREMENT', sql.Bit, truckSealingReq) // ✅ FIXED NAME
      .input('BLACKLIST_STATUS', sql.Bit, data.BLACKLIST_STATUS === "1" ? 1 : 0)
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
