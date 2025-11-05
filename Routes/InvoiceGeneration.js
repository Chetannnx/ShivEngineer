const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");
const router = express.Router();

router.get("/", (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice Generation</title>
  <link rel="stylesheet" href="/Css/InvoiceGeneration.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
  <!-- ✅ Your original navigation bar (unchanged) -->
  <nav style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/truck-master">TRUCK MASTER</a></li>
      <li><a href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a href="/EntryWeight">ENTRY BRIDGE</a></li>
      <li><a href="/ExitWeigh">EXIT BRIDGE</a></li>
      <li><a class="active" href="/InvoiceGeneration">INVOICE GENERATION</a></li>
    </ul>
  </nav>

  <h2>INVOICE GENERATION</h2>

  <!-- TOP BAR -->
  <section class="topbar">
    <div class="card">
      <div class="label">Truck Number</div>
      <input type="text" id="D_TRUCK_NO" placeholder="Enter Truck No">
    </div>

    <div class="card">
      <div class="label">Card No</div>
      <input type="text" id="D_CARD_NO" placeholder="Enter Card No">
    </div>

    <div class="card">
      <div class="label">Process Status</div>
      <select id="D_PROCESS_STATUS">
        <option>-- Select --</option>
        <option>Unloading</option>
        <option>Loading</option>
        <option>Completed</option>
      </select>
    </div>

    <div class="card">
      <div class="label">Fiscal / Invoice No</div>
      <input type="text" id="D_FISCAL_NO" placeholder="Enter Invoice No">
    </div>
  </section>

  <!-- LEFT / RIGHT SIDE -->
  <section class="grid">
    <!-- LEFT SIDE -->
    <div class="card">
      <div class="row"><div class="label">Trailer Number</div><input id="T_TRAILER_NUMBER" type="text"></div>
      <div class="row"><div class="label">Owner Name</div><input id="T_OWNER_NAME" type="text"></div>
      <div class="row"><div class="label">Driver Name</div><input id="T_DRIVER_NAME" type="text"></div>
      <div class="row"><div class="label">Helper Name</div><input id="T_HELPER_NAME" type="text"></div>
      <div class="row"><div class="label">Carrier Company</div><input id="T_CARRIER_COMPANY" type="text"></div>
      <div class="row"><div class="label">Customer Name</div><input id="D_CUSTOMER_NAME" type="text"></div>
      <div class="row"><div class="label">Customer Address Line1</div><input id="D_CUSTOMER_ADDRESS_LINE1" type="text"></div>
      <div class="row"><div class="label">Item Description</div>
        <select id="D_ITEM_DESCRIPTION">
          <option>-- Select --</option>
          <option>Diesel</option>
          <option>Petrol</option>
          <option>Lubricant Oil</option>
        </select>
      </div>
      <div class="row"><div class="label">Rate</div><input id="D_RATE" type="number" placeholder="Enter Rate"></div>
      <div class="row"><div class="label">Fan Timeout</div><input id="D_FAN_TIMEOUT" type="text"></div>
      <div class="row"><div class="label">Tare Weight</div><input id="T_TARE_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Max Weight</div><input id="T_MAX_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Max Fuel Capacity</div><input id="T_MAX_FUEL_CAPACITY" type="number"></div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="card">
      <div class="row"><div class="label">Blacklist Status</div>
        <select id="T_BLACKLIST_STATUS">
          <option>-- Select --</option>
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>
      <div class="row"><div class="label">Reason For Blacklist</div><input id="T_BLACKLIST_REASON" type="text"></div>
      <div class="row"><div class="label">Safety Cer. Valid Upto</div><input id="T_SAFETY_CERT_VALID_UPTO" type="date"></div>
      <div class="row"><div class="label">Calibration Cer. Valid Upto</div><input id="T_CALIB_CERT_VALID_UPTO" type="date"></div>
      <div class="row"><div class="label">Truck Sealing Requirement</div>
        <select id="T_TRUCK_SEALING_REQUIREMENT">
          <option>-- Select --</option>
          <option>Required</option>
          <option>Not Required</option>
        </select>
      </div>
      <div class="row"><div class="label">Seal No</div><input id="D_SEAL_NO" type="text"></div>
      <div class="row"><div class="label">Net Weight</div><input id="D_NET_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Actual Quantity Filled</div><input id="DERIVED_QTY" type="number"></div>
      <div class="row"><div class="label">Tare Weight at Entry</div><input id="D_TARE_WEIGHT_AT_ENTRY" type="number"></div>
      <div class="row"><div class="label">Tare Weight at Entry Time</div><input id="D_TARE_WEIGHT_AT_ENTRY_TIME" type="text"></div>
      <div class="row"><div class="label">Gross Weight at Exit Time</div><input id="D_GROSS_WEIGHT_AT_EXIT_TIME" type="number"></div>
      <div class="row"><div class="label">Payment Due Date</div><input id="DERIVED_DUE" type="date"></div>
      <div class="row"><div class="label">Amount To Be Paid</div><input id="DERIVED_AMOUNT" type="number" placeholder="₹"></div>
    </div>
  </section>

  <!-- Script to fetch and fill data -->
  <script>
      // Get element by ID
  function get(id) {
    return document.getElementById(id);
  }

  // All field IDs that will display data
  var fields = [
    "D_TRUCK_NO","D_CARD_NO","D_PROCESS_STATUS","D_FISCAL_NO",
    "T_TRAILER_NUMBER","T_OWNER_NAME","T_DRIVER_NAME","T_HELPER_NAME","T_CARRIER_COMPANY",
    "D_CUSTOMER_NAME","D_CUSTOMER_ADDRESS_LINE1","D_ITEM_DESCRIPTION","D_RATE","D_FAN_TIMEOUT",
    "T_TARE_WEIGHT","T_MAX_WEIGHT","T_MAX_FUEL_CAPACITY","T_BLACKLIST_STATUS","T_BLACKLIST_REASON",
    "T_SAFETY_CERT_VALID_UPTO","T_CALIB_CERT_VALID_UPTO","T_TRUCK_SEALING_REQUIREMENT","D_SEAL_NO",
    "D_NET_WEIGHT","DERIVED_QTY","D_TARE_WEIGHT_AT_ENTRY","D_TARE_WEIGHT_AT_ENTRY_TIME",
    "D_GROSS_WEIGHT_AT_EXIT_TIME","DERIVED_DUE","DERIVED_AMOUNT"
  ];

  // Clear all fields
  function clearFields() {
    for (var i = 0; i < fields.length; i++) {
      get(fields[i]).textContent = "";
    }
  }

  // Fill all fields with data
  function setVals(data) {
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i];
      if (data[key] !== undefined && data[key] !== null) {
        get(key).textContent = data[key];
      } else {
        get(key).textContent = "-";
      }
    }
  }

  // Fetch data from backend
  function fetchData(params) {
    // Build query string manually
    var queryParts = [];
    for (var key in params) {
      if (params[key] && String(params[key]).trim() !== "") {
        queryParts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]).trim()));
      }
    }
    var queryString = queryParts.join("&");
    var url = "/InvoiceGeneration/data" + (queryString ? ("?" + queryString) : "");
    get("status").textContent = "Loading: " + url;

    // AJAX call using fetch
    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          get("status").textContent = "No data found (HTTP " + res.status + ")";
          clearFields();
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        setVals(data);
        get("status").textContent = "Loaded";
      })
      .catch(function (error) {
        console.error("Error:", error);
        get("status").textContent = "Error: " + error.message;
        clearFields();
      });
  }

  // Load Data button
  document.getElementById("loadBtn").addEventListener("click", function () {
    clearFields();
    var card_no = get("cardNo").value;
    var invoice_no = get("invoiceNo").value;
    var truck_no = get("truckNo").value;
    fetchData({ card_no: card_no, invoice_no: invoice_no, truck_no: truck_no });
  });

  // Load Latest button
  document.getElementById("latestBtn").addEventListener("click", function () {
    clearFields();
    fetchData({});
  });
  </script>

</body>
</html>`;
  res.send(html);
});

// ⬇️ Add this under your router.get("/")
router.get("/data", async (req, res) => {
  const { card_no, invoice_no, truck_no } = req.query;
  console.log("[/InvoiceGeneration/data] query:", { card_no, invoice_no, truck_no });

  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();

    const where = [];
    if (card_no)   { where.push("d.CARD_NO = @card_no");       request.input("card_no",   sql.VarChar, String(card_no).trim()); }
    if (invoice_no){ where.push("d.FISCAL_NO = @invoice_no");  request.input("invoice_no",sql.VarChar, String(invoice_no).trim()); }
    if (truck_no)  { where.push("d.TRUCK_NO = @truck_no");     request.input("truck_no",  sql.VarChar, String(truck_no).trim()); }

    // First try with BATCH_STATUS = 1
    const baseWhere = where.length ? `WHERE ${where.join(" AND ")}` : "WHERE 1=1";
    const withBatch = `${baseWhere} AND d.BATCH_STATUS = 1`;

    const selectSql = `
      SELECT TOP 1
        d.TRUCK_NO  AS D_TRUCK_NO,
        d.CARD_NO   AS D_CARD_NO,
        d.PROCESS_STATUS AS D_PROCESS_STATUS,
        d.FISCAL_NO AS D_FISCAL_NO,

        t.TRAILER_NUMBER        AS T_TRAILER_NUMBER,
        t.OWNER_NAME            AS T_OWNER_NAME,
        t.DRIVER_NAME           AS T_DRIVER_NAME,
        t.HELPER_NAME           AS T_HELPER_NAME,
        t.CARRIER_COMPANY       AS T_CARRIER_COMPANY,

        d.CUSTOMER_NAME         AS D_CUSTOMER_NAME,
        d.CUSTOMER_ADDRESS_LINE1 AS D_CUSTOMER_ADDRESS_LINE1,
        d.ITEM_DESCRIPTION      AS D_ITEM_DESCRIPTION,
        d.RATE                  AS D_RATE,
        d.FAN_TIMEOUT           AS D_FAN_TIMEOUT,

        t.TARE_WEIGHT           AS T_TARE_WEIGHT,
        t.MAX_WEIGHT            AS T_MAX_WEIGHT,
        t.MAX_FUEL_CAPACITY     AS T_MAX_FUEL_CAPACITY,

        t.BLACKLIST_STATUS      AS T_BLACKLIST_STATUS,
        t.BLACKLIST_REASON      AS T_BLACKLIST_REASON,
        t.SAFETY_CERT_VALID_UPTO AS T_SAFETY_CERT_VALID_UPTO,
        t.CALIB_CERT_VALID_UPTO  AS T_CALIB_CERT_VALID_UPTO,
        t.TRUCK_SEALING_REQUIREMENT AS T_TRUCK_SEALING_REQUIREMENT,

        d.SEAL_NO               AS D_SEAL_NO,
        d.NET_WEIGHT            AS D_NET_WEIGHT,
        d.TARE_WEIGHT_AT_ENTRY  AS D_TARE_WEIGHT_AT_ENTRY,
        d.TARE_WEIGHT AS D_TARE_WEIGHT,
        d.GROSS_WEIGHT AS D_GROSS_WEIGHT,
        d.ENTRY_TIME
      FROM DATA_MASTER d
      LEFT JOIN TRUCK_MASTER t ON t.TRUCK_NO = d.TRUCK_NO
      /**WHERE_CLAUSE**/
      ORDER BY d.ENTRY_TIME DESC;
    `;

    console.log("[SQL where w/ batch] =>", withBatch);
    let result = await request.query(selectSql.replace("/**WHERE_CLAUSE**/", withBatch));
    console.log("[SQL] rows with batch=1:", result.recordset.length);

    // Fallback: if nothing with BATCH_STATUS=1, try without that filter (latest matching)
    if (result.recordset.length === 0) {
      const whereNoBatch = baseWhere;
      console.log("[SQL where fallback] =>", whereNoBatch);
      result = await request.query(selectSql.replace("/**WHERE_CLAUSE**/", whereNoBatch));
      console.log("[SQL] rows without batch filter:", result.recordset.length);
    }

    const row = result.recordset[0];
    if (!row) return res.status(404).json({});

    // Derivations
    const toN = v => (v == null ? null : Number(v));
    const grossExit = toN(row.D_GROSS_WEIGHT_AT_EXIT_TIME);
    const tareEntry = toN(row.D_TARE_WEIGHT_AT_ENTRY);
    const rate = toN(row.D_RATE);
    let net = toN(row.D_NET_WEIGHT);
    if (net == null && grossExit != null && tareEntry != null) net = grossExit - tareEntry;
    const qty = net;
    const amount = (qty != null && rate != null) ? qty * rate : null;

    const fmtDate = (v) => {
      if (!v) return null;
      const dt = new Date(v);
      return isNaN(dt) ? v : dt.toLocaleString("en-GB", {
        day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:false
      });
    };

    res.json({
      ...row,
      T_SAFETY_CERT_VALID_UPTO: fmtDate(row.T_SAFETY_CERT_VALID_UPTO),
      T_CALIB_CERT_VALID_UPTO: fmtDate(row.T_CALIB_CERT_VALID_UPTO),
      D_TARE_WEIGHT_AT_ENTRY_TIME: fmtDate(row.D_TARE_WEIGHT_AT_ENTRY_TIME),
      D_NET_WEIGHT: net,
      DERIVED_QTY: qty,
      DERIVED_AMOUNT: amount,
      DERIVED_DUE: "-"
    });
  } catch (err) {
    console.error("InvoiceGeneration /data error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    try { pool && (await pool.close()); } catch {}
  }
});



module.exports = router;
