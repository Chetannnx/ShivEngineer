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
  <nav style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/truck-master">TRUCK MASTER</a></li>
      <li><a href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a class="active" href="/EntryWeight">ENTRY BRIDGE</a></li>
    </ul>
  </nav>
  <h2>
  <img src="/Icons/login-.png"">
  ENTRY WEIGH BRIDGE
</h2>

 <div class="card">
  <form>
    <div class="left-group">
      <div class="input-group">
        <label for="card_no">CARD NO:</label>
        <input type="text" id="card_no" placeholder="Enter Card Number">
      </div>
      <div class="input-group">
        <label for="truck_reg">TRUCK NO:</label>
        <input type="text" id="truck_reg" readonly>
      </div>
    </div>

    <div class="right-group">
      <div class="input-group">
        <label for="process_type">PROCESS TYPE:</label>
        <input type="text" id="process_type" readonly>
      </div>
      <div>
      <p>(*)For Loading - Measured Weight will be 'Tare Weight'
      For Unloading - Measured Weight will be 'Gross Weight'</p>
      
      </div>
    </div>
  </form>
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

 // =============================
  // Fetch Truck + Process info
  // =============================
  document.getElementById("card_no").addEventListener("input", async function() {
  const cardNo = this.value.trim();
  const truckField = document.getElementById("truck_reg");
  const processField = document.getElementById("process_type");

  if (cardNo.length === 0) {
    truckField.value = "";
    processField.value = "";
    return;
  }

  try {
    const url = "/EntryWeight/fetch?CARD_NO=" + encodeURIComponent(cardNo);
    const res = await fetch(url);

    const data = await res.json();

    // ✅ If backend says FAN not generated, show alert and stop
    if (data.warning) {
      showPopup(data.warning);
      truckField.value = "";
      processField.value = "";
      return;
    }

    // ✅ Fill data only if TRUCK_REG_NO exists
    if (data && data.TRUCK_REG_NO) {
      truckField.value = data.TRUCK_REG_NO;

      // Convert process type to readable text
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
    const result = await pool
      .request()
      .input("CARD_NO", sql.VarChar, CARD_NO)
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


router.get;

module.exports = router;
