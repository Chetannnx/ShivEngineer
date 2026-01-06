
const express = require('express');
const sql = require('mssql/msnodesqlv8');
const dbConfig = require('../Config/dbConfig'); // ✅ proper config import

const router = express.Router();

// ===== Helper: escape HTML =====
function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)   // ✅ FORCE STRING
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
function escapeJs(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

// ====== GET Truck Master Page ======
router.get('/', async (req, res) =>  {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
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

tableQuery += `
      ORDER BY TRUCK_REG_NO
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

const tableRequest = pool.request();
if (search) {
  tableRequest.input('search', sql.VarChar, `%${search}%`);
}

const tableResult = await tableRequest.query(tableQuery);
const truckTableData = tableResult.recordset;

const countQuery = `
  SELECT COUNT(*) AS totalCount
  FROM TRUCK_MASTER
  ${search ? 'WHERE TRUCK_REG_NO LIKE @search' : ''}
`;

const countRequest = pool.request();
if (search) {
  countRequest.input('search', sql.VarChar, `%${search}%`);
}

const pageCountResult = await countRequest.query(countQuery);
const totalRows = pageCountResult.recordset[0].totalCount || 0;
const totalPages = Math.max(1, Math.ceil(totalRows / limit));

    

// ===== Truck Table HTML =====
const truckTableHTML = `
<div class="table-wrapper">
  <table class="truck-table">
    <thead>
    <!-- 🔍 SEARCH ROW INSIDE TABLE -->
      <tr class="table-controls">
        <th colspan="7">
         <div style="display:flex; justify-content:space-between; align-items:center;">
          <form method="GET" action="/truck-master" class="table-search">
          <div class="search-wrapper">
              <span class="material-icons-outlined search-icon">
                search
              </span>
              <input
              type="text"
              name="search"
              placeholder="Search Truck Reg No..."
              value="${escapeHtml(search)}"
            />
            </div>
            <a href="/truck-master" class="icon-btn"><i class="fa">&#xf021;</i></a>
            <button
    type="button"
    onclick="openDeletePopup()"
    class="btn btn-delete"
    style="
      margin-left:650px;
      width: 153px;
      display:flex;
      align-items:center;
      gap:6px;
      padding:6px 12px;
      background:#fef2f2;
      border:1px solid #fecaca;
      color:#dc2626;
      border-radius:6px;
      cursor:pointer;
    ">
    <span class="material-icons-outlined text-sm">delete</span>
    Delete Selected
  </button>
          </form>
          <!-- RIGHT: Rows dropdown -->
      <div class="rows-select">
        <select
          onchange="window.location='/truck-master?page=1&limit='+this.value+'&search=${encodeURIComponent(search)}'">
          <option value="10" ${limit===10?'selected':''}>10</option>
          <option value="50" ${limit===50?'selected':''}>50</option>
          <option value="100" ${limit===100?'selected':''}>100</option>
          <option value="200" ${limit===200?'selected':''}>200</option>
        </select>
      </div>
      </div>
        </th>
      </tr>
    
      <tr>
        <th>
          <input type="checkbox" id="selectAll">
        </th>
        <th class="srno-col">Sr. No</th>
        <th>Truck Reg No</th>
        <th>Safety Cert Valid Upto</th>
        <th>Calibration Cert Valid Upto</th>
        <th>Blacklist Status</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody>
      ${truckTableData.map((row, index) => `
        <tr>
        <!-- Select checkbox -->
  <td>
    <input 
      type="checkbox" 
      class="row-checkbox"
      value="${escapeHtml(row.TRUCK_REG_NO)}"
    >
  </td>
   <!-- ✅ Sr No -->
    <td class="srno-col">
      ${offset + index + 1}
    </td>
  
          <td>${escapeHtml(row.TRUCK_REG_NO)}</td>
          <td>
            ${formatMMDDYYYY(row.SAFETY_CERTIFICATION_NO)}

          </td>
          <td>
            ${formatMMDDYYYY(row.CALIBRATION_CERTIFICATION_NO)}
            </td>
            <td>
            <span class="status ${row.BLACKLIST_STATUS ? 'blacklisted' : 'not-blacklisted'}">
              ${row.BLACKLIST_STATUS ? 'Blacklisted' : 'Not Blacklisted'}
            </span>
          </td>
            <td>
    <button 
      class="action-btn edit-btn"
      onclick="editTruck('${escapeJs(row.TRUCK_REG_NO)}')">
       <span class="material-icons-outlined edit-icon">edit</span>
      Edit
    </button>
          </td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
<tr>
<td colspan="7" class="bg-gray-50" style="text-align:center; padding:14px;">
  <div style="display:flex; justify-content:flex-end; gap:12px; font-family:'DM Sans', sans-serif; align-items:center;">

    ${page > 1 ? `
      <a href="/truck-master?page=${page-1}&limit=${limit}&search=${encodeURIComponent(search)}"
         class="icon-btn">
        <span class="material-icons-outlined">chevron_left</span>
      </a>
    ` : ''}

    <span style="font-weight:600;">
      Page ${page} of ${totalPages}
    </span>

    ${page < totalPages ? `
      <a href="/truck-master?page=${page+1}&limit=${limit}&search=${encodeURIComponent(search)}"
         class="icon-btn">
        <span class="material-icons-outlined">chevron_right</span>
      </a>
    ` : ''}

  </div>
</td>
</tr>
</tfoot>

  </table>
</div>
`;

      // ===== Truck Count Summary (LIKE CARD MASTER) =====
const summaryCountResult = await pool.request().query(`
  SELECT 
    COUNT(*) AS totalTruck,
    SUM(CASE WHEN BLACKLIST_STATUS = 0 THEN 1 ELSE 0 END) AS notBlacklistCount,
    SUM(CASE WHEN BLACKLIST_STATUS = 1 THEN 1 ELSE 0 END) AS blacklistCount
  FROM TRUCK_MASTER
`);

const totalTruck = summaryCountResult.recordset[0].totalTruck || 0;
const notBlacklistCount = summaryCountResult.recordset[0].notBlacklistCount || 0;
const blacklistCount = summaryCountResult.recordset[0].blacklistCount || 0;


      const truckRegNo = req.query.truck ? req.query.truck.trim() : '';

      

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

      //===== Truck Summary Cards HTML =====
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
      <input 
    type="hidden" 
    name="IS_EDIT" 
    value="${truckData.TRUCK_REG_NO ? '1' : '0'}">
      <div class="form-group">
        <label>Truck Number:</label>
        <input name="TRUCK_REG_NO"
       id="TRUCK_REG_NO"
       value="${escapeHtml(truckData.TRUCK_REG_NO)}"
       ${truckData.TRUCK_REG_NO ? 'readonly' : ''}
       required>
      </div>

      <div class="form-group">
        <label>Trailer No:</label>
        <input name="TRAILER_NO"
       value="${escapeHtml(truckData.TRAILER_NO || '')}">
      </div>

      <div class="form-group">
        <label>Blacklist Status:</label>
        <select name="BLACKLIST_STATUS">
  <option value="0" ${truckData.BLACKLIST_STATUS == 0 ? 'selected' : ''}>
    Not Blacklisted
  </option>
  <option value="1" ${truckData.BLACKLIST_STATUS == 1 ? 'selected' : ''}>
    Blacklisted
  </option>
</select>
      </div>

      <div class="form-group">
        <label>Reason for Blacklist:</label>
       <input
      name="REASON_FOR_BLACKLIST"
      value="${escapeHtml(truckData.REASON_FOR_BLACKLIST || '')}"
      ${truckData.BLACKLIST_STATUS == 1 ? '' : 'readonly'}
    >
      </div>

      <div class="form-group">
        <label>Owner Name:</label>
        <input
      name="OWNER_NAME"
      value="${escapeHtml(truckData.OWNER_NAME || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Driver Name:</label>
        <input
      name="DRIVER_NAME"
      value="${escapeHtml(truckData.DRIVER_NAME || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Helper Name:</label>
        <input
      name="HELPER_NAME"
      value="${escapeHtml(truckData.HELPER_NAME || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Carrier Company:</label>
        <input
      name="CARRIER_COMPANY"
      value="${escapeHtml(truckData.CARRIER_COMPANY || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Safety Cert Valid Upto:</label>
        <input type="date"
       name="SAFETY_CERTIFICATION_NO"
       value="${
  truckData.SAFETY_CERTIFICATION_NO
    ? new Date(truckData.SAFETY_CERTIFICATION_NO).toISOString().slice(0,10)
    : ''
}">
      </div>

      <div class="form-group">
        <label>Calibration Cert Valid Upto:</label>
         <input
      type="date"
      name="CALIBRATION_CERTIFICATION_NO"
      value="${
        truckData.CALIBRATION_CERTIFICATION_NO
          ? new Date(truckData.CALIBRATION_CERTIFICATION_NO).toISOString().slice(0,10)
          : ''
      }"
      required
    >
      </div>

      <div class="form-group">
        <label>Tare Weight:</label>
        <input
      name="TARE_WEIGHT" id="tareWeight"
      value="${escapeHtml(truckData.TARE_WEIGHT || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Max Weight:</label>
        <input
      name="MAX_WEIGHT" id="maxWeight"
      value="${escapeHtml(truckData.MAX_WEIGHT || '')}"
      required
    >
      </div>

      <div class="form-group">
        <label>Truck Sealing Requirement:</label>
        <select name="TRUCK_SEALING_REQUIREMENT" required>
      <option value="0" ${truckData.TRUCK_SEALING_REQUIREMENT == 0 ? 'selected' : ''}>
        No
      </option>
      <option value="1" ${truckData.TRUCK_SEALING_REQUIREMENT == 1 ? 'selected' : ''}>
        Yes
      </option>
    </select>
      </div>
      
      <div class="form-group">
        <label>Max Fuel Capacity:</label>
        <input
      name="MAX_FUEL_CAPACITY" id="maxFuel"
      value="${escapeHtml(truckData.MAX_FUEL_CAPACITY || '')}"
      required
    >
      </div>

      <button type="submit" class="submit-btn">
  ${truckData.TRUCK_REG_NO ? 'Update' : 'Insert'}
</button>
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
  <button id="closeTruckPopup">✖</button>
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
    const truckRegNo = params.get('truck');


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

  // const isEdit = !!data.TRUCK_REG_NO && data.TRUCK_REG_NO.length > 0;
  // const isEdit = document.querySelector('input[name="IS_EDIT"]')?.value === "1";
  const isEdit = data.IS_EDIT === "1";


// if (!isEdit) {
//   blacklistSelect.value = "0";
//   sealingSelect.value = "0";
// }


  const url = isEdit
    ? '/truck-master/update-truck'
    : '/truck-master/insert-truck';

  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
  showTruckPopup(isEdit ? 'Truck updated successfully' : 'Truck inserted successfully');

  setTimeout(() => {
    // 🔥 CLEAR EDIT MODE
    window.location.href = '/truck-master';
  }, 500);
}else {
    alert('Operation failed');
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
// attachFuelCalculation(
//   document.getElementById('inserttareWeight'),
//   document.getElementById('insertmaxWeight'),
//   document.getElementById('insertmaxFuel')
// );

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
// document.addEventListener("DOMContentLoaded", function () {

//   const popup = document.getElementById("popup");

//   if (popup) {
//     const today = new Date().toISOString().split("T")[0];

//     const safetyDate = popup.querySelector('input[name="SAFETY_CERTIFICATION_NO"]');
//     const calibrationDate = popup.querySelector('input[name="CALIBRATION_CERTIFICATION_NO"]');

//     if (safetyDate && !safetyDate.value) {
//       safetyDate.value = today;
//     }

//     if (calibrationDate && !calibrationDate.value) {
//       calibrationDate.value = today;
//     }
//   }

// });

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
  // if (blacklistSelect) {
  //   blacklistSelect.value = "0";
  // }

  // // ✅ Truck Sealing → NO
  // if (sealingSelect) {
  //   sealingSelect.value = "0";
  // }

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

// function openAddPopup() {
//   const popup = document.getElementById("popup");
//   popup.style.display = "flex";   // 🔥 MUST BE FLEX
// }
// function openAddPopup() {
//   const popup = document.getElementById("popup");
//   popup.classList.remove("closing");
//   popup.style.display = "flex";
// }
// function openAddPopup() {
//   const popup = document.getElementById("popup");
//   const form = document.getElementById("insertForm");

//   // 1️⃣ RESET FORM COMPLETELY
//   form.reset();

//   // 2️⃣ FORCE INSERT MODE
//   const isEditInput = form.querySelector('input[name="IS_EDIT"]');
//   if (isEditInput) isEditInput.value = "0";

//   // 3️⃣ ENABLE Truck No (important!)
//   const truckNo = document.getElementById("TRUCK_REG_NO");
//   if (truckNo) {
//     truckNo.readOnly = false;
//     truckNo.value = "";
//   }

//   // 4️⃣ RESET BUTTON TEXT
//   const submitBtn = form.querySelector(".submit-btn");
//   if (submitBtn) submitBtn.textContent = "Insert";

//   // 5️⃣ RESET TITLE
//   const title = document.querySelector(".popup-content h3");
//   if (title) title.textContent = "Add New Truck";

//   // 6️⃣ DEFAULT VALUES
//   form.querySelector('select[name="BLACKLIST_STATUS"]').value = "0";
//   form.querySelector('select[name="TRUCK_SEALING_REQUIREMENT"]').value = "0";
//   form.querySelector('input[name="REASON_FOR_BLACKLIST"]').readOnly = true;
//   form.querySelector('input[name="REASON_FOR_BLACKLIST"]').value = "";

//   // 7️⃣ SHOW POPUP
//   popup.style.display = "flex";
// }
function openAddPopup() {
  const popup = document.getElementById("popup");
  const form = document.getElementById("insertForm");

  /* 🔥 CLEAR ALL INPUTS */
  form.querySelectorAll("input").forEach(input => {
    if (input.type === "hidden") return;
    if (input.type === "date") {
      input.value = "";
    } else {
      input.value = "";
    }
    input.readOnly = false;
  });

  /* 🔥 CLEAR ALL SELECTS */
  form.querySelectorAll("select").forEach(select => {
    select.selectedIndex = 0;
  });

  /* 🔥 FORCE INSERT MODE */
  const isEditInput = form.querySelector('input[name="IS_EDIT"]');
  if (isEditInput) isEditInput.value = "0";

  /* 🔥 RESET TITLE & BUTTON */
  const title = document.querySelector(".popup-content h3");
  if (title) title.textContent = "Add New Truck";

  const submitBtn = form.querySelector(".submit-btn");
  if (submitBtn) submitBtn.textContent = "Insert";

  /* 🔥 DEFAULT FIELD RULES */
  const reasonInput = form.querySelector('input[name="REASON_FOR_BLACKLIST"]');
  if (reasonInput) reasonInput.readOnly = true;

  /* ✅ AUTO DATE SET (ONLY FOR ADD MODE) */
  const today = new Date().toISOString().split("T")[0];

  const safetyDate = form.querySelector('input[name="SAFETY_CERTIFICATION_NO"]');
  const calibrationDate = form.querySelector('input[name="CALIBRATION_CERTIFICATION_NO"]');

  if (safetyDate) safetyDate.value = today;
  if (calibrationDate) calibrationDate.value = today;

  /* 🔥 SHOW POPUP */
  popup.style.display = "flex";
}

// function closeAddPopup() {
//   const popup = document.getElementById("popup");
//   popup.style.display = "none";
// }
// function closeAddPopup() {
//   const popup = document.getElementById("popup");
//   popup.classList.add("closing");

//   setTimeout(() => {
//     popup.style.display = "none";
//     popup.classList.remove("closing");
//   }, 250);
// }
// function closeAddPopup() {
//   const popup = document.getElementById("popup");

//   popup.style.display = "none";

//   // 🔥 REMOVE ?truck=XXXX FROM URL
//   if (window.location.search.includes("truck=")) {
//     history.replaceState(null, "", "/truck-master");
//   }
// }
function closeAddPopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";

  if (window.location.search.includes("truck=")) {
    history.replaceState(null, "", "/truck-master");
  }
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

// document.addEventListener("DOMContentLoaded", function () {
//   const params = new URLSearchParams(window.location.search);
//   const truck = params.get('truck');

//   if (truck) {
//     // 👉 EDIT MODE → open popup automatically
//     openAddPopup();

//     // Change title
//     const title = document.querySelector('.popup-content h3');
//     if (title) title.textContent = "Update Truck";
//   }
// });
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const truck = params.get('truck');

  // 🔥 ONLY auto-open ON PAGE LOAD, NOT AFTER CLOSE
  if (truck && !window.__popupOpenedOnce) {
    window.__popupOpenedOnce = true;

    const popup = document.getElementById("popup");
    popup.style.display = "flex";

    const title = document.querySelector('.popup-content h3');
    if (title) title.textContent = "Update Truck";

    const isEdit = document.querySelector('input[name="IS_EDIT"]');
    if (isEdit) isEdit.value = "1";

    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) submitBtn.textContent = "Update";
  }
});

</script>



</body>
</html>`;
      res.send(html);
    } catch (err) {
      console.error('Error fetching truck data:', err);
      res.status(500).send('Error loading TRUCK MASTER DATA');
    }
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
