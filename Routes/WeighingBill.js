const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");
const path = require("path");
const fs = require("fs");

const router = express.Router();
router.use(express.json()); // Needed so req.body works for POST /generate

// === add at top with others ===
const PDFDocument = require("pdfkit");

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
   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
  <link rel="stylesheet" href="/Css/WeighingBill.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
</head>
<body style="font-family: 'DM Sans', sans-serif;">
  <div id="navbar"></div>

  <h2><span class="p-2 bg-primary/10 rounded-lg text-primary"><span class="material-symbols-outlined">receipt</span></span>WEIGHING BILL</h2>

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
      <input type="text" id="D_FISCAL_NO" placeholder="Enter Invoice No" autofocus>
    </div>
  </section>

  <!-- LEFT / RIGHT -->
  <section class="grid">
    <!-- LEFT -->
      <div class="row"><div class="label">Customer Name :</div><input id="D_CUSTOMER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Blacklist Status :</div>
        <select id="T_BLACKLIST_STATUS" disabled>
          <option>-- Select --</option>
          <option value="1">Blacklist</option>
          <option value="0">Not_Blacklist</option>
        </select>
      </div>
        <div class="row"><div class="label">Item Description :</div>
          <select id="D_ITEM_DESCRIPTION" disabled>
            <option value="">-- Select --</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Jetkero">Jetkero</option>
          </select>
        </div>
        <div class="row"><div class="label">Reason For Blacklist :</div><input id="T_BLACKLIST_REASON" type="text" readonly></div>
        <div class="row"><div class="label">Fan Timeout :</div><input id="D_FAN_TIMEOUT" type="text" readonly></div>

        <div class="form-row two-col">
          <div class="row"><div class="label">Safety Cer. Valid Upto :</div><input id="T_SAFETY_CERT_VALID_UPTO" type="date" readonly></div>
          <div class="row"><div class="label">Calibration Cer. Valid Upto :</div><input id="T_CALIB_CERT_VALID_UPTO" type="date" readonly></div>
        </div>

        <div class="row"><div class="label">Tare Weight :</div><input id="T_TARE_WEIGHT" type="number" min="0" step="0.01" readonly></div>
        <div class="row"><div class="label">Truck Sealing Requirement :</div>
        <select id="T_TRUCK_SEALING_REQUIREMENT" disabled>
          <option>-- Select --</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
        <div class="row"><div class="label">Max Weight :</div><input id="T_MAX_WEIGHT" type="number" min="0" step="0.01" readonly></div>

      <div class="form-row two-col">
        <div class="row"><div class="label">Seal No :</div><input id="D_SEAL_NO" type="text" readonly></div>
        <div class="row"><div class="label">Net Weight :</div><input id="D_NET_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      </div> 

        <div class="row"><div class="label">Max Fuel Capacity :</div><input id="T_MAX_FUEL_CAPACITY" type="number" min="0" step="0.01" readonly></div>

      <div class="form-row two-col">
        <div class="row"><div class="label">Gross Weight at Entry :</div><input id="D_GROSS_WEIGHT_AT_ENTRY" type="number" min="0" step="0.01" readonly></div>
        <div class="row"><div class="label">Tare Weight at Exit :</div><input id="D_TARE_WEIGHT_AT_EXIT" type="number" min="0" step="0.01" readonly></div>
      </div>

        <div class="row"><div class="label">Ticket Number :</div><input id="TICKET_NUMBER" type="text" readonly></div>

      
      <div class="form-row two-col">
        <div class="row"><div class="label">Gross Weight at Entry Time :</div><input id="D_GROSS_WEIGHT_AT_ENTRY_TIME" type="text" readonly></div>
        <div class="row"><div class="label">Tare Weight at Exit Time :</div><input id="D_TARE_WEIGHT_AT_EXIT_TIME" type="text" readonly></div>
      </div>

       <button id="WeighingBill" class="grid-btn" type="button"><span class="material-symbols-outlined">receipt</span>Weighing Bill</button>
    
  </section>

    <script>
document.addEventListener("DOMContentLoaded", function () {
    const FiscalNo = document.getElementById("D_FISCAL_NO");
    if (FiscalNo) {
      FiscalNo.focus();
      FiscalNo.select();   // optional: selects existing text
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
        el.disabled = true;
      });
    }

    function fetchByCard(card) {
      if (!card) { alert("Please enter a Card No."); return; }
      setLoading(true);
      fetch(BASE_PATH + "/fetch?card=" + encodeURIComponent(card))
        .then((resp) => resp.ok ? resp.json() : resp.text().then(t => { throw new Error(t || ("HTTP " + resp.status)); }))
        .then((data) => {
          if (data.popup) { alert(data.popup); return; }
          if (data.error) { alert(data.error); return; }
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

    // Enter key on the Card No field
    const cardInput = $("D_CARD_NO");
    if (cardInput) {
      cardInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        fetchByCard(cardInput.value.trim());
      });
    }

    // Auto-load if redirected with ?card=
    const queryCard = getQueryParam("card");
    if (queryCard) {
      if (cardInput) cardInput.value = queryCard;
      fetchByCard(queryCard);
    }

    // ✅ Download PDF on button click (now inside same scope as BASE_PATH)
    const btn = $("WeighingBill");
    if (btn) {
  btn.addEventListener("click", async function () {
  const card = ($("D_CARD_NO")?.value || "").trim();
  if (!card) { alert("Please enter a Card No."); return; }
  const fiscal = ($("D_FISCAL_NO")?.value || "").trim();
  const url = BASE_PATH + "/pdf?card=" + encodeURIComponent(card) + (fiscal ? ("&fiscal=" + encodeURIComponent(fiscal)) : "");

  try {
    document.body.style.cursor = "progress";

    const resp = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/pdf" }
    });

    if (!resp.ok) throw new Error("Server returned " + resp.status);

    const blob = await resp.blob();

    // Parse filename from Content-Disposition (if provided)
    const cd = resp.headers.get("Content-Disposition") || "";
    let suggestedName = "Weighing_Bill.pdf";
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);
    if (m && m[1]) {
      try { suggestedName = decodeURIComponent(m[1]); } catch(e) { suggestedName = m[1]; }
    } else {
      // fallback to card-based name
      suggestedName = "Weighing_Bill_+{card || Date.now()}.pdf";
    }

    // 1) Preferred: File System Access API (Chrome/Edge, secure contexts)
    if (window.showSaveFilePicker) {
      const opts = {
        suggestedName,
        types: [{
          description: "PDF File",
          accept: { "application/pdf": [".pdf"] }
        }]
      };
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    // 2) IE/Old Edge: navigator.msSaveOrOpenBlob
    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, suggestedName);
      return;
    }

    // 3) Fallback: anchor download (may not show Save As depending on browser settings)
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // release URL after a short delay to ensure download started
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

  } catch (err) {
    console.error("PDF save error:", err);
    //alert("Failed to save PDF: " + (err && err.message ? err.message : err));
  } finally {
    document.body.style.cursor = "auto";
  }
});

    }
  })();
});



// ---- Download PDF on button click ----
// const btn = document.getElementById("WeighingBill");
// if (btn) {
//   btn.addEventListener("click", function () {
//     const card = (document.getElementById("D_CARD_NO")?.value || "").trim();
//     if (!card) { alert("Please enter a Card No."); return; }
//     // Direct download
//     window.location.href = BASE_PATH + "/pdf?card=" + encodeURIComponent(card);
//   });
// }

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
        d.FAN_NO,
        


        
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
      TICKET_NUMBER: r.FAN_NO || "",

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

// ✅ STEP 3: Paste the helper function right here — BEFORE module.exports
async function getWeighingBillDataByCard(card) {
  const pool = await sql.connect(dbConfig);

  const query = `
    WITH d AS (
      SELECT TOP 1 *
      FROM DATA_MASTER
      WHERE CARD_NO = @card
    )
    SELECT
      d.TRUCK_REG_NO,
      d.PROCESS_STATUS AS PROCESS_STATUS,
      d.INVOICE_NO,                   
      d.CUSTOMER_NAME,
      d.ITEM_DESCRIPTION,
      d.FAN_TIME_OUT,
      d.SEAL_NO,
      d.TARE_WEIGHT AS D_TARE_WEIGHT_AT_EXIT,
      d.GROSS_WEIGHT AS D_GROSS_WEIGHT_AT_ENTRY,
      d.ENTRY_WEIGHT_TIME,
      d.EXIT_WEIGHT_TIME,
      d.PROCESS_TYPE,
      d.FAN_NO,

      t.TARE_WEIGHT AS T_TARE_WEIGHT,
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
  if (!result.recordset.length) return null;

  const r = result.recordset[0];

  const net =
    (r.D_GROSS_WEIGHT_AT_ENTRY || r.D_GROSS_WEIGHT_AT_ENTRY === 0) &&
    (r.D_TARE_WEIGHT_AT_EXIT || r.D_TARE_WEIGHT_AT_EXIT === 0)
      ? Number(r.D_GROSS_WEIGHT_AT_ENTRY) - Number(r.D_TARE_WEIGHT_AT_EXIT)
      : "";

   function fmtDate(v) {
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

  return {
    ticketNo: r.FAN_NO || "",
    fiscalNo: r.INVOICE_NO || "",
    truckNo: r.TRUCK_REG_NO || "",
    sealNo: r.SEAL_NO || "",

    customerName: r.CUSTOMER_NAME || "",
    
    tareExit: r.D_TARE_WEIGHT_AT_EXIT ?? "",
    grossEntry: r.D_GROSS_WEIGHT_AT_ENTRY ?? "",
    netWeight: net === "" ? "" : String(net),
    grossEntryTime: fmtDate(r.ENTRY_WEIGHT_TIME),
    tareExitTime: fmtDate(r.EXIT_WEIGHT_TIME),
    item: r.ITEM_DESCRIPTION || "",
  };
}


// === PDF route ===
router.get("/pdf", async (req, res) => {
  try {
    const card = (req.query.card || "").trim();
    if (!card) return res.status(400).send("card query is required");

    const fiscal = (req.query.fiscal || "").trim(); // <-- fiscal from client

    const pool = await sql.connect(dbConfig);

    // If fiscal provided, update the DB first (use parameterized query)
    if (fiscal) {
      const updateResult = await pool.request()
        .input("fiscal", sql.VarChar(100), fiscal)
        .input("card", sql.VarChar(50), card)
        .query(`
          UPDATE DATA_MASTER
          SET INVOICE_NO = @fiscal,
              PROCESS_STATUS = 16
          WHERE CARD_NO = @card
        `);

      // Optional: check rowsAffected
      if (!updateResult.rowsAffected || updateResult.rowsAffected[0] === 0) {
        // card not found or update failed — you may choose to continue or return 404
        console.warn(`PDF route: no rows updated for card ${card}`);
      }
    }

    const data = await getWeighingBillDataByCard(card);
    if (!data) return res.status(404).send("Card not found");

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 36 }); // 595x842 pt, 0.5in margin
    const filename = `Weighing_Bill_${(data.ticketNo || card).toString().replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // (Optional) If you have a logo file in public, you can draw it like:
    // const logoPath = path.join(__dirname, "../public/Assets/somgas.png");
    // if (fs.existsSync(logoPath)) doc.image(logoPath, 36, 36, { width: 120 });

    // helper quick draw
    const LBL = (x, y, t) => { doc.fontSize(10).font("Helvetica-Bold").text(t, x, y); };
    const VAL = (x, y, t, w=240) => { doc.fontSize(11).font("Helvetica").text(t || "", x, y, { width: w }); };
    const H2  = (y, t) => { doc.fontSize(14).font("Helvetica-Bold").text(t, 0, y, { align: "center" }); };
    const line = (y) => { doc.moveTo(36, y).lineTo(559, y).stroke(); };

    function section(yTop) {
  const logoPath = path.join(__dirname, "../icons/Somgas.png"); // ✅ correct path
  const hasLogo = fs.existsSync(logoPath);

  if (hasLogo) {
    // draw logo on the left
    doc.image(logoPath, 36, yTop, { width: 100 });
  }

  doc.fontSize(16)
     .font("Helvetica-Bold")
     .text("WEIGHING BILL", hasLogo ? 160 : 0, yTop + 20, {
       align: hasLogo ? "center" : "center",
     });

  // draw line below header
  doc.moveTo(36, yTop + 50).lineTo(559, yTop + 50).stroke();

  const y = yTop + 70;;

      // row 1
      LBL(36, y, "Ticket No:");
      VAL(120, y, data.ticketNo);
      LBL(320, y, "Fiscal No:");
      VAL(400, y, data.fiscalNo);

      // row 2
      LBL(36, y+20, "Truck No:");
      VAL(120, y+20, data.truckNo);
      LBL(320, y+20, "Item:");
      VAL(400, y+20, data.item);

      // row 3
      LBL(36, y+40, "Customer Name:");
      VAL(150, y+40, data.customerName, 380);

      // row 4
      LBL(36, y+60, "Seal No:");
      VAL(120, y+60, data.sealNo);

      // weights & times
      LBL(36, y+92, "Tare Weight:");
      VAL(120, y+92, data.tareExit ? `${data.tareExit} kg` : "");
      LBL(320, y+92, "Date & Time:");
      VAL(400, y+92, data.tareExitTime);

      LBL(36, y+112, "Gross Weight:");
      VAL(120, y+112, data.grossEntry ? `${data.grossEntry} kg` : "");
      LBL(320, y+112, "Date & Time:");
      VAL(400, y+112, data.grossEntryTime);

      LBL(36, y+132, "Net Weight:");
      VAL(120, y+132, data.netWeight ? `${data.netWeight} kg` : "");

      // signatures
      const boxY = y+170;
      doc.rect(36, boxY, 230, 28).stroke();
      doc.rect(320, boxY, 230, 28).stroke();
      doc.fontSize(10).font("Helvetica").text("Driver Signature", 36+6, boxY+8);
      doc.text("Operator Signature", 320+6, boxY+8);

      // bottom cut line
      line(boxY + 48);
    }

    // Top copy
    section(36);
    // Bottom copy
    section(420);

    doc.end();
  } catch (err) {
    console.error("WeighingBill /pdf error:", err);
    res.status(500).send("Server error while generating PDF.");
  }
});


module.exports = router;