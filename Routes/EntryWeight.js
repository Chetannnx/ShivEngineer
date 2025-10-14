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

 <div>
    <form>
      <label for="card_no">CARD NO:</label>
      <input type="text" id="card_no" placeholder="Enter Card Number">

      <label for="process_type">PROCESS TYPE:</label>
      <input type="text" id="process_type" readonly>
    </form>

      <label for="truck_reg">TRUCK REG NO:</label>
      <input type="text" id="truck_reg" readonly>
    
  </div>    
  

<script>

 // =============================
  // Fetch Truck + Process info
  // =============================
  document.getElementById("card_no").addEventListener("input", async function() {
    const cardNo = this.value.trim();
    if (cardNo.length === 0) {
      document.getElementById("truck_reg").value = "";
      document.getElementById("process_type").value = "";
      return;
    }

    try {
      const res = await fetch(\`/EntryWeight/fetch?CARD_NO=\${encodeURIComponent(cardNo)}\`);
      const data = await res.json();

      if (data && data.TRUCK_REG_NO) {
        document.getElementById("truck_reg").value = data.TRUCK_REG_NO;

        // Show readable process type
        if (data.PROCESS_TYPE === 1 || data.PROCESS_TYPE === "1") {
          document.getElementById("process_type").value = "LOADING";
        } else if (data.PROCESS_TYPE === 0 || data.PROCESS_TYPE === "0") {
          document.getElementById("process_type").value = "UNLOADING";
        } else {
          document.getElementById("process_type").value = "";
        }
      } else {
        document.getElementById("truck_reg").value = "";
        document.getElementById("process_type").value = "";
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  });

//=======================
//Smooth transition page
//========================
// When clicking any link, fade out the page before leaving
  document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
      if (link.hostname === window.location.hostname) {
        link.addEventListener("click", e => {
          e.preventDefault();
          document.body.classList.add("fade-out");
          setTimeout(() => {
            window.location = link.href;
          }, 500); // match CSS transition duration
        });
      }
    });
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
      .query(
        "SELECT TRUCK_REG_NO, PROCESS_TYPE FROM DATA_MASTER WHERE CARD_NO = @CARD_NO"
      );

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
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
