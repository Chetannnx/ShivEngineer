const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");

const router = express.Router();
router.use(express.json()); // Needed so req.body works for POST /generate

router.get("/", async (req, res) => {
  // --- server-side guard: if card belongs to PROCESS_TYPE=1, redirect to InvoiceGeneration
  const card = (req.query.card || "").trim();
  if (card) {
    try {
      const pool = await sql.connect(dbConfig);
      const r = await pool.request()
        .input("card", sql.VarChar(50), card)
        .query("SELECT TOP 1 PROCESS_TYPE FROM DATA_MASTER WHERE CARD_NO=@card");
      const type = r.recordset[0]?.PROCESS_TYPE;
      if (String(type) === "1") {
        return res.redirect(302, "/InvoiceGeneration?card=" + encodeURIComponent(card));
      }
    } catch (e) {
      console.error("WeighingBill guard error:", e);
      // If guard fails, we just fall through and render page
    }
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Weighing Bill</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=DM Sans" rel="stylesheet">
  <link rel="stylesheet" href="/Css/WeighingBill.css">
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
      <li><a href="/InvoiceGeneration">INVOICE GENERATION</a></li>
      <li><a class="active" href="/WeighingBill">WEIGHING BILL</a></li>
      <li><a href="/GenerateReport">Generate Report</a></li>
    </ul>
  </nav>

  <h2 style="text-align:center;">
    <i class="fa-solid fa-receipt" style="font-size:21px;"></i>
    WEIGHING BILL
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
      <div class="row"><div class="label">Customer Name :</div><input id="D_CUSTOMER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Item Description :</div>
        <select id="D_ITEM_DESCRIPTION" disabled>
          <option value="">-- Select --</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Jetkero">Jetkero</option>
        </select>
      </div>
      <div class="row"><div class="label">Fan Timeout :</div><input id="D_FAN_TIMEOUT" type="text" readonly></div>
      <div class="row"><div class="label">Tare Weight :</div><input id="T_TARE_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Max Weight :</div><input id="T_MAX_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Max Fuel Capacity :</div><input id="T_MAX_FUEL_CAPACITY" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Ticket Number :</div><input id="TICKET_NUMBER" type="text"></div>
    </div>

    <!-- RIGHT -->
    <div class="card">
      <div class="row"><div class="label">Blacklist Status :</div>
        <select id="T_BLACKLIST_STATUS" disabled>
          <option>-- Select --</option>
          <option value="1">Blacklist</option>
          <option value="0">Not_Blacklist</option>
        </select>
      </div>
      <div class="row"><div class="label">Reason For Blacklist :</div><input id="T_BLACKLIST_REASON" type="text" readonly></div>
      <div class="row"><div class="label">Safety Cer. Valid Upto :</div><input id="T_SAFETY_CERT_VALID_UPTO" type="date" readonly></div>
      <div class="row"><div class="label">Calibration Cer. Valid Upto :</div><input id="T_CALIB_CERT_VALID_UPTO" type="date" readonly></div>
      <div class="row"><div class="label">Truck Sealing Requirement :</div>
        <select id="T_TRUCK_SEALING_REQUIREMENT" disabled>
          <option>-- Select --</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
      <div class="row"><div class="label">Seal No :</div><input id="D_SEAL_NO" type="text" readonly></div>
      <div class="row"><div class="label">Net Weight :</div><input id="D_NET_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Gross Weight at Entry :</div><input id="D_GROSS_WEIGHT_AT_ENTRY" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Tare Weight at Exit :</div><input id="D_TARE_WEIGHT_AT_EXIT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Gross Weight at Entry Time :</div><input id="D_GROSS_WEIGHT_AT_ENTRY_TIME" type="text" readonly></div>
      <div class="row"><div class="label">Tare Weight at Exit Time :</div><input id="D_TARE_WEIGHT_AT_EXIT_TIME" type="text" readonly></div>
    </div>
  </section>

    <script>
document.addEventListener("DOMContentLoaded", function () {
  (function () {
    const BASE_PATH = "/WeighingBill";

    const $ = (id) => document.getElementById(id);

    const getQueryParam = (name) => {
      const params = new URLSearchParams(window.location.search);
      return params.get(name) || "";
    };

    const toDateInput = (v) => {
      if (!v) return "";
      const d = new Date(v);
      if (isNaN(d.getTime())) return "";
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + mm + "-" + dd;
    };

    function fillFields(data) {
      Object.keys(data).forEach((id) => {
        const el = $(id);
        if (!el) return;
        const val = data[id];

        if (el.type === "date") { el.value = toDateInput(val); return; }

        if (el.tagName === "SELECT") {
          const v = String(val ?? "");
          if (![...el.options].some(o => o.value === v) && v !== "") {
            const opt = document.createElement("option");
            opt.value = v; opt.textContent = v;
            el.appendChild(opt);
          }
          el.value = v;
          return;
        }

        el.value = val ?? "";
      });
    }

    function setLoading(loading) {
      document.body.style.cursor = loading ? "progress" : "auto";
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.id === "D_CARD_NO") return;
        el.disabled = loading;
      });
    }

    // ----- core fetch logic (call this instead of faking a keypress) -----
    function fetchByCard(card) {
      if (!card) { alert("Please enter a Card No."); return; }
      setLoading(true);
      fetch(BASE_PATH + "/fetch?card=" + encodeURIComponent(card))
        .then((resp) => resp.ok ? resp.json() : resp.text().then(t => { throw new Error(t || ("HTTP " + resp.status)); }))
        .then((data) => {
          if (data.popup) { alert(data.popup); return; }
          if (data.error) { alert(data.error); return; }

          // If PROCESS_TYPE is 1, this card belongs to InvoiceGeneration. Bounce back.
          if (String(data.D_PROCESS_TYPE) === "1") {
            window.location.href = "/InvoiceGeneration?card=" + encodeURIComponent(card);
            return;
          }

          fillFields(data);
        })
        .catch((err) => {
          console.error("WeighingBill fetch error:", err);
          alert("Failed to fetch: " + (err && err.message ? err.message : String(err)));
        })
        .finally(() => setLoading(false));
    }

    // ---- Enter key on the Card No field ----
    const cardInput = $("D_CARD_NO");
    if (cardInput) {
      cardInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        fetchByCard(cardInput.value.trim());
      });
    }

    // ---- Auto-load if redirected with ?card= ----
    const queryCard = getQueryParam("card");
    if (queryCard) {
      if (cardInput) cardInput.value = queryCard;
      fetchByCard(queryCard); // direct call (no synthetic KeyboardEvent)
    }
  })();
});
</script>

</body>
</html>`;
  res.send(html);
});



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
        d.INVOICE_NO,                     
        d.CUSTOMER_NAME,
        d.ITEM_DESCRIPTION,
        d.FAN_TIME_OUT,
        d.SEAL_NO,
        d.TARE_WEIGHT                   AS D_TARE_WEIGHT_AT_EXIT,
        d.GROSS_WEIGHT                  AS D_GROSS_WEIGHT_AT_ENTRY,
        d.ENTRY_WEIGHT_TIME,
        d.EXIT_WEIGHT_TIME,
        d.PROCESS_TYPE,
        


        
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
      (r.D_GROSS_WEIGHT_AT_ENTRY || r.D_GROSS_WEIGHT_AT_ENTRY === 0) &&
      (r.D_TARE_WEIGHT_AT_EXIT || r.D_TARE_WEIGHT_AT_EXIT === 0)
        ? Number(r.D_GROSS_WEIGHT_AT_ENTRY) - Number(r.D_TARE_WEIGHT_AT_EXIT)
        : "";

    return res.json({
      D_TRUCK_NO: r.TRUCK_REG_NO || "",
      D_PROCESS_STATUS: r.PROCESS_STATUS ?? "",
      D_FISCAL_NO: r.INVOICE_NO || "",
      D_PROCESS_TYPE: r.PROCESS_TYPE ?? null,   // <<< ADD THIS

      D_CUSTOMER_NAME: r.CUSTOMER_NAME || "",
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
      D_TARE_WEIGHT_AT_EXIT: r.D_TARE_WEIGHT_AT_EXIT ?? "",
      D_TARE_WEIGHT_AT_EXIT_TIME: formatDateTime(r.EXIT_WEIGHT_TIME),
      D_GROSS_WEIGHT_AT_ENTRY_TIME: formatDateTime(r.ENTRY_WEIGHT_TIME),
      D_GROSS_WEIGHT_AT_ENTRY: r.D_GROSS_WEIGHT_AT_ENTRY ?? ""
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Server error while fetching data." });
  }
});

module.exports = router;