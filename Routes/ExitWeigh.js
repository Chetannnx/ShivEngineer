const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");
const router = express.Router();

router.get("/", (req, res) => {
  const params = req.query;
  console.log(params);
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Exit Weigh Bridge</title>
  <link rel="stylesheet" href="/Css/ExitWeigh.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
  <div id="navbar"></div>
  <h2>
  <img src="/Icons/login-.png"">
  EXIT WEIGH BRIDGE
</h2>

<div class="form-container">
  <!-- LEFT SIDE -->
  <div class="form-left">
    <div class="form-group">
      <label for="CARD_NO">Card Number :</label>
      <input id="card_no" name="CARD_NO" type="text" placeholder="Enter Card Number">
    </div>

    <div class="form-group">
      <label for="TRUCK_REG_NO">Truck Number :</label>
      <input id="truck_reg" name="TRUCK_REG_NO" type="text" readonly>
    </div>

    <div class="form-group">
      <label for="MEASURED_WEIGHT">Measured Weight :</label>
      <input id="measured_weight" name="MEASURED_WEIGHT" type="text">
    </div>

    <div class="form-group">
      <label for="SEAL_NO">SEAL NO :</label>
      <input id="seal_no" name="SEAL_NO" type="text" autofocus>
    </div>
  </div>

  <!-- RIGHT SIDE -->
  <div class="form-right">
    <div class="form-group">
      <label for="PROCESS_TYPE">Process Type :</label>
      <input id="process_type" name="PROCESS_TYPE" type="text" readonly>
    </div>

    <div class="form-note">
      <p>
        (*)
        For Loading – Measured Weight will be <strong>Tare Weight</strong><br>
        For Unloading – Measured Weight will be <strong>Gross Weight</strong>
      </p>
    </div>
    <div class="form-group">
      <select id="truckSealingreq" disabled>
      <option>--Select--</option>
      <option value="1">YES</option>
      <option value="0">NO</option>
      </select>
    </div>
  </div>
   <!-- ✅ ACCEPT BUTTON inside the form-container -->
  <div class="button-container">
    <button id="acceptBtn">ACCEPT</button>
  </div>
</div>

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
  
<script>
document.addEventListener("DOMContentLoaded", function () {
    const SealNo = document.getElementById("seal_no");
    if (SealNo) {
      SealNo.focus();
      SealNo.select();   // optional: selects existing text
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
// =============================
  // Fetch Truck + Process info
  // =============================
  // fetch truck + process on card input
async function fetchByCard(cardNo) {
  const truckField = document.getElementById("truck_reg");
  const processField = document.getElementById("process_type");
  const sealingSelect = document.getElementById("truckSealingreq");

  if (!cardNo) {
    truckField.value = "";
    processField.value = "";
    if (sealingSelect) sealingSelect.value = "0";
    return;
  }

  try {
    const url = "/ExitWeigh/fetch?CARD_NO=" + encodeURIComponent(cardNo);
    const res = await fetch(url);
    const data = await res.json();

    if (data.warning) {
      showPopup(data.warning);
      truckField.value = "";
      processField.value = "";
      if (sealingSelect) sealingSelect.value = "0";
      return;
    }

    if (data && data.TRUCK_REG_NO) {
      truckField.value = data.TRUCK_REG_NO;

      if (data.PROCESS_TYPE === 1 || data.PROCESS_TYPE === "1") {
        processField.value = "LOADING";
      } else if (data.PROCESS_TYPE === 0 || data.PROCESS_TYPE === "0") {
        processField.value = "UNLOADING";
      } else {
        processField.value = "";
      }
    } else {
      truckField.value = "";
      processField.value = "";
    }
      // === set truck sealing requirement into dropdown ===
    if (sealingSelect) {
      // data.TRUCK_SEALING_REQUIREMENT may be null, 0, or 1
      if (data.TRUCK_SEALING_REQUIREMENT === 1 || data.TRUCK_SEALING_REQUIREMENT === "1") {
        sealingSelect.value = "1";
      } else if (data.TRUCK_SEALING_REQUIREMENT === 0 || data.TRUCK_SEALING_REQUIREMENT === "0") {
        sealingSelect.value = "0";
      } else {
        // not found: leave default or set to 0
        sealingSelect.value = "0";
      }

      // keep it disabled if you don't want users to change it:
      sealingSelect.disabled = true;
      // if you want user to be able to override, comment the line above.
    }
  } catch (err) {
    console.error("Fetch error:", err);
    showPopup("Error fetching data.");
  }
}

// =============================
// Trigger fetch ONLY on Enter
// =============================
const cardInput = document.getElementById("card_no");
cardInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" || e.key === "NumpadEnter") {
    e.preventDefault();
    await fetchByCard(cardInput.value.trim());
  }
});

//=======================
//POPUP FUNCTION
//========================
// ✅ Popup functions
function showPopup(message) {
  document.getElementById("popupText").innerText = message;
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popupMsg").style.display = "block";
}

document.getElementById("closePopup").addEventListener("click", function() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("popupMsg").style.display = "none";
});


// ===============
// ACCEPT BUTTON
// ===============
document.getElementById("acceptBtn").addEventListener("click", async function () {
  const cardNo = document.getElementById("card_no").value.trim();
  const measuredWeightStr = document.getElementById("measured_weight").value.trim();
  const sealNo = document.getElementById("seal_no").value.trim();

  if (!cardNo) {
    showPopup("Enter Card Number.");
    return;
  }
  if (!measuredWeightStr) {
    showPopup("Enter Measured Weight.");
    return;
  }

  const exitWeight = Number(measuredWeightStr);
  if (!isFinite(exitWeight) || exitWeight <= 0) {
    showPopup("Measured Weight must be a positive number.");
    return;
  }

  try {
    const res = await fetch("/ExitWeigh/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CARD_NO: cardNo,
  
        EXIT_WEIGHT: exitWeight,
        SEAL_NO: sealNo
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showPopup(data.error || "Server error");
      return;
    }

    if (data.popup) {
      showPopup(data.popup);
      return;
    }

    // Success message (includes computed Net if you want to show it)
    showPopup(data.message || "Exit Weight Accepted.");
  } catch (e) {
    console.error(e);
    showPopup("Network error");
  }
});


//=================
//URL THROW SEARCH 
//==================
(function () {
  const params = new URLSearchParams(window.location.search);
  const cardNo = params.get('CARD_NO');
  if (cardNo) {
    const cardInput = document.getElementById('card_no');
    if (cardInput) {
      cardInput.value = cardNo;
      fetchByCard(cardNo); // 🔹 Auto-fetch on page load
    }
  }
})();


//====================
//In your ExitWeight HTML, add this script at the bottom of the page (after all inputs):
//====================
  // Optional: prefill from URL for first load
  (function prefill() {
    const p = new URLSearchParams(window.location.search);
    const w = p.get('MEASURED_WEIGHT');
    if (w && !isNaN(w)) {
      const el = document.getElementById('measured_weight');
      if (el) el.value = Number(w);
    }
  })();

  // Live updates from the Unified custom control
  window.addEventListener('message', function (evt) {
    const data = evt.data || {};
    // For production, also validate evt.origin
    if (data.source !== 'ExitWeightBridge') return;

    if (data.type === 'CardNo') {
      // if you also have a CardNo field in Exit page, set it here
      const cardEl = document.getElementById('CARD_NO') || document.getElementById('card_no');
      if (cardEl) cardEl.value = data.value ?? '';
    }

    if (data.type === 'MeasuredWeight') {
      const el = document.getElementById('measured_weight');
      if (!el) return;
      const v = data.value;
      if (v == null || isNaN(v)) {
        el.value = '';
      } else {
        const n = Number(v);
        el.value = Number.isInteger(n) ? String(n) : n.toFixed(2);
      }
      // optional visual feedback
      el.style.transition = 'background 0.25s';
      el.style.background = 'rgba(0, 255, 0, 0.18)';
      setTimeout(() => (el.style.background = 'transparent'), 250);
    }
  });

</script>



</body>
</html>`;
  res.send(html);
});

// =============================
// API Endpoint: Fetch Truck Data
// =============================
// ---------- API: fetch truck/process by card ----------
// ---------- API: fetch truck/process by card ----------
router.get("/fetch", async (req, res) => {
  const { CARD_NO } = req.query;

  if (!CARD_NO) return res.status(400).json({ error: "CARD_NO is required" });

  try {
    const pool = await sql.connect(dbConfig);

    // 1) get basic data from DATA_MASTER (as before)
    const result = await pool.request()
      .input("CARD_NO", sql.VarChar, CARD_NO)
      .query(`
        SELECT TRUCK_REG_NO, PROCESS_TYPE, PROCESS_STATUS
        FROM DATA_MASTER
        WHERE CARD_NO = @CARD_NO
      `);

    if (result.recordset.length === 0) {
      return res.json({});
    }

    const record = result.recordset[0];

    // If PROCESS_STATUS < 2, return a warning like you had
    if (record.PROCESS_STATUS < 2) {
      return res.status(200).json({
        warning: "FAN is not Generated",
      });
    }

    // 2) Try to fetch sealing requirement from TRUCK_MASTER using TRUCK_REG_NO
    let sealingReq = null; // null = unknown / not found
    if (record.TRUCK_REG_NO) {
      try {
        const truckRes = await pool.request()
          .input("TRUCK_REG_NO", sql.VarChar, record.TRUCK_REG_NO)
          .query(`
            SELECT TOP 1 TRUCK_SEALING_REQUIREMENT
            FROM TRUCK_MASTER
            WHERE TRUCK_REG_NO = @TRUCK_REG_NO
          `);

        if (truckRes.recordset.length > 0) {
          // normalize to number 0 or 1 if possible
          const val = truckRes.recordset[0].TRUCK_SEALING_REQUIREMENT;
          sealingReq = (val === null || val === undefined) ? null : Number(val);
        }
      } catch (truckErr) {
        console.warn("Error fetching TRUCK_MASTER:", truckErr);
        // proceed without sealing info
      }
    }

    // 3) Return combined object. Include TRUCK_SEALING_REQUIREMENT (may be null)
    res.json({
      TRUCK_REG_NO: record.TRUCK_REG_NO,
      PROCESS_TYPE: record.PROCESS_TYPE,
      PROCESS_STATUS: record.PROCESS_STATUS,
      TRUCK_SEALING_REQUIREMENT: sealingReq // 1,0 or null
    });
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ---------- API: accept logic ----------
router.post("/accept", async (req, res) => {
  const { CARD_NO, EXIT_WEIGHT, SEAL_NO } = req.body || {};

  if (!CARD_NO) return res.status(400).json({ error: "CARD_NO is required" });
  if (EXIT_WEIGHT == null || isNaN(Number(EXIT_WEIGHT)) || Number(EXIT_WEIGHT) <= 0) {
    return res.status(400).json({ error: "Valid EXIT_WEIGHT is required" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // 1) Read current status + weights + sealing requirement
    const sel = await pool.request()
      .input("CARD_NO", sql.VarChar, CARD_NO)
      .query(`
        SELECT 
          PROCESS_TYPE,
          PROCESS_STATUS,
          TARE_WEIGHT,
          GROSS_WEIGHT,
          TRUCK_SEALING_REQUIREMENT
        FROM COMMON_VIEW
        WHERE CARD_NO = @CARD_NO
          AND BATCH_STATUS = 1
      `);

    if (sel.recordset.length === 0) {
      return res.status(404).json({ error: "Card not found or batch not active." });
    }

    const row = sel.recordset[0];
    const PROCESS_TYPE = Number(row.PROCESS_TYPE);   // 0 = UNLOADING, 1 = LOADING
    const PROCESS_STATUS = Number(row.PROCESS_STATUS);
    const TARE_WEIGHT_DB = Number(row.TARE_WEIGHT || 0);
    const GROSS_WEIGHT_DB = Number(row.GROSS_WEIGHT || 0);
    const SEAL_REQ = Number(row.TRUCK_SEALING_REQUIREMENT || 0);

    // 2) Guards
    if (PROCESS_STATUS > 14) return res.json({ popup: "Exit Weight Already Accepted." });
    if (PROCESS_STATUS < 14) return res.json({ popup: "Unauthorised Access." });

    // 3) Sealing requirement
   if (SEAL_REQ === 1) {
  // When sealing is required
  if (!SEAL_NO || String(SEAL_NO).trim() === "") {
    return res.json({ popup: "Fill Information" });
  }
}

    // 4) Compute & prepare update
    const ExitWeight = Number(EXIT_WEIGHT);
    let NetWeightExit = 0;
    let updateSets = "";
    let updateInputs = [];
    let popupText = "";

    if (PROCESS_TYPE === 0) {
      // UNLOADING: Net = GROSS_WEIGHT (DB) - ExitWeight | store ExitWeight as TARE_WEIGHT
      NetWeightExit = GROSS_WEIGHT_DB - ExitWeight;

      updateSets = `
        NET_WEIGHT = @NET_WEIGHT,
        TARE_WEIGHT = @EXIT_WEIGHT,
        PROCESS_STATUS = 15,
        SEAL_NO = @SEAL_NO,
        EXIT_WEIGHT_TIME = GETDATE()
      `;
      updateInputs = [
        { name: "NET_WEIGHT", type: sql.Decimal(18, 3), value: NetWeightExit },
        { name: "EXIT_WEIGHT", type: sql.Decimal(18, 3), value: ExitWeight },
        { name: "SEAL_NO", type: sql.VarChar, value: SEAL_NO || null }
      ];

      // ✅ Unloading-specific popup
      popupText = "Exit Weight Updated (Tare Weight)";
    } else if (PROCESS_TYPE === 1) {
      // LOADING: Net = ExitWeight - TARE_WEIGHT (DB) | store ExitWeight as GROSS_WEIGHT
      NetWeightExit = ExitWeight - TARE_WEIGHT_DB;

      updateSets = `
        NET_WEIGHT = @NET_WEIGHT,
        GROSS_WEIGHT = @EXIT_WEIGHT,
        PROCESS_STATUS = 15,
        SEAL_NO = @SEAL_NO,
        EXIT_WEIGHT_TIME = GETDATE()
      `;
      updateInputs = [
        { name: "NET_WEIGHT", type: sql.Decimal(18, 3), value: NetWeightExit },
        { name: "EXIT_WEIGHT", type: sql.Decimal(18, 3), value: ExitWeight },
        { name: "SEAL_NO", type: sql.VarChar, value: SEAL_NO || null }
      ];

      // ✅ Loading-specific popup
      popupText = "Exit Weight Updated (Gross Weight)";
    } else {
      return res.status(400).json({ error: "Invalid PROCESS_TYPE." });
    }

    if (!isFinite(NetWeightExit)) {
      return res.status(400).json({ error: "Computed net weight is invalid." });
    }

    // 5) Update DATA_MASTER
    const updReq = pool.request().input("CARD_NO", sql.VarChar, CARD_NO);
    updateInputs.forEach(p => updReq.input(p.name, p.type, p.value));

    const upd = await updReq.query(`
      UPDATE DATA_MASTER
      SET ${updateSets}
      WHERE CARD_NO = @CARD_NO
        AND BATCH_STATUS = 1
    `);

    // 6) Respond with the correct popup per process type
    return res.json({
      popup: popupText,
      data: {
        PROCESS_TYPE,
        NetWeightExit: Number(NetWeightExit.toFixed(3)),
        ExitWeight: Number(ExitWeight.toFixed(3)),
        UpdatedRows: upd.rowsAffected?.[0] ?? 0
      }
    });
  } catch (err) {
    console.error("SQL error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});



router.get;
module.exports = router;
