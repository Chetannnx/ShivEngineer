const express = require("express");
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
  <nav style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/truck-master">TRUCK MASTER</a></li>
      <li><a href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a href="/EntryWeight">ENTRY BRIDGE</a></li>
      <li><a class="active" href="/ExitWeigh">EXIT BRIDGE</a></li>
    </ul>
  </nav>
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
      <input id="seal_no" name="SEAL_NO" type="text">
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
  </div>
   <!-- ✅ ACCEPT BUTTON inside the form-container -->
  <div class="button-container">
    <button id="acceptBtn">ACCEPT</button>
  </div>
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





module.exports = router;
