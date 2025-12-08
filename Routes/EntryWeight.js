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
  <title>Entry Weight Bridge</title>
  <link rel="stylesheet" href="/Css/EntryWeight.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
  <div id="navbar"></div>
  <h2>
  <img src="/Icons/login-.png"">
  ENTRY WEIGH BRIDGE
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
      <label for="MAX_WEIGHT_ENTRY">Measured Weight :</label>
      <input id="max_weight_entry" name="MAX_WEIGHT_ENTRY" type="text">
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
        (*) For Loading – Measured Weight will be <strong>Tare Weight</strong><br>
        For Unloading – Measured Weight will be <strong>Gross Weight</strong>
      </p>
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
async function fetchByCard(cardNo) {
  const truckField = document.getElementById("truck_reg");
  const processField = document.getElementById("process_type");

  // Clear when empty
  if (!cardNo) {
    truckField.value = "";
    processField.value = "";
    return;
  }

  try {
    const url = "/EntryWeight/fetch?CARD_NO=" + encodeURIComponent(cardNo);
    const res = await fetch(url);
    const data = await res.json();

    if (data.warning) {
      showPopup(data.warning);
      truckField.value = "";
      processField.value = "";
      return;
    }

    if (data && data.TRUCK_REG_NO) {
      truckField.value = data.TRUCK_REG_NO;

      // Map PROCESS_TYPE to text
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
    e.preventDefault(); // stop form submits / line breaks
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

//================
// ACCEPT BUTTON
//================
document.getElementById("acceptBtn").addEventListener("click", async function () {
  const cardNo = document.getElementById("card_no").value.trim();
  const maxWeightEntry = document.getElementById("max_weight_entry").value.trim();

  // 🔹 Basic checks
  if (!cardNo) {
    showPopup("Please enter Card Number first.");
    return;
  }

  if (!maxWeightEntry) {
    showPopup("Please enter Entry Weight first.");
    return;
  }

  try {
    const res = await fetch("/EntryWeight/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CARD_NO: cardNo,
        max_weight_entry: parseFloat(maxWeightEntry) || 0, // only send Entry Weight
      }),
    });

    const data = await res.json();

    if (data.warning) showPopup(data.warning);
    else if (data.success) showPopup(data.success);
    else if (data.error) showPopup(data.error);

  } catch (err) {
    console.error("Accept error:", err);
    showPopup("Error processing request.");
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


//========================================================================================
//In your EntryWeight HTML, add this script at the bottom of the page (after all inputs):
//========================================================================================
// Listen for messages from Unified control
 window.addEventListener('message', function (event) {
  const data = event.data || {};
  if (data.source !== 'EntryWeightBridge') return;

  if (data.type === 'MeasuredWeight') {
    const weightInput = document.getElementById('max_weight_entry');
    if (weightInput) {
      weightInput.value = data.value ?? '';

      // Flash indicator (optional)
      weightInput.style.transition = 'background 0.3s';
      weightInput.style.background = 'rgba(0, 255, 0, 0.2)';
      setTimeout(() => (weightInput.style.background = 'transparent'), 300);
    }
  }
});


// //=================
// // URL-THROW SEARCH (uses TRUCK_NO)
// //==================
// (function () {
//   const params = new URLSearchParams(window.location.search);
//   const truckNo = params.get('TRUCK_NO');
//   if (truckNo) {
//     const truckInput = document.getElementById('truck_reg');
//     if (truckInput) {
//       truckInput.value = truckNo;
//       // call your fetch function for truck (rename accordingly)
//       if (typeof fetchByTruck === 'function') {
//         fetchByTruck(truckNo); // Auto-fetch on page load
//       } else {
//         console.warn('fetchByTruck is not defined — ensure you renamed fetchByCard to fetchByTruck.');
//       }
//     }
//   }
// })();


// //========================================================================================
// // Listen for messages from Unified control (EntryWeightBridge)
// //========================================================================================
// window.addEventListener('message', function (event) {
//   const data = event.data || {};
//   if (data.source !== 'EntryWeightBridge') return;

//   // Truck number update
//   if (data.type === 'TruckNo') {
//     const truckInput = document.getElementById('truck_reg');
//     if (truckInput) {
//       truckInput.value = data.value ?? '';

//       // Optional visual flash to indicate an update
//       truckInput.style.transition = 'background 0.25s';
//       truckInput.style.background = 'rgba(0, 200, 255, 0.18)';
//       setTimeout(() => (truckInput.style.background = 'transparent'), 250);
//     }

//     // Trigger fetch (if your page has fetchByTruck)
//     if (data.value && typeof fetchByTruck === 'function') {
//       fetchByTruck(data.value);
//     }
//   }

//   // ---- Replaced MeasuredWeight with CardNo (behavior unchanged) ----
//   if (data.type === 'CardNo') {
//     const cardInput = document.getElementById('card_no'); // your element id
//     if (cardInput) {
//       // show empty string if null/undefined
//       cardInput.value = data.value == null ? '' : data.value;

//       // Flash indicator (optional)
//       cardInput.style.transition = 'background 0.25s';
//       cardInput.style.background = 'rgba(0, 255, 0, 0.18)';
//       setTimeout(() => (cardInput.style.background = 'transparent'), 250);
//     }
//   }
// });
 



</script>
</body>
</html>`;
  res.send(html);
});

// =============================
// API Endpoint: Fetch Truck Data
// =============================
router.get("/fetch", async (req, res) => {
  const { CARD_NO } = req.query;

  if (!CARD_NO) return res.status(400).json({ error: "CARD_NO is required" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("CARD_NO", sql.VarChar, CARD_NO)
      .query(`
        SELECT TRUCK_REG_NO, PROCESS_TYPE, PROCESS_STATUS
        FROM DATA_MASTER
        WHERE CARD_NO = @CARD_NO
      `);

    if (result.recordset.length > 0) {
      const record = result.recordset[0];

      // ✅ If PROCESS_STATUS < 2, return a warning instead of data
      if (record.PROCESS_STATUS < 2) {
        return res.status(200).json({
          warning: "FAN is not Generated",
        });
      }

      res.json(record);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/accept", async (req, res) => {
  const { CARD_NO, WEIGHT_TO_FILLED, max_weight_entry } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().input("CARD_NO", sql.VarChar, CARD_NO)
      .query(`
        SELECT 
          PROCESS_TYPE,
          TARE_WEIGHT_TM,
          MAX_WEIGHT,
          PROCESS_STATUS,
          FAN_EXPIRY,
          TRUCK_REG_NO,
          WEIGHT_TO_FILLED
        FROM COMMON_VIEW
        WHERE CARD_NO = @CARD_NO AND BATCH_STATUS = 1
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ warning: "No active batch found for this card" });
    }

    const row = result.recordset[0];

    // 🔹 Convert to numeric values
    const enteredMaxWeight = parseFloat(max_weight_entry) || 0;
    const weightToFilledNum = parseFloat(row.WEIGHT_TO_FILLED) || 0;

    // 🔹 Compute max fuel capacity
    const maxFuelCapacity =
      parseFloat(row.MAX_WEIGHT) - enteredMaxWeight;

    // 🔹 FAN expiry & process status checks (keep your existing ones)
    const fanExpiryMinutes = Math.floor(
      (new Date(row.FAN_EXPIRY) - new Date()) / 60000
    );
    if (row.PROCESS_STATUS < 2) {
      return res.status(200).json({ warning: "FAN is not Generated." });
    } else if (row.PROCESS_STATUS > 4) {
      return res.status(200).json({ warning: "Weight Already Accepted." });
    } else if (fanExpiryMinutes < 0) {
      await pool.request().input("CARD_NO", sql.VarChar, CARD_NO).query(`
          UPDATE DATA_MASTER 
          SET BATCH_STATUS = 0, PROCESS_STATUS = 3
          WHERE CARD_NO = @CARD_NO AND BATCH_STATUS = 1
        `);
      return res
        .status(200)
        .json({ warning: "FAN Expired. Please Generate FAN Once Again." });
    }

    // 🔹 Step 4: Check condition
    //     if (!weightToFilledNum || weightToFilledNum <= 0) {
    //   return res.status(200).json({ warning: "Invalid 'Weight to be Filled' value." });
    // }

    if (weightToFilledNum > maxFuelCapacity) {
      return res.status(200).json({
        warning:
          "'Weight to be Filled' is higher than Max Fuel Capacity. Set Lower Weight",
      });
    }
    // 🔹 Step 5: Proceed with update
    //const entryWeight = row.TARE_WEIGHT_TM; // measured weight

    if (row.PROCESS_TYPE === 1) {
      await pool
        .request()
        .input("CARD_NO", sql.VarChar, CARD_NO)
        .input("TARE_WEIGHT", sql.Float, enteredMaxWeight)
        .input("MAX_WEIGHT_ENTRY", sql.Float, maxFuelCapacity).query(`
          UPDATE DATA_MASTER
          SET 
            TARE_WEIGHT = @TARE_WEIGHT,
            MAX_WEIGHT_ENTRY = @MAX_WEIGHT_ENTRY,
            PROCESS_STATUS = 5,
            ENTRY_WEIGHT_TIME = GETDATE()
          WHERE CARD_NO = @CARD_NO AND BATCH_STATUS = 1
        `);

      return res.status(200).json({
        success: "Entry Weight Updated (Tare Weight)",
        TRUCK_REG_NO: row.TRUCK_REG_NO,
        PROCESS_TYPE: row.PROCESS_TYPE,
      });
    } else {
      await pool
        .request()
        .input("CARD_NO", sql.VarChar, CARD_NO)
        .input("GROSS_WEIGHT", sql.Float, enteredMaxWeight).query(`
          UPDATE DATA_MASTER
          SET 
            GROSS_WEIGHT = @GROSS_WEIGHT,
            PROCESS_STATUS = 5,
            ENTRY_WEIGHT_TIME = GETDATE()
          WHERE CARD_NO = @CARD_NO AND BATCH_STATUS = 1
        `);

      return res.status(200).json({
        success: "Entry Weight Updated (Gross Weight)",
        TRUCK_REG_NO: row.TRUCK_REG_NO,
        PROCESS_TYPE: row.PROCESS_TYPE,
      });
    }
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

router.get;

module.exports = router;
