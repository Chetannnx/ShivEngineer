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
  if (body.showAll) params.append('showAll', body.showAll);
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
  const showAll = (req.query.showAll === 'on' || req.query.showAll === 'true');
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

    if (search && !showAll) {
      whereClause = 'WHERE CARD_NO LIKE @search';
      const searchParam = `%${search}%`;
      requestForData.input('search', sql.VarChar, searchParam);
      requestForCount.input('search', sql.VarChar, searchParam);
    }

    let dataQuery = `
      WITH OrderedData AS (
        SELECT
          CARD_NO,
          CARD_STATUS,
          ROW_NUMBER() OVER (ORDER BY TRY_CAST(CARD_NO AS INT) ${order}) AS SRNO
        FROM CARD_MASTER
        ${whereClause}
      )
      SELECT *
      FROM OrderedData
      ORDER BY SRNO
    `;
    if (!showAll) {
      dataQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

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
    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalRows / limit));
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
  <div style="margin: 10px 0; font-family:'DM Sans', sans-serif; font-weight:bold; font-size:16px;">
    Total Card No = ${totalRows} 
    <span style="color:green;">Active: ${activeCount}</span> | 
    <span style="color:red;">Block: ${blockCount}</span>
  </div>`;


        const topControls = `
<div style="width:1850px; max-width:1850px;  display:flex; justify-content:space-between; align-items:center;">
  <form method="GET" action="/tees" style="display:flex; align-items:center; gap:8px;">
  
    <input type="text" name="search" value="${escapeHtml(search)}" placeholder="Search Card No" style="padding:6px; font-family:'DM Sans', sans-serif; border-radius:10px; border:1px solid #ccc;">
    <button 
  type="submit" 
  class="btn btn-add" 
  style="font-size: 16px; font-family:'DM Sans', sans-serif; padding: 6px 12px; height: 37px; border-radius: 13px; border: none; background: #6571ff; color: #fff; font-weight: bold; cursor: pointer; width: 100px; display: flex; align-items: center; justify-content: center; gap: 6px;">
  
  <i class="fa-solid fa-magnifying-glass" style="font-size: 18px;"></i> Search
    </button>
 <a href="/tees" class="btn-reset">Refresh</a>

    <label style="display:flex; align-items:center; gap:6px; font-size:14px;">
      <input type="checkbox" name="showAll" ${showAll ? 'checked' : ''} onchange="this.form.submit()">
      Show All
    </label>
    <input type="hidden" name="sortBy" value="${escapeHtml(rawSortBy)}">
    <input type="hidden" name="order" value="${escapeHtml(order)}">
    <input type="hidden" name="limit" value="${limit}">
  </form>
  <div>
    Show
    <select onchange="window.location='/tees?page=1&limit='+this.value+'&search=${encodedSearch}&showAll=${showAll ? 'on' : ''}&sortBy=${rawSortBy}&order=${order}'" style="margin-left:6px; padding:4px; width:55px; border-radius:8px;flex-wrap: wrap;overflow: auto;">
      <option value="5" ${limit===5?'selected':''}>5</option>
      <option value="10" ${limit===10?'selected':''}>10</option>
      <option value="20" ${limit===20?'selected':''}>20</option>
      <option value="50" ${limit===50?'selected':''}>50</option>
    </select> rows
  </div>
</div>`;

        let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<nav>
    <ul>
    <li><a href="/">HOME</a></li>
      <li><a class="active">CARD MASTER</a></li>
      <li><a href="/truck-master">TRUCK MASTER</a></li>
      <li><a>FAN GENERATION</a></li>
      <li><a>ENTRY BRIDGE</a></li>
    </ul>
  </nav>
<title>Card Master</title>
<link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/Css/Page.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
</head>
<body>
<script>
function closeMsgPopup() {
  const popup = document.getElementById("msgPopup");
  if (popup) popup.style.display = "none";
}

// Auto-show popup if it exists
window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById("msgPopup");
  if (popup) popup.style.display = "flex";

    // ✅ Auto close popup after 3 seconds
    setTimeout(closeMsgPopup, 3000);

});
</script>

<script>

setTimeout(() => {
  const msgBox = document.getElementById("msgBox");
  if(msgBox) msgBox.style.display = "none";
}, 3000);
</script>


<div class="top-bar" style="padding-top:10px;">
  <h2 style="margin:0;  text-align: center;">Card Master Data</h2>
  <button 
  style="width: 130px; font-family: 'DM Sans', sans-serif; border-radius: 13px; font-size: 16px; height: 40px; display: flex; align-items: center; justify-content: center; gap: 8px;" 
  class="btn btn-add" 
  onclick="openAddPopup()">
  
  <i class="fa-solid fa-credit-card" style="font-size: 21px;"></i> Add New
</button>
  
</div>

${messageHTML}
${totalCardHTML}
${topControls}




<!-- Delete form: added hidden inputs & confirm onsubmit -->
<form id="deleteForm" method="POST" action="/delete">
<table id="cardTable">
  <thead>
    <tr>
      <th class="select-col">Select</th>
      <th class="srno-col">Sr. No</th>
      <th class="cardno-col">
        <a href="/tees?page=1&limit=${limit}&search=${encodedSearch}&showAll=${showAll ? 'on' : ''}&sortBy=CARD_NO&order=${nextOrderFor('CARD_NO')}">
          Card No${sortArrow('CARD_NO')}
        </a>
      </th>
      <th class="status-col">
        <a href="/tees?page=1&limit=${limit}&search=${encodedSearch}&showAll=${showAll ? 'on' : ''}&sortBy=CARD_STATUS&order=${nextOrderFor('CARD_STATUS')}">
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
<input type="hidden" name="order" value="${escapeHtml(order)}">
<input type="hidden" name="showAll" value="${showAll}">`);

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
  <td class="status-col status ${statusClass}">${statusText}</td>
  <td class="edit-col">
    <button  
  type="button" 
  class="btn btn-edit" 
  style="background-color: #e5e8ed; margin-left: 50px; color: black; height: 35px; font-size: 16px; width: 110px; display: flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 8px; cursor: pointer;"
  onclick="openEditPopup('${cardNoJs}', '${row.CARD_STATUS}')">
  
  <i class="fa-solid fa-pencil"></i> Edit
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
</table>
<div class="delete-bottom">


 <button 
  type="button"
  onclick="openDeletePopup()"
  class="btn btn-delete"
  style="border-radius: 13px; font-family:'DM Sans', sans-serif;font-size: 16px; width: 100px; height: 37px; display: flex; align-items: center; justify-content: center; gap: 6px; background: #ff4d4d; color: #fff; border: none; cursor: pointer;">
  <i class="fa-solid fa-trash" style="font-size: 18px;"></i> Delete
</button>


</div>
</form>`;

        if (!showAll) {
            html += `<div style="width:100%; margin:12px 0; text-align:center;">`;
            if (page > 1) {
                html += `<a href="/tees?page=${page-1}&limit=${limit}&search=${encodedSearch}&showAll=${showAll ? 'on' : ''}&sortBy=${rawSortBy}&order=${order}" style="margin-right:10px;">◀ Previous</a>`;
            }
            html += ` Page ${page} of ${totalPages} `;
            if (page < totalPages) {
                html += `<a href="/tees?page=${page+1}&limit=${limit}&search=${encodedSearch}&showAll=${showAll ? 'on' : ''}&sortBy=${rawSortBy}&order=${order}" style="margin-left:10px;" >Next ▶</a>`;
            }
            html += `</div>`;
        }

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
      <input type="hidden" name="showAll" value="${showAll}">

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
      <input type="hidden" name="showAll" value="${showAll}">
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

//url throug find cardno

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
