const express = require("express");
const sql = require("mssql/msnodesqlv8");
const config = require("../Config/dbConfig");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
  SELECT 
    [TRUCK REG NO] AS TRUCK_REG_NO,
    [CARD NO] AS CARD_NO,
    STATUS,
    TYPE,
    BAY,
    CONVERT(VARCHAR(19), [FAN TIMEOUT], 120) AS FAN_TIME_OUT
  FROM COMMON_VIEW_3
  WHERE BATCH_STATUS = 1;
`);

    const rows = result.recordset;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Live Status</title>
  <link rel="stylesheet" href="/Css/LiveStatus.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
</head>
<body>

<table border="1" width="100%" style="border-collapse:collapse;">
<tr>
  <th>SrNo</th>
  <th>Truck Reg NO</th>
  <th>Card No</th>
  <th>Status</th>
  <th>Type</th>
  <th>Bay</th>
  <th>Fan TimeOut</th>
</tr>
`;

    if (rows.length === 0) {
      html += `<tr><td colspan="7" align="center">No Data Found</td></tr>`;
    } else {
      rows.forEach((r, i) => {
        html += `
        <tr>
          <td>${i + 1}</td>
          <td>${r.TRUCK_REG_NO || "-"}</td>
          <td>${r.CARD_NO || "-"}</td>
          <td>${r.STATUS || "-"}</td>
          <td>${r.TYPE || "-"}</td>
          <td>${r.BAY || "-"}</td>
          <td>${r.FAN_TIME_OUT || "-"}</td>
        </tr>
        `;
      });
    }

    html += `
</table>

<script>
  setTimeout(() => location.reload(), 10000);
  
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
</script>

</body>
</html>
`;

    res.send(html);

  } catch (err) {
    console.error("LIVE STATUS ERROR:", err);
    res.send(`<pre style="color:red;">${err.message}</pre>`);
  } finally {
    sql.close();
  }
});

module.exports = router;
