const express = require('express');
const sql = require('mssql/msnodesqlv8');
const dbConfig = require('../Config/dbConfig');
const router = require('express').Router();




router.get('/', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`SELECT * FROM DATA_MASTER`);

    // ✅ Replace manual tableRows with dynamic generation
    const columns = result.recordset.columns 
    ? Object.keys(result.recordset.columns) 
    : Object.keys(result.recordset[0] || {});
const tableHeader = columns.map(col => `<th>${col}</th>`).join('');

let tableRows = '';
result.recordset.forEach(row => {
  tableRows += '<tr>';
  columns.forEach(col => {
    tableRows += `<td>${row[col] ?? ''}</td>`;
  });
  tableRows += '</tr>';
});

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
      <nav>
    <ul>
    <li><a href="/">HOME</a></li>
      <li><a >CARD MASTER</a></li>
      <li><a href="/truck-master">TRUCK MASTER</a></li>
      <li><a class="active" href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a>ENTRY BRIDGE</a></li>
    </ul>
  </nav>
        <title>Fan Generation</title>

        <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/Css/Page.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
      </head>
      <body>
        <h2>Fan Generation Data</h2>
        <table>
          <thead>
            <tr>${tableHeader}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error loading table:', err);
    res.status(500).send('Error loading table: ' + err.message);
  }
});



module.exports = router;
