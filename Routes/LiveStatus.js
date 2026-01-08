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
  CONVERT(VARCHAR(19), [FAN TIMEOUT], 120) AS FAN_TIME_OUT,

  CASE 
    WHEN TYPE = 'LOADING' THEN 'UP'
    WHEN TYPE = 'UNLOADING' THEN 'DOWN'
    ELSE 'NONE'
  END AS TYPE_ICON

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
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">

</head>
<body>

<table border="1" width="100%" style="border-collapse:collapse;">
<tr>
  <th>SR NO</th>
  <th>TRUCK NO</th>
  <th>CARD NO</th>
  <th>STATUS</th>
  <th>TYPE</th>
  <th>BAY</th>
  <th>FAN TIMEOUT</th>
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
          <td>
            <span class="status-badge status-yellow">
              ${r.STATUS || "-"}
            </span>
          </td>
          <td class="type-cell">
            ${
              r.TYPE_ICON === "UP"
                ? `<span class="type-wrapper">
                    <span class="type-text">LOADING</span>
                    <span class="material-symbols-outlined loading-icon">arrow_upward</span>
                  </span>`
                : r.TYPE_ICON === "DOWN"
                ? `<span class="type-wrapper">
                    <span class="type-text">UNLOADING</span>
                    <span class="material-symbols-outlined unloading-icon">arrow_downward</span>
                  </span>`
                : "-"
            }
          </td>
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
