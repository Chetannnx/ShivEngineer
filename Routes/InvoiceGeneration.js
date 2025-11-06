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
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
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

  <h2 style="text-align:center;font-family: 'DM Sans', sans-serif;">
            <i class="fa-solid fa-receipt" style="font-size: 21px;"></i>
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

  <!-- LEFT / RIGHT SIDE -->
  <section class="grid">
    <!-- LEFT SIDE -->
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
      <div class="row"><div class="label">Rate :</div><input id="D_RATE" type="number" placeholder="Enter Rate"></div>
      <div class="row"><div class="label">Fan Timeout :</div><input id="D_FAN_TIMEOUT" type="text"></div>
      <div class="row"><div class="label">Tare Weight :</div><input id="T_TARE_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Max Weight :</div><input id="T_MAX_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Max Fuel Capacity :</div><input id="T_MAX_FUEL_CAPACITY" type="number"></div>
    </div>

    <!-- RIGHT SIDE -->
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
      <div class="row"><div class="label">Net Weight :</div><input id="D_NET_WEIGHT" type="number"></div>
      <div class="row"><div class="label">Actual Quantity Filled :</div><input id="D_ACTUAL_WEIGHT_AT_BAY" type="text"></div>
      <div class="row"><div class="label">Tare Weight at Entry :</div><input id="D_TARE_WEIGHT_AT_ENTRY" type="number"></div>
      <div class="row"><div class="label">Gross Weight at Exit :</div><input id="D_GROSS_WEIGHT_AT_EXIT" type="number"></div>
      <div class="row"><div class="label">Tare Weight at Entry Time :</div><input id="D_TARE_WEIGHT_AT_ENTRY_TIME" type="text"></div>
      <div class="row"><div class="label">Gross Weight at Exit Time :</div><input id="D_GROSS_WEIGHT_AT_EXIT_TIME" type="text"></div>
      <div class="row"><div class="label">Payment Due Date :</div><input id="DERIVED_DUE" type="date"></div>
      <div class="row"><div class="label">Amount To Be Paid :</div><input id="DERIVED_AMOUNT" type="text" placeholder="₹"></div>
    </div>
  </section>

<button id="invoiceBtn">Invoice Generation</button>


  <!-- Script to fetch and fill data -->
  <script>
      
//============
// FETCH DATA 
//============
/* ============================
   InvoiceGeneration – Frontend
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  // ---- config: set the route mount path ----
  const BASE_PATH = "/InvoiceGeneration";

  // ---- helpers ----
  const $id = (x) => document.getElementById(x);

  // Accepts JS Date | ISO string | ticks | anything Date can parse → "yyyy-mm-dd"
  const toDateInput = (v) => {
    if (v == null || v === "") return "";
    const d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
   return d.getFullYear() + "-" + mm + "-" + dd;

  };

  // Generic filler: sets value for inputs/selects with IDs matching JSON keys
  const fillFields = (data) => {
    Object.entries(data).forEach(([id, val]) => {
      const el = $id(id);
      if (!el) return;

      // If it's a date input and value looks like a date → normalize
      if (el.type === "date") {
        el.value = toDateInput(val);
        return;
      }

      if (el.tagName === "SELECT") {
        const v = String(val ?? "");
        // Set if present, otherwise (optionally) append then set
        if (![...el.options].some(o => o.value === v) && v !== "") {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v;
          el.appendChild(opt);
        }
        el.value = v;
        return;
      }

      // Default for <input>, <textarea>
      el.value = (val ?? "");
    });
  };

  // Small UX: disable inputs during fetch
  const setLoading = (loading) => {
    const root = document.body;
    root.style.cursor = loading ? "progress" : "auto";
    // disable only the editable fields on the page
    document.querySelectorAll("input, select, textarea, button").forEach(el => {
      if (el.id === "D_CARD_NO") return; // keep card editable if you prefer
      el.disabled = loading;
    });
  };

  // ---- main handler: fetch on Enter in Card No ----
  const cardInput = $id("D_CARD_NO");
  if (!cardInput) {
    console.error("Missing input #D_CARD_NO");
    return;
  }

  cardInput.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const card = cardInput.value.trim();
    if (!card) {
      alert("Please enter a Card No.");
      return;
    }

    const url = BASE_PATH + "/fetch?card=" + encodeURIComponent(card);
;

    try {
      setLoading(true);

      const resp = await fetch(url, { method: "GET" });
      if (!resp.ok) {
        // Read raw text so SQL/stack messages are visible
        const text = await resp.text();
        throw new Error(text || ("HTTP " + resp.status));

      }

      const data = await resp.json();

      if (data.popup) {
        alert(data.popup);
        return;
      }
      if (data.error) {
        alert(data.error);
        return;
      }

      fillFields(data);

       // ⬅️ make Truck Status dropdown read-only
      $id("D_PROCESS_STATUS").disabled = true;
      
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to fetch: " + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
      $id("D_PROCESS_STATUS").disabled = true;  // keep it read-only
    }
  });
});


//===================
//Invoice Button
//====================
// When Invoice Generation button is clicked → calculate Amount
const invoiceBtn = document.getElementById("invoiceBtn");

if (invoiceBtn) {
  invoiceBtn.addEventListener("click", () => {
    const rateEl = document.getElementById("D_RATE");
    const netWeightEl = document.getElementById("D_NET_WEIGHT");
    const amountEl = document.getElementById("DERIVED_AMOUNT");

    // read numeric values
    const rate = parseFloat(rateEl.value) || 0;
    const netWeight = parseFloat(netWeightEl.value) || 0;

    // check for empty values
    if (!rate || !netWeight) {
      alert("Please enter both Rate and Net Weight first.");
      return;
    }

    // calculate total
    const total = rate * netWeight;

    // format total as USD ($)
    const formatted = total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

    // show result in Amount field
    amountEl.value = formatted;
    

    // optional: green flash animation to indicate update
    amountEl.style.transition = "0.3s";
    amountEl.style.backgroundColor = "#e0ffe0";
    setTimeout(() => (amountEl.style.backgroundColor = ""), 500);
  });
}


  </script>

</body>
</html>`;
  res.send(html);
});

// ⬇️ Add this under your router.get("/")
// GET /InvoiceGeneration/api/by-card?card=XXXX
// GET /InvoiceGeneration/fetch?card=XXXX
// GET /InvoiceGeneration/fetch?card=XXXX
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
        -- From DATA_MASTER
        d.TRUCK_REG_NO,
        d.PROCESS_STATUS                 AS PROCESS_STATUS,
        d.CUSTOMER_NAME,
        d.ADDRESS_LINE_1,
        d.ADDRESS_LINE_2,
        d.ITEM_DESCRIPTION,
        d.FAN_TIME_OUT,
        d.SEAL_NO,
        d.ACTUAL_WEIGHT_AT_BAY        AS D_ACTUAL_WEIGHT_AT_BAY,
        d.TARE_WEIGHT             AS D_TARE_WEIGHT_AT_ENTRY,
        d.GROSS_WEIGHT            AS D_GROSS_WEIGHT_AT_EXIT,
        d.ENTRY_WEIGHT_TIME,
        d.EXIT_WEIGHT_TIME,

        -- From TRUCK_MASTER (join by TRUCK_REG_NO)
        t.TRAILER_NO,
        t.OWNER_NAME,
        t.DRIVER_NAME,
        t.HELPER_NAME,
        t.CARRIER_COMPANY,
        t.TARE_WEIGHT             AS T_TARE_WEIGHT,
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

    // format date -> yyyy-mm-dd for <input type="date">
    const toDateInput = v => {
      if (!v) return "";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "";
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    // ⬅️ Added new helper: format datetime to "dd-mm-yyyy hh:mm:ss AM/PM"
    // use UTC getters so no +5:30 shift is applied
const formatDateTime = (v) => {
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

  return `${dd}-${mm}-${yyyy} ${hh}:${minutes}:${seconds} ${ampm}`;
};


    // Optional derived net weight if both present
    const net = (r.D_GROSS_WEIGHT_AT_EXIT ?? r.D_GROSS_WEIGHT_AT_EXIT === 0) && (r.D_TARE_WEIGHT_AT_ENTRY ?? r.D_TARE_WEIGHT_AT_ENTRY === 0)
      ? Number(r.D_GROSS_WEIGHT_AT_EXIT) - Number(r.D_TARE_WEIGHT_AT_ENTRY)
      : "";

    return res.json({
      // Top bar
      D_TRUCK_NO: r.TRUCK_REG_NO || "",
      D_PROCESS_STATUS: r.PROCESS_STATUS ?? "",

      // LEFT (TRUCK_MASTER + customer)
      T_TRAILER_NUMBER: r.TRAILER_NO || "",
      T_OWNER_NAME: r.OWNER_NAME || "",
      T_DRIVER_NAME: r.DRIVER_NAME || "",
      T_HELPER_NAME: r.HELPER_NAME || "",
      T_CARRIER_COMPANY: r.CARRIER_COMPANY || "",
      D_CUSTOMER_NAME: r.CUSTOMER_NAME || "",
      D_CUSTOMER_ADDRESS_LINE1: r.ADDRESS_LINE_1 || "",
      // If you add a Line2 input later, include it too:
      D_CUSTOMER_ADDRESS_LINE2: r.ADDRESS_LINE_2 || "",
      D_ITEM_DESCRIPTION: r.ITEM_DESCRIPTION || "",
      D_FAN_TIMEOUT: r.FAN_TIME_OUT || "",

      T_TARE_WEIGHT: r.T_TARE_WEIGHT ?? "",
      T_MAX_WEIGHT: r.MAX_WEIGHT ?? "",
      T_MAX_FUEL_CAPACITY: r.MAX_FUEL_CAPACITY ?? "",

      // RIGHT (TRUCK_MASTER + DATA_MASTER)
      T_BLACKLIST_STATUS: r.BLACKLIST_STATUS ?? "",                 // expect "Yes"/"No" or 1/0
      T_BLACKLIST_REASON: r.REASON_FOR_BLACKLIST || "",
      T_SAFETY_CERT_VALID_UPTO: toDateInput(r.SAFETY_CERTIFICATION_NO),      // if these are dates; if not, just return raw
      T_CALIB_CERT_VALID_UPTO:  toDateInput(r.CALIBRATION_CERTIFICATION_NO), // same note as above
      T_TRUCK_SEALING_REQUIREMENT: r.TRUCK_SEALING_REQUIREMENT ?? "",    // expect "Yes"/"No" or 1/0

      D_SEAL_NO: r.SEAL_NO || "",
      D_NET_WEIGHT: net,  // derived; remove if you don't want auto-calc
      D_ACTUAL_WEIGHT_AT_BAY: r.D_ACTUAL_WEIGHT_AT_BAY ?? "",
      D_TARE_WEIGHT_AT_ENTRY: r.D_TARE_WEIGHT_AT_ENTRY ?? "",
       D_TARE_WEIGHT_AT_ENTRY_TIME: formatDateTime(r.ENTRY_WEIGHT_TIME),  // formatted
      D_GROSS_WEIGHT_AT_EXIT_TIME: formatDateTime(r.EXIT_WEIGHT_TIME),    // formatted
      // If you actually wanted gross *value* in a separate field:
      D_GROSS_WEIGHT_AT_EXIT: r.D_GROSS_WEIGHT_AT_EXIT ?? ""
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Server error while fetching data." });
  }
});




module.exports = router;
