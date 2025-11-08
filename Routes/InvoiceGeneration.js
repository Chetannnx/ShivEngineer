const express = require("express");
const sql = require("mssql/msnodesqlv8");
const dbConfig = require("../Config/dbConfig");

const router = express.Router();
router.use(express.json()); // Needed so req.body works for POST /generate

router.get("/", async (req, res) => {
  // --- server-side guard: if card belongs to PROCESS_TYPE=0, redirect to WeighingBill
  const card = (req.query.card || "").trim();
  if (card) {
    try {
      const pool = await sql.connect(dbConfig);
      const r = await pool.request()
        .input("card", sql.VarChar(50), card)
        .query("SELECT TOP 1 PROCESS_TYPE FROM DATA_MASTER WHERE CARD_NO=@card");
      const type = r.recordset[0]?.PROCESS_TYPE;
      if (String(type) === "0") {
        return res.redirect(302, "/WeighingBill?card=" + encodeURIComponent(card));
      }
    } catch (e) {
      console.error("InvoiceGeneration guard error:", e);
      // If guard fails, we just fall through and render page
    }
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice Generation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=DM Sans" rel="stylesheet">
  <link rel="stylesheet" href="/Css/InvoiceGeneration.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
  <!-- JS libraries (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"></script>

<img id="somgasLogo" src="/Icons/Somgas.png" alt="" style="display:none">

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
      <li><a href="/WeighingBill">WEIGHING BILL</a></li>
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
      <input type="text" id="D_FISCAL_NO" placeholder="Enter Invoice No" >
    </div>
  </section>

  <!-- LEFT / RIGHT -->
  <section class="grid">
    <!-- LEFT -->
    <div class="card">
      <div class="row"><div class="label">Trailer Number :</div><input id="T_TRAILER_NUMBER" type="text" readonly></div>
      <div class="row"><div class="label">Owner Name :</div><input id="T_OWNER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Driver Name :</div><input id="T_DRIVER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Helper Name :</div><input id="T_HELPER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Carrier Company :</div><input id="T_CARRIER_COMPANY" type="text" readonly></div>
      <div class="row"><div class="label">Customer Name :</div><input id="D_CUSTOMER_NAME" type="text" readonly></div>
      <div class="row"><div class="label">Customer Address Line1 :</div><input id="D_CUSTOMER_ADDRESS_LINE1" type="text" readonly></div>
      <div class="row"><div class="label">Customer Address Line2 :</div><input id="D_CUSTOMER_ADDRESS_LINE2" type="text" readonly></div>
      <div class="row"><div class="label">Item Description :</div>
        <select id="D_ITEM_DESCRIPTION" disabled>
          <option value="">-- Select --</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Jetkero">Jetkero</option>
        </select>
      </div>
      <div class="row"><div class="label">Rate :</div><input id="D_RATE" type="number" min="0" step="0.01" placeholder="Enter Rate" ></div>
      <div class="row"><div class="label">Fan Timeout :</div><input id="D_FAN_TIMEOUT" type="text" readonly></div>
      <div class="row"><div class="label">Tare Weight :</div><input id="T_TARE_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Max Weight :</div><input id="T_MAX_WEIGHT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Max Fuel Capacity :</div><input id="T_MAX_FUEL_CAPACITY" type="number" min="0" step="0.01" readonly></div>
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
      <div class="row"><div class="label">Actual Quantity Filled :</div><input id="D_ACTUAL_WEIGHT_AT_BAY" type="text" readonly></div>
      <div class="row"><div class="label">Tare Weight at Entry :</div><input id="D_TARE_WEIGHT_AT_ENTRY" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Gross Weight at Exit :</div><input id="D_GROSS_WEIGHT_AT_EXIT" type="number" min="0" step="0.01" readonly></div>
      <div class="row"><div class="label">Tare Weight at Entry Time :</div><input id="D_TARE_WEIGHT_AT_ENTRY_TIME" type="text" readonly></div>
      <div class="row"><div class="label">Gross Weight at Exit Time :</div><input id="D_GROSS_WEIGHT_AT_EXIT_TIME" type="text" readonly></div>
      <div class="row"><div class="label">Payment Due Date :</div><input id="DERIVED_DUE" type="date"></div>
      <div class="row"><div class="label">Amount To Be Paid :</div><input id="DERIVED_AMOUNT" type="text" placeholder="₹" readonly></div>
    </div>
  </section>

  <button id="invoiceBtn" type="button">Invoice Generation</button>



  <!-- SCRIPTS -->



  <script>
  let FETCHED = {}; // store last SQL response

// =====================================================
// Helper: Collect all invoice data from form fields
// =====================================================
function collectInvoiceModel() {
  const $ = (id) => (document.getElementById(id)?.value ?? "").trim();

  const qty  = parseFloat($("D_NET_WEIGHT")) || 0;
  const rate = parseFloat($("D_RATE")) || 0;
  const amount = +(qty * rate).toFixed(2);

  return {
    // For backend save
    card: $("D_CARD_NO"),
    invoiceNo: $("D_FISCAL_NO"),
    rate,
    netWeight: qty,
    amount,

    // For PDF
    company: {
      name:  "Somgas Company",
      addr1: "Opposite Berbera Main Road, Near Port,",
      addr2: "HQ: Hargeisa, Somaliland",
      email: "somgaslpterminal@gmail.com"
    },
    invoice: {
      number: $("D_FISCAL_NO"),
      date:   $("DERIVED_DUE") || new Date().toISOString().slice(0,10),
      terms:  "Due On Receipt",
      dueDate: $("DERIVED_DUE") || "",
      currencyLabel: "USD",
      balanceDue: amount
    },
    billTo: {
      line1: $("D_CUSTOMER_NAME"),
      line2: $("D_CUSTOMER_ADDRESS_LINE1"),
      line3: $("D_CUSTOMER_ADDRESS_LINE2")
    },
    item: {
      description: $("D_ITEM_DESCRIPTION"),
      qty: qty,
      rate: rate
    },
    notes: {
      ticket:   String(FETCHED.FAN_NO || ""),  // ✅ SQL FAN_NO shown as Ticket No
      truck:   $("D_TRUCK_NO"),
      trailer: $("T_TRAILER_NUMBER"),
      seal:    $("D_SEAL_NO"),
      driver:  $("T_DRIVER_NAME")
    }
  };
}

// =====================================================
// Function: Generate invoice, save, then download PDF
// =====================================================
function generateInvoice() {
  const model = collectInvoiceModel();

  if (!model.card) return alert("Enter Card No");
  if (!model.invoiceNo) return alert("Enter Invoice No");

  // Calculate amount safely
  const amount = model.rate * model.netWeight || 0;
  model.amount = amount;

  fetch("/InvoiceGeneration/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      card: model.card,
      invoiceNo: model.invoiceNo,
      rate: model.rate,
      amount: amount
    })
  })
  .then(r => r.json().then(j => ({ ok: r.ok, body: j })))
  .then(res => {
    if (!res.ok || res.body.error) throw new Error(res.body.error);
    alert("Invoice saved successfully!");
    buildInvoicePDF(model);  // PDF download here
  })
  .catch(err => alert("Error saving invoice: " + err.message));
}

// =====================================================
// Function: Build PDF exactly like SOMGAS format
// =====================================================
function buildInvoicePDF(data = {}) {
  const jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPDFLib) { alert("jsPDF library not loaded"); return; }
  const doc = new jsPDFLib({ unit: "pt", format: "a4" });

  // ---- Shortcuts ----
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 28;                      // page margin
  const gridY = 12;                  // vertical rhythm
  const lineClr = [40, 40, 40];      // dark bar (table header etc.)
  const gray = [105, 105, 105];
  const stroke = [170, 170, 170];
  const lightStroke = [210, 210, 210];

  // ========== Helper Functions ==========
  function $id(x) { return document.getElementById(x); }
  function field(id, fallback = "") {
    const el = $id(id);
    return (data[id] != null ? data[id] : (el && (el.value || el.textContent) || fallback)).toString().trim();
  }
  function val(v, fb="") { return (v == null || v === "") ? fb : v; }
  function money(n) {
    if (n == null || n === "") return "0.00";
    const num = Number(n);
    if (!isFinite(num)) return "0.00";
    return num.toFixed(2);
  }

  // ✅ FIXED: Convert all text to string before drawing
  function label(x, y, t, size=9, bold=false, align="left") {
    doc.setFont("DM Sans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(String(t ?? ""), x, y, { align });
  }
  function box(x, y, w, h) {
    doc.setDrawColor(...stroke);
    doc.rect(x, y, w, h);
  }
  function inputBox(x, y, w, h, text, size=10, pad=8, bold=false) {
    box(x, y, w, h);
    doc.setFont("DM Sans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(String(text ?? ""), x + pad, y + h/2 + (size/2 - 2));
  }
  function headerBar(y, textLeft) {
    doc.setFillColor(...lineClr);
    doc.rect(0, y, W, 20, "F");
    doc.setTextColor(255,255,255);
    label(M, y + 14, textLeft, 10, true);
    doc.setTextColor(0,0,0);
  }
  function dashedLine(x1, y1, x2, y2) {
    doc.setDrawColor(...lightStroke);
    doc.setLineDash([2, 2], 0);
    doc.line(x1, y1, x2, y2);
    doc.setLineDash(); // reset
  }

  // ========= Gather data =========
  const nowStr = new Date().toLocaleString();

  const company = {
    name:  val(data.company?.name, "Somgas Company"),
    addr1: val(data.company?.addr1, "Opposite Berbera Main Road, Near Port,"),
    addr2: val(data.company?.addr2, "HQ: Hargeisa, Somaliland"),
    email: val(data.company?.email, "somgaslpterminal@gmail.com"),
  };

  const invoice = {
    number: val(data.invoice?.number, field("D_FISCAL_NO", "000000000000000001")),
    date:   val(data.invoice?.date, field("DERIVED_DUE") || new Date().toISOString().slice(0,10)),
    terms:  val(data.invoice?.terms, "Due On Receipt"),
    dueDate: val(data.invoice?.dueDate, field("DERIVED_DUE") || "12/31/2002"),
    currencyLabel: val(data.invoice?.currencyLabel, "USD"),
    balanceDue: money(val(data.invoice?.balanceDue, "")),
  };

  const billTo = {
    line1: val(data.billTo?.line1, field("D_CUSTOMER_NAME", "Bill To Name")),
    line2: val(data.billTo?.line2, field("D_CUSTOMER_ADDRESS_LINE1", "")),
    line3: val(data.billTo?.line3, field("D_CUSTOMER_ADDRESS_LINE2", "")),
  };

  const item = {
    description: val(data.item?.description, field("D_ITEM_DESCRIPTION", "")),
    qty: val(data.item?.qty, field("D_NET_WEIGHT", "")),
    rate: val(data.item?.rate, field("D_RATE", "")),
  };

  const notes = {
    ticket: val(data.notes?.ticket, ""),
    truck:  val(data.notes?.truck, field("D_TRUCK_NO", "")),
    trailer: val(data.notes?.trailer, field("T_TRAILER_NUMBER", "")),
    seal: val(data.notes?.seal, field("D_SEAL_NO", "")),
    driver: val(data.notes?.driver, field("T_DRIVER_NAME", "")),
  };

  // Derive amount
  const amountNum = (isFinite(parseFloat(item.qty)) && isFinite(parseFloat(item.rate)))
    ? +(parseFloat(item.qty) * parseFloat(item.rate)).toFixed(2) : 0;
  const amountStr = money(amountNum);
  if (!invoice.balanceDue) invoice.balanceDue = amountStr;

  // ========= HEADER =========
 // ========= HEADER (logo, title, inv no) =========
// Tweakable positions:
const HEADER_TOP = 10;        // push smaller for higher logo
const LOGO_W = 135, LOGO_H = 40;
const LOGO_X = M, LOGO_Y = HEADER_TOP;  // move up by reducing HEADER_TOP

const TITLE_Y = HEADER_TOP + 22;        // "Invoice" title
const INVNO_Y = HEADER_TOP + 18;        // right-side invoice number
const SEP_Y   = HEADER_TOP + 42;        // thin line under header
const STRIP_Y = SEP_Y + 6;              // "Detail page 1" strip baseline

const logoEl = document.getElementById("somgasLogo");
if (logoEl && logoEl.complete) {
  try { doc.addImage(logoEl, "PNG", LOGO_X, LOGO_Y, LOGO_W, LOGO_H); } catch (e) {}
}
label(W/2, TITLE_Y, "Invoice", 16, false, "center");
label(W - M - 5, INVNO_Y, "# INV - " + invoice.number, 10, true, "right");

// thin top separator
doc.setDrawColor(...gray);
doc.line(0, SEP_Y, W, SEP_Y);

// "Detail page 1" gray strip (thin)
doc.setFillColor(235,235,235);
doc.rect(0, STRIP_Y, W, 18, "F");
label(M, STRIP_Y + 13, "Detail page 1", 9, true);

// push body start a bit lower than the strip
let ye = STRIP_Y + 36;

  // ========= COMPANY + BALANCE =========
  let y = 90;
  label(M, y, company.name, 11, true);
  y += gridY;
  label(M, y, company.addr1, 10);
  y += gridY;
  label(M, y, company.addr2, 10);
  y += gridY;
  label(M, y, company.email, 10);

  // Balance Due (top-right)
const balBoxW = 200, balBoxH = 25;
const balX = W - M - balBoxW;

// ↓ how much to move everything down (try 6–10)
const BAL_SHIFT = 4;

// anchor
const balY = 110 + BAL_SHIFT;

// title (right aligned)
label(W - M - 5, 85 + BAL_SHIFT, "Balance Due", 10, false, "right");

// currency tag (e.g., USD)
label(balX, balY - 4, invoice.currencyLabel, 9, true);

// amount box
inputBox(balX + 50, balY - 18, balBoxW - 40, balBoxH, invoice.balanceDue, 11);

  // ========= BILL TO + right-side Invoice Date/Terms/Due =========
y += 22;

// Left column: Bill To
label(M, y, "Bill To:", 10, true);
y += gridY;
label(M, y, billTo.line1, 10);
y += gridY;
label(M, y, billTo.line2, 10);
y += gridY;
label(M, y, billTo.line3, 10);

// Right column (use unique variable names to avoid collisions)
const billRightStartY = y - gridY * 3;     // top aligned with first Bill To line
const billRightLabelX = W - M - 240;       // label X
const billFieldW = 160;
const billFieldH = 18;
const billFieldOffset = 90;                // gap from label to box

// Invoice Date
label(billRightLabelX, billRightStartY, "Invoice Date :", 9, true);
inputBox(billRightLabelX + billFieldOffset, billRightStartY - 12,
         billFieldW, billFieldH, invoice.date, 10);

// Terms
const billTermsY = billRightStartY + gridY + 6;
label(billRightLabelX, billTermsY, "Terms :", 9, true);
inputBox(billRightLabelX + billFieldOffset, billTermsY - 12,
         billFieldW, billFieldH, invoice.terms, 10);

// Due Date
const billDueY = billTermsY + gridY + 6;
label(billRightLabelX, billDueY, "Due Date :", 9, true);
inputBox(billRightLabelX + billFieldOffset, billDueY - 12,
         billFieldW, billFieldH, invoice.dueDate, 10);


  

  // ========= ITEM TABLE =========
  const tableTop = y + 50;
  headerBar(tableTop, "");

  const col1X = M, col1W = W - 2*M - 270;
  const col2X = col1X + col1W, col2W = 90;
  const col3X = col2X + col2W, col3W = 90;
  const col4X = col3X + col3W, col4W = 90;
  const thY  = tableTop + 14;

  doc.setTextColor(255,255,255);
  label(col1X + 6, thY, "Item & Description", 10, true);
  label(col2X + 6, thY, "Qty", 10, true);
  label(col3X + 6, thY, "Rate", 10, true);
  label(col4X + 6, thY, "Amount", 10, true);
  doc.setTextColor(0,0,0);

  const rowY = tableTop + 20;
  const rowH = 38;
  box(col1X, rowY, col1W, rowH);
  box(col2X, rowY, col2W, rowH);
  box(col3X, rowY, col3W, rowH);
  box(col4X, rowY, col4W, rowH);

  const descLines = doc.splitTextToSize(String(item.description || ""), col1W - 8);
  doc.text(descLines, col1X + 6, rowY + 14);

  label(col2X + 8, rowY + 18, String(item.qty));
  label(col2X + 8, rowY + 34, "kg", 9, false);
  label(col3X + 8, rowY + 18, String(item.rate));
  label(col3X + 8, rowY + 34, invoice.currencyLabel, 9, false);
  label(col4X + 8, rowY + 18, amountStr);
  label(col4X + 8, rowY + 34, invoice.currencyLabel, 9, false);

  const sepY = rowY + rowH + 20;
  dashedLine(M, sepY, W - M, sepY);

  // ========= NOTES =========
  const notesTop = sepY + 40;
  label(M, notesTop, "Notes:", 10, true);

  const leftColX = M + 12, labelW = 90, fieldW = 300, rowGap = 22;
  let nY = notesTop + 16;
  function noteRow(lbl, value) {
    label(leftColX, nY, lbl, 9, true);
    inputBox(leftColX + labelW, nY - 12, fieldW, 18, value || "", 10);
    nY += rowGap;
  }
  noteRow("Ticket No.:", notes.ticket);
  noteRow("Truck No.:", notes.truck);
  noteRow("Trailer No.:", notes.trailer);
  noteRow("Seal No.:", notes.seal);
  noteRow("Driver Name", notes.driver);

// ========= Footer + signatures =========
const BOTTOM_MARGIN = 28;              // 28 is tighter; increase to move higher up
const SIG_BOX_H = 24;
const SIG_GAP_X = 20;

const footBaseline = H - BOTTOM_MARGIN;
const sigTopY = footBaseline - SIG_BOX_H - 10;

doc.setDrawColor(...lightStroke);
doc.line(0, sigTopY - 12, W, sigTopY - 12);

const sigW = (W - 2*M - SIG_GAP_X) / 2;
inputBox(M, sigTopY, sigW, SIG_BOX_H, "", 10);
inputBox(M + sigW + SIG_GAP_X, sigTopY, sigW, SIG_BOX_H, "", 10);

label(M + 4, footBaseline, "Driver Signature", 9, true);
label(M + sigW + SIG_GAP_X + 4, footBaseline, "Operator Signature", 9, true);

label(M, H - 10, "Generated on " + nowStr, 8);

  // Save PDF
  const filename = "Invoice_" + (invoice.number || Date.now()) + ".pdf";
  doc.save(filename);
}

document.addEventListener("DOMContentLoaded", function() {
  // Base path
  const BASE_PATH = "/InvoiceGeneration";

  // Helper to get element by id
  function $(id) { return document.getElementById(id); }

  // When Enter key is pressed in Card No field
  const cardInput = $("D_CARD_NO");
  cardInput.addEventListener("keydown", function(e) {
    if (e.key !== "Enter") return;  // only on Enter key
    e.preventDefault();

    const card = cardInput.value.trim();
    if (!card) {
      alert("Please enter a Card No.");
      return;
    }

    // Show loading cursor
    document.body.style.cursor = "progress";

    // Fetch data from backend
    fetch(BASE_PATH + "/fetch?card=" + encodeURIComponent(card))
      .then(response => response.json())
      .then(data => {
        document.body.style.cursor = "auto";

        if (data.error) {
          alert("Error: " + data.error);
          return;
        }

        if (data.popup) {
          alert(data.popup);
          return;
        }

        // ✅ Fill fetched data in textboxes
        for (const key in data) {
          const el = $(key);
          if (el) el.value = data[key];
        }
FETCHED = data;  // ✅ Save all fetched SQL data for PDF

        // ✅ Redirect if wrong process type
        if (String(data.D_PROCESS_TYPE) === "0") {
          window.location.href = "/WeighingBill?card=" + encodeURIComponent(card);
          return;
        }

        alert("Data fetched successfully!");
      })
      .catch(err => {
        document.body.style.cursor = "auto";
        alert("Failed to fetch: " + err.message);
        console.error(err);
      });
  });

  // ===== Invoice Button =====
  const btn = $("invoiceBtn");
  btn.addEventListener("click", function() {
    const rate = parseFloat($("D_RATE").value);
    const net = parseFloat($("D_NET_WEIGHT").value);
    const invoiceNo = $("D_FISCAL_NO").value.trim();
    const card = $("D_CARD_NO").value.trim();

    if (!card) { alert("Enter Card No first."); return; }
    if (!invoiceNo) { alert("Enter Invoice No first."); return; }
    if (!isFinite(rate) || !isFinite(net) || rate <= 0 || net <= 0) {
      alert("Enter valid numbers for Rate and Net Weight.");
      return;
    }

    const amount = (rate * net).toFixed(2);
    $("DERIVED_AMOUNT").value = "₹" + amount;

    fetch(BASE_PATH + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card, invoiceNo, rate, amount })
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) {
          alert("Save failed: " + res.error);
          return;
        }
          
  // ✅ Build and download PDF in SOMGAS format
  const model = collectInvoiceModel();
  buildInvoicePDF(model);

  alert("Invoice saved and PDF downloaded.");
       

      })
      .catch(err => {
        alert("Error saving invoice: " + err.message);
      });
  });
});
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
        d.PROCESS_TYPE,
        d.FAN_NO,

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
      D_PROCESS_TYPE: r.PROCESS_TYPE ?? null,   // <<< ADD THIS

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
      FAN_NO: r.FAN_NO || "",

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
