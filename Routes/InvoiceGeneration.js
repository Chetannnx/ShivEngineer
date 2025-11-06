const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");

const router = express.Router();
router.use(express.json()); // Needed so req.body works for POST /generate

router.get("/", (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice Generation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=DM Sans" rel="stylesheet">
  <link rel="stylesheet" href="/Css/InvoiceGeneration.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
</head>
<body style="font-family: 'DM Sans', sans-serif;">
  <nav>
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

  <h2 style="text-align:center;">
    <i class="fa-solid fa-receipt" style="font-size:21px;"></i>
    INVOICE GENERATION
  </h2>

  <!-- TOP BAR -->
  <section class="topbar">
    <div class="card">
      <div class="label">Truck Number :</div>
      <input type="text" id="D_TRUCK_NO" placeholder="Enter Truck No" readonly>
    </div>

    <div class="card">
      <div class="label">Card No :</div>
      <input type="text" id="D_CARD_NO" placeholder="Enter Card No">
    </div>

    <div class="card">
      <div class="label">Truck Status :</div>
      <select id="D_PROCESS_STATUS" disabled>
        <option value="">-- Select --</option>
        <option value="-1">Registered</option>
        <option value="1">Reported</option>
        <option value="2">Fan Generation</option>
        <option value="4">Fan Reauthorised</option>
        <option value="5">Entry Weight Accept</option>
        <option value="6">Truck at bay</option>
        <option value="7">Earthing Clamp Engaged</option>
        <option value="8">Loading started</option>
        <option value="9">Loading stopped</option>
        <option value="12">Loading Completed: Disengage Earthing Clamp</option>
        <option value="13">Aborted</option>
        <option value="14">Loading Completed</option>
        <option value="15">Exit Weight Accepted</option>
        <option value="16">Invoice Generated</option>
      </select>
    </div>

    <div class="card">
      <div class="label">Fiscal No :</div>
      <input type="text" id="D_FISCAL_NO" placeholder="Enter Invoice No">
    </div>
  </section>

  <!-- LEFT / RIGHT -->
  <section class="grid">
    <!-- LEFT -->
    <div class="card">
      <div class="row"><div class="label">Trailer Number :</div><input id="T_TRAILER_NUMBER" type="text"></div>
      <div class="row"><div class="label">Owner Name :</div><input id="T_OWNER_NAME" type="text"></div>
      <div class="row"><div class="label">Driver Name :</div><input id="T_DRIVER_NAME" type="text"></div>
      <div class="row"><div class="label">Helper Name :</div><input id="T_HELPER_NAME" type="text"></div>
      <div class="row"><div class="label">Carrier Company :</div><input id="T_CARRIER_COMPANY" type="text"></div>
      <div class="row"><div class="label">Customer Name :</div><input id="D_CUSTOMER_NAME" type="text"></div>
      <div class="row"><div class="label">Customer Address Line1 :</div><input id="D_CUSTOMER_ADDRESS_LINE1" type="text"></div>
      <div class="row"><div class="label">Customer Address Line2 :</div><input id="D_CUSTOMER_ADDRESS_LINE2" type="text"></div>
      <div class="row"><div class="label">Item Description :</div>
        <select id="D_ITEM_DESCRIPTION">
          <option value="">-- Select --</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Jetkero">Jetkero</option>
        </select>
      </div>
      <div class="row"><div class="label">Rate :</div><input id="D_RATE" type="number" min="0" step="0.01" placeholder="Enter Rate"></div>
      <div class="row"><div class="label">Fan Timeout :</div><input id="D_FAN_TIMEOUT" type="text"></div>
      <div class="row"><div class="label">Tare Weight :</div><input id="T_TARE_WEIGHT" type="number" min="0" step="0.01"></div>
      <div class="row"><div class="label">Max Weight :</div><input id="T_MAX_WEIGHT" type="number" min="0" step="0.01"></div>
      <div class="row"><div class="label">Max Fuel Capacity :</div><input id="T_MAX_FUEL_CAPACITY" type="number" min="0" step="0.01"></div>
    </div>

    <!-- RIGHT -->
    <div class="card">
      <div class="row"><div class="label">Blacklist Status :</div>
        <select id="T_BLACKLIST_STATUS">
          <option>-- Select --</option>
          <option value="1">Blacklist</option>
          <option value="0">Not_Blacklist</option>
        </select>
      </div>
      <div class="row"><div class="label">Reason For Blacklist :</div><input id="T_BLACKLIST_REASON" type="text"></div>
      <div class="row"><div class="label">Safety Cer. Valid Upto :</div><input id="T_SAFETY_CERT_VALID_UPTO" type="date"></div>
      <div class="row"><div class="label">Calibration Cer. Valid Upto :</div><input id="T_CALIB_CERT_VALID_UPTO" type="date"></div>
      <div class="row"><div class="label">Truck Sealing Requirement :</div>
        <select id="T_TRUCK_SEALING_REQUIREMENT">
          <option>-- Select --</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
      <div class="row"><div class="label">Seal No :</div><input id="D_SEAL_NO" type="text"></div>
      <div class="row"><div class="label">Net Weight :</div><input id="D_NET_WEIGHT" type="number" min="0" step="0.01"></div>
      <div class="row"><div class="label">Actual Quantity Filled :</div><input id="D_ACTUAL_WEIGHT_AT_BAY" type="text"></div>
      <div class="row"><div class="label">Tare Weight at Entry :</div><input id="D_TARE_WEIGHT_AT_ENTRY" type="number" min="0" step="0.01"></div>
      <div class="row"><div class="label">Gross Weight at Exit :</div><input id="D_GROSS_WEIGHT_AT_EXIT" type="number" min="0" step="0.01"></div>
      <div class="row"><div class="label">Tare Weight at Entry Time :</div><input id="D_TARE_WEIGHT_AT_ENTRY_TIME" type="text" readonly></div>
      <div class="row"><div class="label">Gross Weight at Exit Time :</div><input id="D_GROSS_WEIGHT_AT_EXIT_TIME" type="text" readonly></div>
      <div class="row"><div class="label">Payment Due Date :</div><input id="DERIVED_DUE" type="date"></div>
      <div class="row"><div class="label">Amount To Be Paid :</div><input id="DERIVED_AMOUNT" type="text" placeholder="₹" readonly></div>
    </div>
  </section>

  <button id="invoiceBtn" type="button">Invoice Generation</button>

  <!-- SCRIPTS -->
  <script>
  // ========= Common helpers for fetch-fill =========
  (function () {
    var BASE_PATH = "/InvoiceGeneration";

    function $id(x) { return document.getElementById(x); }

    function toDateInput(v) {
      if (v == null || v === "") return "";
      var d = (v instanceof Date) ? v : new Date(v);
      if (isNaN(d.getTime())) return "";
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var dd = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + mm + "-" + dd;
    }

    function fillFields(data) {
      Object.keys(data).forEach(function (id) {
        var val = data[id];
        var el = $id(id);
        if (!el) return;

        if (el.type === "date") {
          el.value = toDateInput(val);
          return;
        }

        if (el.tagName === "SELECT") {
          var v = String(val == null ? "" : val);
          var exists = false, i;
          for (i = 0; i < el.options.length; i++) {
            if (el.options[i].value === v) { exists = true; break; }
          }
          if (!exists && v !== "") {
            var opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            el.appendChild(opt);
          }
          el.value = v;
          return;
        }

        el.value = (val == null ? "" : val);
      });
    }

    function setLoading(loading) {
      document.body.style.cursor = loading ? "progress" : "auto";
      // Do NOT disable buttons; keep the Invoice button always clickable
      var els = document.querySelectorAll("input, select, textarea");
      var i; for (i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.id === "D_CARD_NO") continue; // keep card editable if you want
        el.disabled = loading;
      }
    }

    // ---- fetch on Enter in Card No ----
    var cardInput = $id("D_CARD_NO");
    if (cardInput) {
      cardInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();

        var card = cardInput.value.trim();
        if (!card) { alert("Please enter a Card No."); return; }

        var url = BASE_PATH + "/fetch?card=" + encodeURIComponent(card);

        setLoading(true);
        fetch(url, { method: "GET" })
          .then(function(resp){
            if (!resp.ok) return resp.text().then(function(t){ throw new Error(t || ("HTTP " + resp.status)); });
            return resp.json();
          })
          .then(function(data){
            if (data.popup) { alert(data.popup); return; }
            if (data.error) { alert(data.error); return; }
            fillFields(data);
            var statusSel = $id("D_PROCESS_STATUS");
            if (statusSel) statusSel.disabled = true;
          })
          .catch(function(err){
            console.error("Fetch error:", err);
            alert("Failed to fetch: " + (err && err.message ? err.message : String(err)));
          })
          .finally(function(){
            setLoading(false);
            var statusSel = $id("D_PROCESS_STATUS");
            if (statusSel) statusSel.disabled = true;
          });
      });
    }

    // ========= Invoice Button (calculate + save) =========
    function formatINR(n) {
      try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n); }
      catch(e){ return "INR " + n.toFixed(2); }
    }

    function generateInvoice() {
      var rateEl   = $id("D_RATE");
      var netEl    = $id("D_NET_WEIGHT");
      var amtEl    = $id("DERIVED_AMOUNT");
      var invEl    = $id("D_FISCAL_NO");
      var cardEl   = $id("D_CARD_NO");
      var statusEl = $id("D_PROCESS_STATUS");

      if (!rateEl || !netEl || !amtEl || !invEl || !cardEl) { alert("Required fields not found in DOM."); return; }

      var rate = parseFloat(rateEl.value);
      var net  = parseFloat(netEl.value);
      var invoiceNo = (invEl.value || "").trim();
      var card      = (cardEl.value || "").trim();

      if (!card) { alert("Enter Card No first."); return; }
      if (!invoiceNo) { alert("Enter Invoice No (Fiscal No)."); return; }
      if (!isFinite(rate) || !isFinite(net) || rate <= 0 || net <= 0) { alert("Enter valid positive numbers for Rate and Net Weight."); return; }

      // 1) Calculate amount
      var amount = Number((rate * net).toFixed(2));
      amtEl.value = formatINR(amount);

      // 2) Save to server
      fetch(BASE_PATH + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card: card, invoiceNo: invoiceNo, rate: Number(rate), amount: amount })
      })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, body: j }; }); })
      .then(function(res){
        if (!res.ok || res.body.error) throw new Error(res.body.error || "Save failed");
        if (statusEl) statusEl.value = "16";
        alert("Invoice saved.\\nPROCESS_STATUS=16\\nBATCH_STATUS=0\\nEXIT_GATE_TIME=" + (res.body.exitTime || "(server time set)"));
      })
      .catch(function(err){
        console.error("Save error:", err);
        alert("Failed to save invoice details: " + (err && err.message ? err.message : String(err)));
      });
    }

    var btn = $id("invoiceBtn");
    if (btn) {
      btn.disabled = false;           // ensure clickable
      btn.style.pointerEvents = "auto";
      btn.addEventListener("click", generateInvoice);
    }
  })();
  </script>
</body>
</html>`;
  res.send(html);
});

// =========================
// GET /InvoiceGeneration/fetch?card=XXXX
// =========================
router.get("/fetch", async (req, res) => {
  const card = (req.query.card || req.query.CARD_NO || "").trim();
  if (!card) return res.status(400).json({ error: "Card number is required." });

  try {
    const pool = await sql.connect(dbConfig);

    const query = `
      WITH d AS (
        SELECT TOP 1 *
        FROM DATA_MASTER
        WHERE CARD_NO = @card
      )
      SELECT
        d.TRUCK_REG_NO,
        d.PROCESS_STATUS                 AS PROCESS_STATUS,
        d.CUSTOMER_NAME,
        d.ADDRESS_LINE_1,
        d.ADDRESS_LINE_2,
        d.ITEM_DESCRIPTION,
        d.FAN_TIME_OUT,
        d.SEAL_NO,
        d.ACTUAL_WEIGHT_AT_BAY          AS D_ACTUAL_WEIGHT_AT_BAY,
        d.TARE_WEIGHT                   AS D_TARE_WEIGHT_AT_ENTRY,
        d.GROSS_WEIGHT                  AS D_GROSS_WEIGHT_AT_EXIT,
        d.ENTRY_WEIGHT_TIME,
        d.EXIT_WEIGHT_TIME,

        t.TRAILER_NO,
        t.OWNER_NAME,
        t.DRIVER_NAME,
        t.HELPER_NAME,
        t.CARRIER_COMPANY,
        t.TARE_WEIGHT                   AS T_TARE_WEIGHT,
        t.MAX_WEIGHT,
        t.MAX_FUEL_CAPACITY,
        t.BLACKLIST_STATUS,
        t.REASON_FOR_BLACKLIST,
        t.SAFETY_CERTIFICATION_NO,
        t.CALIBRATION_CERTIFICATION_NO,
        t.TRUCK_SEALING_REQUIREMENT
      FROM d
      LEFT JOIN TRUCK_MASTER t ON t.TRUCK_REG_NO = d.TRUCK_REG_NO
    `;

    const result = await pool.request().input("card", sql.VarChar, card).query(query);
    if (result.recordset.length === 0) return res.json({ popup: "Card not found" });

    const r = result.recordset[0];

    function toDateInput(v) {
      if (!v) return "";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "";
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + mm + "-" + dd;
    }

    // Friendly "dd-mm-yyyy hh:mm:ss AM/PM" using UTC parts; string concat only
    function formatDateTime(v) {
      if (!v) return "";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "";

      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = d.getUTCFullYear();

      let hours = d.getUTCHours();
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");
      const seconds = String(d.getUTCSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const hh = String(hours).padStart(2, "0");

      return dd + "-" + mm + "-" + yyyy + " " + hh + ":" + minutes + ":" + seconds + " " + ampm;
    }

    const net =
      (r.D_GROSS_WEIGHT_AT_EXIT || r.D_GROSS_WEIGHT_AT_EXIT === 0) &&
      (r.D_TARE_WEIGHT_AT_ENTRY || r.D_TARE_WEIGHT_AT_ENTRY === 0)
        ? Number(r.D_GROSS_WEIGHT_AT_EXIT) - Number(r.D_TARE_WEIGHT_AT_ENTRY)
        : "";

    return res.json({
      D_TRUCK_NO: r.TRUCK_REG_NO || "",
      D_PROCESS_STATUS: r.PROCESS_STATUS ?? "",

      T_TRAILER_NUMBER: r.TRAILER_NO || "",
      T_OWNER_NAME: r.OWNER_NAME || "",
      T_DRIVER_NAME: r.DRIVER_NAME || "",
      T_HELPER_NAME: r.HELPER_NAME || "",
      T_CARRIER_COMPANY: r.CARRIER_COMPANY || "",
      D_CUSTOMER_NAME: r.CUSTOMER_NAME || "",
      D_CUSTOMER_ADDRESS_LINE1: r.ADDRESS_LINE_1 || "",
      D_CUSTOMER_ADDRESS_LINE2: r.ADDRESS_LINE_2 || "",
      D_ITEM_DESCRIPTION: r.ITEM_DESCRIPTION || "",
      D_FAN_TIMEOUT: r.FAN_TIME_OUT || "",

      T_TARE_WEIGHT: r.T_TARE_WEIGHT ?? "",
      T_MAX_WEIGHT: r.MAX_WEIGHT ?? "",
      T_MAX_FUEL_CAPACITY: r.MAX_FUEL_CAPACITY ?? "",

      T_BLACKLIST_STATUS: r.BLACKLIST_STATUS ?? "",
      T_BLACKLIST_REASON: r.REASON_FOR_BLACKLIST || "",
      T_SAFETY_CERT_VALID_UPTO: toDateInput(r.SAFETY_CERTIFICATION_NO),
      T_CALIB_CERT_VALID_UPTO:  toDateInput(r.CALIBRATION_CERTIFICATION_NO),
      T_TRUCK_SEALING_REQUIREMENT: r.TRUCK_SEALING_REQUIREMENT ?? "",

      D_SEAL_NO: r.SEAL_NO || "",
      D_NET_WEIGHT: net,
      D_ACTUAL_WEIGHT_AT_BAY: r.D_ACTUAL_WEIGHT_AT_BAY ?? "",
      D_TARE_WEIGHT_AT_ENTRY: r.D_TARE_WEIGHT_AT_ENTRY ?? "",
      D_TARE_WEIGHT_AT_ENTRY_TIME: formatDateTime(r.ENTRY_WEIGHT_TIME),
      D_GROSS_WEIGHT_AT_EXIT_TIME: formatDateTime(r.EXIT_WEIGHT_TIME),
      D_GROSS_WEIGHT_AT_EXIT: r.D_GROSS_WEIGHT_AT_EXIT ?? ""
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Server error while fetching data." });
  }
});

// =========================
// POST /InvoiceGeneration/generate
// Body: { card, invoiceNo, rate, amount }
// =========================
// =========================
// POST /InvoiceGeneration/generate (debug version)
// =========================
router.post("/generate", async (req, res) => {
  const card      = (req.body.card || "").trim();
  const invoiceNo = (req.body.invoiceNo || "").trim();
  const rateRaw   = req.body.rate;
  const amountRaw = req.body.amount;

  // Basic validations
  if (!card)      return res.status(400).json({ error: "card is required." });
  if (!invoiceNo) return res.status(400).json({ error: "invoiceNo is required." });

  const rate   = Number(rateRaw);
  const amount = Number(amountRaw);
  if (!Number.isFinite(rate))   return res.status(400).json({ error: "rate must be a valid number." });
  if (!Number.isFinite(amount)) return res.status(400).json({ error: "amount must be a valid number." });

  let pool, tx;
  try {
    pool = await sql.connect(dbConfig);

    // 1) verify row exists
    const exists = await pool.request()
      .input("card", sql.VarChar(50), card)  // adjust size to your CARD_NO length
      .query("SELECT TOP 1 CARD_NO FROM DATA_MASTER WHERE CARD_NO = @card");

    if (exists.recordset.length === 0) {
      return res.status(404).json({ error: "Card not found in DATA_MASTER." });
    }

    // 2) begin transaction
    tx = new sql.Transaction(pool);
    await tx.begin();

    // 3) do the update
    const reqUp = new sql.Request(tx);
    reqUp.input("invoiceNo", sql.VarChar(50), invoiceNo);     // adjust length to match INVOICE_NO column
    reqUp.input("rate",      sql.Decimal(18, 4), rate);       // adjust precision/scale if your column differs
    reqUp.input("card",      sql.VarChar(50), card);

    // If your amount column isn't AMOUNT_TO_BE_PAID, change it below to the exact name (e.g., AMOUNT or TOTAL_AMOUNT)
    const updateSql = `
      UPDATE DATA_MASTER
         SET INVOICE_NO        = @invoiceNo,
             RATE              = @rate,
             PROCESS_STATUS    = 16,
             BATCH_STATUS      = 0,
             EXIT_GATE_TIME    = GETDATE()
       WHERE CARD_NO = @card
    `;

    await reqUp.query(updateSql);

    // 4) read back EXIT_GATE_TIME for UI
    const reqTime = new sql.Request(tx);
    reqTime.input("card", sql.VarChar(50), card);
    const time = await reqTime.query(`
      SELECT CONVERT(varchar(19), EXIT_GATE_TIME, 120) AS EXIT_GATE_TIME
      FROM DATA_MASTER WHERE CARD_NO = @card
    `);

    await tx.commit();
    return res.json({ ok: true, exitTime: time.recordset[0]?.EXIT_GATE_TIME || null });

  } catch (err) {
    // roll back if needed
    try { if (tx) await tx.rollback(); } catch (e) {}

    // 🔎 Send detailed info to help identify the exact cause
    const detail = (err && err.originalError && err.originalError.info)
      ? err.originalError.info.message
      : (err && err.message) || String(err);

    // TEMPORARY: surface SQL details so you can fix schema/typing issues
    return res.status(500).json({
      error: "SQL UPDATE failed",
      detail
    });
  }
});


module.exports = router;
