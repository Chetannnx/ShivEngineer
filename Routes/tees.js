const express = require('express');
const sql = require('mssql/msnodesqlv8');
const config = require('../Config/dbConfig'); // your original path
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

// ===== Helper: build redirect query =====
function buildRedirectQuery(body) {
  const params = new URLSearchParams();
  if (body.page) params.append('page', body.page);
  if (body.limit) params.append('limit', body.limit);
  if (body.search) params.append('search', body.search);
  if (body.sortBy) params.append('sortBy', body.sortBy);
  if (body.order) params.append('order', body.order);
  return '?' + params.toString();
}

// ===== Tees route =====
router.get('/', async (req, res) => {
  const params = req.query;
  console.log(params);

  const msg = req.query.msg || '';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const rawSearch = req.query.search || '';
  const search = rawSearch.trim();
  const rawSortBy = req.query.sortBy || 'CARD_NO';
  const rawOrder = (req.query.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const allowedSortMap = {
    'SRNO': 'CARD_NO',
    'CARD_NO': 'CARD_NO',
    'CARD_STATUS': 'CARD_STATUS'
  };
  const sortBy = allowedSortMap[rawSortBy] ? rawSortBy : 'CARD_NO';
  const sortColumn = allowedSortMap[sortBy];
  const order = rawOrder;

  try {
    await sql.connect(config);

    let whereClause = '';
    const requestForData = new sql.Request();
    const requestForCount = new sql.Request();

    if (search) {
      whereClause = 'WHERE CARD_NO LIKE @search';
      const searchParam = `%${search}%`;
      requestForData.input('search', sql.VarChar, searchParam);
      requestForCount.input('search', sql.VarChar, searchParam);
    }

    // ✅ Build dynamic ORDER BY based on selected column
let orderByClause = '';
if (sortColumn === 'CARD_STATUS') {
  // ✅ CARD_STATUS is numeric (1 = Active, 0 = Block)
  // So ASC => Block first, Active second, we flip logic to get Active first
  if (order === 'ASC') {
    // Active first
    orderByClause = `CARD_STATUS DESC, TRY_CAST(CARD_NO AS INT) ASC`;
  } else {
    // Block first
    orderByClause = `CARD_STATUS ASC, TRY_CAST(CARD_NO AS INT) ASC`;
  }
} else if (sortColumn === 'CARD_NO') {
  orderByClause = `TRY_CAST(CARD_NO AS INT) ${order}`;
} else {
  orderByClause = `${sortColumn} ${order}`;
}


    let dataQuery = `
      WITH OrderedData AS (
        SELECT
          CARD_NO,
          CARD_STATUS,
          ROW_NUMBER() OVER (ORDER BY ${orderByClause}) AS SRNO
        FROM CARD_MASTER
        ${whereClause}
      )
      SELECT *
      FROM OrderedData
      ORDER BY SRNO
    `;
    
    dataQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const dataResult = await requestForData.query(dataQuery);
    const rows = dataResult.recordset || [];

    const countQuery = `
      SELECT 
        COUNT(*) AS totalCount,
        SUM(CASE WHEN CARD_STATUS = 1 THEN 1 ELSE 0 END) AS activeCount,
        SUM(CASE WHEN CARD_STATUS = 0 THEN 1 ELSE 0 END) AS blockCount
      FROM CARD_MASTER
      ${whereClause}
    `;
    const countResult = await requestForCount.query(countQuery);

    const totalRows = countResult.recordset[0].totalCount || 0;
    const totalPages = Math.max(1, Math.ceil(totalRows / limit));
    const activeCount = countResult.recordset[0].activeCount || 0;
    const blockCount = countResult.recordset[0].blockCount || 0;

    // Functions for sorting
    function nextOrderFor(colRaw) {
      if (colRaw === rawSortBy) return order === 'ASC' ? 'DESC' : 'ASC';
      return 'ASC';
    }
    function sortArrow(colRaw) {
      if (colRaw !== rawSortBy) return '';
      return order === 'ASC' ? ' ▲' : ' ▼';
    }

    const encodedSearch = encodeURIComponent(search);

        // Messages
        const msg = req.query.msg;
  let messageHTML = '';

  if (msg === 'added') messageHTML = `
<div class="Popup" id="msgPopup" style="display:flex;">
  <div class="popup-content" style="background:#d4edda; color:#155724;">
    ✅ Card added successfully!
  </div>
</div>`;

  if (msg === 'updated') messageHTML = `
<div class="Popup" id="msgPopup" style="display:flex;">
  <div class="popup-content" style="background:#fff3cd; color:#856404;">
    ✅ Card updated successfully!
  </div>
</div>`;

  if (msg === 'deleted') messageHTML = `
<div class="Popup" id="msgPopup" style="display:flex;">
  <div class="popup-content" style="background:#f8d7da; color:#721c24;">
    ✅ Selected card deleted!
  </div>
</div>`;

  if (msg === 'exists') messageHTML = `
<div class="Popup" id="msgPopup" style="display:flex;">
  <div class="popup-content" style="background:#f8d7da; color:#721c24;">
    ❌ Card already exists!
  </div>
</div>`;

const totalCardHTML = `
  <div class="card-container">

  <!-- Total Cards -->
  <div class="stat-card">
    <div>
      <p class="title">Total Cards</p>
      <h2>${totalRows}</h2>
    </div>
    <div class="icon blue">
    <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-soft flex items-center justify-between">
    <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
      <span class="material-icons-outlined">folder</span>
      </div>
     </div> 
    </div>
  </div>

  <!-- Active Cards -->
  <div class="stat-card1">
    <div>
      <p class="title">Active Cards</p>
      <h2 class="green">${activeCount}</h2>
    </div>
    <div class="icon green">
      <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
      <span class="material-icons-outlined">check_circle</span>
      </div>
    </div>
  </div>

  <!-- Blocked Cards -->
  <div class="stat-card2">
    <div>
      <p class="title">Blocked Cards</p>
      <h2 class="red">${blockCount}</h2>
    </div>
    <div class="icon red">
     <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
      <span class="material-icons-outlined">block</span>
      </div>
    </div>
  </div>

</div>
`;


        const topControls = `
<div style="left:50%;  display:flex; justify-content:space-between; align-items:center;">
  <form method="GET" action="/tees" style="display:flex; align-items:center; gap:8px;">
  

   
</div>`;

        let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<div id="navbar"></div>

<title>Card Master</title>
<link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
<link rel="stylesheet" href="/Css/Page.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
</head>
<body>
<script>
function closeMsgPopup() {
  const popup = document.getElementById("msgPopup");
  if (popup) popup.style.display = "none";
}

window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById("msgPopup");

  if (popup) {
    // show popup
    popup.style.display = "flex";

    // auto close after 3 sec
    setTimeout(() => {
      closeMsgPopup();

      // ✅ REMOVE msg FROM URL (THIS IS THE KEY FIX)
      const url = new URL(window.location.href);
      url.searchParams.delete('msg');
      window.history.replaceState({}, document.title, url.toString());

    }, 3000);
  }
});
</script>

<script>

setTimeout(() => {
  const msgBox = document.getElementById("msgBox");
  if(msgBox) msgBox.style.display = "none";
}, 3000);
</script>

<div class="top-header">
  <h2 class="page-title">
  <span class="p-2 bg-primary/10 rounded-lg text-primary">
  <span class="material-icons-outlined">credit_card</span>
  </span>
  Card Master Data
</h2>

  <button 
    class="btn btn-add"
    onclick="openAddPopup()">
    <span class="material-icons-outlined mr-2 -ml-1 text-lg">add_circle</span>
    Add New Card
  </button>
</div>

${messageHTML}
${totalCardHTML}
${topControls}




<!-- Delete form: added hidden inputs & confirm onsubmit -->

<table id="cardTable">
  <thead>
  <tr class="table-controls">
    <th colspan="5">
      <div class="table-controls-wrap">

        <!-- Left: Search + Refresh -->
        <form method="GET" action="/tees" class="table-search">
          <div class="search-wrapper">
    <span class="material-icons-outlined search-icon">
      search
    </span>
          <input 
            type="text"
            name="search"
            value="${escapeHtml(search)}"
            placeholder="Search Card No..."
          >
 </div>

          <a href="/tees" class="icon-btn">
            <i class="fa">&#xf021;</i>
          </a>
          <button 
  type="button"
  onclick="openDeletePopup()"
  class="btn btn-delete"
  style="border-radius: 6px; font-family:'DM Sans', sans-serif;font-size: 14px; width: 153px; margin-left:650px; padding-top:6px; padding-bottom:6px; height: 37px; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: rgb(254 242 242 / var(--tw-bg-opacity, 1));  border: 1px solid rgb(254 202 202); color: #dc2626; cursor: pointer;">
  <span class="material-icons-outlined text-lg mr-1">delete</span> Delete Selected
</button>

          <input type="hidden" name="sortBy" value="${escapeHtml(rawSortBy)}">
          <input type="hidden" name="order" value="${escapeHtml(order)}">
          <input type="hidden" name="limit" value="${limit}">
        </form>
<form id="deleteForm" method="POST" action="/delete">
        

        <!-- Right: Rows dropdown -->
        <div class="rows-select">
          
          <select onchange="window.location='/tees?page=1&limit='+this.value+'&search=${encodedSearch}&sortBy=${rawSortBy}&order=${order}'" style="margin-left:10px">
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
      <th class="select-col">Select</th>
      <th class="srno-col">Sr. No</th>
      <th class="cardno-col">
        <a href="/tees?page=1&limit=${limit}&search=${encodedSearch}&sortBy=CARD_NO&order=${nextOrderFor('CARD_NO')}">
          Card No${sortArrow('CARD_NO')}
        </a>
      </th>
      <th class="status-col">
        <a href="/tees?page=1&limit=${limit}&search=${encodedSearch}&sortBy=CARD_STATUS&order=${nextOrderFor('CARD_STATUS')}">
          Card Status${sortArrow('CARD_STATUS')}
        </a>
      </th>
      <th class="edit-col">Edit</th>
    </tr>
  </thead>
  <tbody>`;

        // Insert hidden inputs for query state at top of the delete form
        html = html.replace('<tbody>', `<tbody>
<input type="hidden" name="page" value="${page}">
<input type="hidden" name="limit" value="${limit}">
<input type="hidden" name="search" value="${escapeHtml(search)}">
<input type="hidden" name="sortBy" value="${escapeHtml(rawSortBy)}">
<input type="hidden" name="order" value="${escapeHtml(order)}">`);

        rows.forEach((row) => {
            const statusClass = row.CARD_STATUS == 1 ? 'active' : 'block';
            const statusText = row.CARD_STATUS == 1 ? 'Active' : 'Block';
            const cardNoHtml = escapeHtml(row.CARD_NO);
            const cardNoJs = escapeJs(row.CARD_NO);
            html += `
<tr>
  <td class="select-col"><input type="checkbox" name="CARD_NO" value="${cardNoHtml}"></td>
  <td class="srno-col">${row.SRNO}</td>
  <td class="cardno-col">${cardNoHtml}</td>
  <td class="status-col">
  <span class="status-badge ${statusClass}">${statusText}</span>
</td>
  <td class="edit-col">
    <button  
  type="button" 
  class="text-primary hover:text-primary-hover dark:hover:text-indigo-400 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1" 
  style="margin-left: 80px; height: 35px; font-size: 14px; width: 70px; display: flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;"
  onclick="openEditPopup('${cardNoJs}', '${row.CARD_STATUS}')">
  
  <span class="material-icons-outlined text-sm">edit</span> Edit
</button>

  </td>
</tr>`;
        });
        // ✅ Add this check AFTER the loop
if (rows.length === 0) {
    html += `
<tr>
  <td colspan="5" style="text-align:center; padding:12px; font-weight:bold; font-family:'DM Sans', sans-serif;">
    ❌ No data found
  </td>
</tr>`;
}

        html += `
  </tbody>
 <tfoot>
    <tr>
      <td colspan="5" style="text-align:center; padding:14px;" class="bg-gray-50">
        <div style="display:flex; justify-content:flex-end; align-items:center; gap:12px; font-family:'DM Sans', sans-serif; width:100%;">

`;

// ◀ Previous button
if (page > 1) {
  html += `
    <a href="/tees?page=${page - 1}&limit=${limit}&search=${encodedSearch}&sortBy=${rawSortBy}&order=${order}"
       style="padding:8px; border-radius:6px; border:1px solid #d1d5db; background:#f9fafb; text-decoration:none; color:#111;">
       <span class="material-icons-outlined text-sm">chevron_left</span>
    </a>
  `;
}

// Page info
html += `
    <span style="font-weight:600;">
      Page ${page} of ${totalPages}
    </span>
`;

// Next ▶ button
if (page < totalPages) {
  html += `
    <a href="/tees?page=${page + 1}&limit=${limit}&search=${encodedSearch}&sortBy=${rawSortBy}&order=${order}"
    class="icon-btn">
       <span class="material-icons-outlined text-sm">chevron_right</span>
    </a>
  `;
}

html += `
        </div>
      </td>
    </tr>
  </tfoot>
</table>

<div class="delete-bottom">


 


</div>
</form>`;

        
            
        

        // Popups (Add/Edit) - added hidden inputs inside both forms to preserve state
        html += `

  

<div id="addPopup" class="popup" style="font-family: 'DM Sans', sans-serif;">
  <div class="popup-content">
    <h3>Add / Manage Card</h3>
    <form method="POST" action="/insert" id="addCardForm">
      <input type="hidden" name="page" value="${page}">
      <input type="hidden" name="limit" value="${limit}">
      <input type="hidden" name="search" value="${escapeHtml(search)}">
      <input type="hidden" name="sortBy" value="${escapeHtml(rawSortBy)}">
      <input type="hidden" name="order" value="${escapeHtml(order)}">
      

      <label>Card No:</label><br>
      <input id="CARD_NO" type="text" name="CARD_NO"
        style="width:80%; padding:8px; margin:8px 0;" required><br>

      <label>Card Status:</label><br>
      <select name="CARD_STATUS" class="status-dropdown"
        style="width:80%; padding:8px; margin:8px 0;" required>
        <option value="1">Active</option>
        <option value="0">Block</option>
      </select><br>

      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <!-- Submit button -->
        <button type="submit" style="font-family: 'DM Sans', sans-serif;" class="btn btn-add">Submit</button>

        <!-- Delete button -->
        <button type="button" class="btn btn-delete"
          style="background:#ff4d4d; font-family: 'DM Sans', sans-serif; color:#fff; border:none; border-radius:13px; padding:8px 16px; cursor:pointer;"
          onclick="deleteCardFromPopup()">
          <i class="fa-solid fa-trash" style="margin-right:6px;"></i> Delete
        </button>

         <!-- Edit button -->
        <button type="button" class="btn btn-edit"
          style="background:#ffc107; font-family: 'DM Sans', sans-serif; color:#fff; border:none; border-radius:13px; padding:8px 16px; cursor:pointer;"
          onclick="editCardFromPopup()">
          <i class="fa-solid fa-pen-to-square" style="margin-right:6px;"></i> Edit
        </button>

        <!-- Cancel button -->
        <button type="button" class="btn" style="font-family: 'DM Sans', sans-serif;" onclick="closeAddPopup()">Cancel</button>
      </div>
    </form>
  </div>
</div>


<div id="editPopup" class="popup">
  <div class="popup-content">
    <h3>Edit Card</h3>
    <form method="POST" action="/update">
      <input type="hidden" name="page" value="${page}">
      <input type="hidden" name="limit" value="${limit}">
      <input type="hidden" name="search" value="${escapeHtml(search)}">
      <input type="hidden" name="sortBy" value="${escapeHtml(rawSortBy)}">
      <input type="hidden" name="order" value="${escapeHtml(order)}">
      <input type="hidden" name="CARD_NO" id="edit_CARD_NO">
      <label>Card No:</label><br>
      <input type="text" name="NEW_CARD_NO" id="edit_NEW_CARD_NO" style="width:80%; padding:8px; margin:8px 0;" readonly><br>
      <label>Card Status:</label><br>
      <select name="CARD_STATUS" id="edit_CARD_STATUS" style="width:80%; padding:8px; margin:8px 0;" required>
        <option value="1">Active</option>
        <option value="0">Block</option>
      </select><br>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button style="font-family: 'DM Sans', sans-serif;" type="submit" class="btn btn-edit">Update</button>
        <button style="font-family: 'DM Sans', sans-serif;" type="button" class="btn" onclick="closeEditPopup()">Cancel</button>
      </div>
    </form>
  </div>
</div>

<!-- Delete Popup -->
<div id="deletePopup" class="popup" style="display: none;">
  <div class="popup-content">
    <h3>⚠️ Confirm Deletion</h3>
    <p>Are you sure you want to delete the selected card(s)?</p>
    <div style="margin-top: 15px; display: flex; justify-content: center; gap: 10px;">
      <button onclick="submitDelete()" style="background: red;font-family: 'DM Sans', sans-serif; color: white; padding: 8px 16px; border-radius: 6px;">Yes, Delete</button>
      <button onclick="closeDeletePopup()" style="background: gray;font-family: 'DM Sans', sans-serif; color: white; padding: 8px 16px; border-radius: 6px;">Cancel</button>
    </div>
  </div>
</div>
<div id="no-selection-popup" class="popup-modal" style="display:none;">
  <div class="popup-content">
    <p>Please select at least one card to delete.</p>
    <button style="font-family: 'DM Sans', sans-serif;" onclick="closeNoSelectionPopup()">OK</button>
  </div>
</div>

<!-- Add this CONFIRM DELETE POPUP anywhere inside <body> -->
<div id="confirmDeletePopup" class="popup" style="display:none;">
  <div class="popup-content" style="max-width: 350px; text-align:center;">
    <div style="font-size:24px; color:#ff9800;">⚠️</div>
    <h3 style="margin:8px 0; color:#1e3a8a;">Confirm Deletion</h3>
    <p id="confirmMessage" style="margin:10px 0;">Are you sure you want to delete the selected card(s)?</p>
    <div style="display:flex; justify-content:center; gap:10px; margin-top:12px;">
      <button id="confirmYes" style="background:#ff4d4d; font-family: 'DM Sans', sans-serif; color:#fff; border:none; border-radius:10px; padding:8px 16px; cursor:pointer;">
        Yes, Delete
      </button>
      <button id="confirmNo" style="background:#ccc;font-family: 'DM Sans', sans-serif; color:#333; border:none; border-radius:10px; padding:8px 16px; cursor:pointer;">
        Cancel
      </button>
    </div>
  </div>
</div>



<script>

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

 // Delete Popup
function openDeletePopup() {
  const checkboxes = document.querySelectorAll('input[name="CARD_NO"]:checked');
  if (checkboxes.length === 0) {
  // Show your modal popup instead of alert
  const popup = document.getElementById("no-selection-popup");
  if (popup) {
    popup.style.display = "block";
  }
  return;
}

  document.getElementById('deletePopup').style.display = 'flex';
}

function closeDeletePopup() {
  document.getElementById('deletePopup').style.display = 'none';
}
function closeNoSelectionPopup() {
  document.getElementById("no-selection-popup").style.display = "none";
}


function submitDelete() {
  document.getElementById('deleteForm').submit();
}
function openAddPopup() { document.getElementById('addPopup').style.display = 'flex'; }
function closeAddPopup() { document.getElementById('addPopup').style.display = 'none'; }
function openEditPopup(cardNo, status) {
  document.getElementById('editPopup').style.display = 'flex';
  document.getElementById('edit_CARD_NO').value = cardNo;
  document.getElementById('edit_NEW_CARD_NO').value = cardNo;
  document.getElementById('edit_CARD_STATUS').value = status;
}
function closeEditPopup() { document.getElementById('editPopup').style.display = 'none'; }

//url through find cardno

(function () {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);

    // Read CARD_NO from query string
    const cardNo = params.get('CARD_NO');

    // If CARD_NO exists, set it in input field
    if (cardNo) {
      const cardInput = document.getElementById('CARD_NO');
      if (cardInput) {
        cardInput.value = cardNo;
      } else {
        console.warn('Input with id="CARD_NO" not found.');
      }
    }
  })();
  
</script>

<script>
function openConfirmPopup(message, onConfirm) {
  var popup = document.getElementById("confirmDeletePopup");
  var msg = document.getElementById("confirmMessage");
  var yesBtn = document.getElementById("confirmYes");
  var noBtn = document.getElementById("confirmNo");

  msg.textContent = message;
  popup.style.display = "flex";

  // Remove old listeners (avoid multiple triggers)
  var newYesBtn = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

  var newNoBtn = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNoBtn, noBtn);

  // Add fresh listeners
  newYesBtn.addEventListener("click", function () {
    popup.style.display = "none";
    onConfirm();
  });

  newNoBtn.addEventListener("click", function () {
    popup.style.display = "none";
  });
}


//Delete Card on AddPopup
function deleteCardFromPopup() {
  var input = document.getElementById('CARD_NO');
  if (!input) {
    alert("CARD_NO field not found!");
    return;
  }

  var cardNo = input.value.trim();
  if (!cardNo) {
    alert("Please enter a Card No to delete.");
    return;
  }

  openConfirmPopup("Are you sure you want to delete Card No: " + cardNo + "?", function () {
    fetch('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: "CARD_NO=" + encodeURIComponent(cardNo)
    })
    .then(function (response) {
      if (!response.ok) return response.text().then(function (err) { throw new Error(err); });
      window.location.reload();
    })
    .catch(function (err) {
      console.error('Error deleting card:', err);
      alert("Failed to delete card: " + err.message);
    });
  });
}


//Update Card in AddPopup
async function editCardFromPopup() {
  const cardNoInput = document.getElementById('CARD_NO');
  const statusSelect = document.querySelector('select[name="CARD_STATUS"]');

  if (!cardNoInput || !statusSelect) {
    alert("❌ Required fields not found.");
    return;
  }

  const cardNo = cardNoInput.value.trim();
  const cardStatus = statusSelect.value;

  if (!cardNo) {
    alert("Please enter a Card No to edit.");
    return;
  }

  try {
    const body = new URLSearchParams({
      CARD_NO: cardNo,
      NEW_CARD_NO: cardNo,     // send new value expected by server
      CARD_STATUS: cardStatus
    }).toString();

    const response = await fetch('/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (response.redirected) {
      window.location.href = response.url;
    } else {
      const result = await response.text();
      alert(result);
      if (response.ok) {
        closeAddPopup();
        window.location.reload();
      }
    }
  } catch (err) {
    console.error('Edit Error:', err);
    alert('❌ Error updating card.');
  }
}



</script>






</body>
</html>`;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Error: ' + err.message);
    } finally {
        try { await sql.close(); } catch (e) {}
    }
});

// ====== Insert (duplicate check) ======
router.post('/insert', async (req, res) => {
    const { CARD_NO, CARD_STATUS } = req.body;
    const redirectParams = buildRedirectQuery(req.body);
    if (!CARD_NO) return res.redirect('/tees' + redirectParams);
    try {
        const pool = await req.app.get('poolPromise');
        await sql.connect(config);
        const reqDB = new sql.Request();

        reqDB.input('card', sql.VarChar, CARD_NO);
        const checkResult = await reqDB.query('SELECT COUNT(*) AS cnt FROM CARD_MASTER WHERE CARD_NO = @card');
        const exists = checkResult.recordset[0].cnt > 0;

        if (exists) {
            return res.redirect('/tees' + redirectParams + '&msg=exists');
        }

        reqDB.input('status', sql.Int, parseInt(CARD_STATUS || 0));
        await reqDB.query('INSERT INTO CARD_MASTER (CARD_NO, CARD_STATUS) VALUES (@card, @status)');
        res.redirect('/tees' + redirectParams + '&msg=added');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Insert Error: ' + err.message);
    } finally {
        try { await sql.close(); } catch (e) {}
    }
});

// ====== Update ======
router.post('/update', async (req, res) => {
    const { CARD_NO, NEW_CARD_NO, CARD_STATUS } = req.body;
    const redirectParams = buildRedirectQuery(req.body);
    if (!CARD_NO || !NEW_CARD_NO) return res.redirect('/tees' + redirectParams);
    try {
        const pool = await req.app.get('poolPromise');
        await sql.connect(config);
        const reqDB = new sql.Request();
        reqDB.input('newCard', sql.VarChar, NEW_CARD_NO);
        reqDB.input('status', sql.Int, parseInt(CARD_STATUS || 0));
        reqDB.input('oldCard', sql.VarChar, CARD_NO);
        await reqDB.query('UPDATE CARD_MASTER SET CARD_NO = @newCard, CARD_STATUS = @status WHERE CARD_NO = @oldCard');
        res.redirect('/tees' + redirectParams + '&msg=updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Update Error: ' + err.message);
    } finally {
        try { await sql.close(); } catch (e) {}
    }
});

// ====== Delete ======
router.post('/delete', async (req, res) => {
    const redirectParams = buildRedirectQuery(req.body);
    try {
        const pool = await req.app.get('poolPromise');
        let cardNos = req.body.CARD_NO;
        if (!cardNos) return res.redirect('/tees' + redirectParams);
        if (!Array.isArray(cardNos)) cardNos = [cardNos];

        await sql.connect(config);
        const reqDB = new sql.Request();

        for (const cn of cardNos) {
            reqDB.input('cn', sql.VarChar, cn);
            await reqDB.query('DELETE FROM CARD_MASTER WHERE CARD_NO = @cn');
            reqDB.parameters = {};
        }
        res.redirect('/tees' + redirectParams + '&msg=deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Delete Error: ' + err.message);
    } finally {
        try { await sql.close(); } catch (e) {}
    }
});

module.exports = router;
