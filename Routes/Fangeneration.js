const express = require('express');
const sql = require('mssql/msnodesqlv8');
const config = require('../Config/dbConfig'); // your original path
const router = express.Router();

router.get('/', (req, res) => {
  const params = req.query;
  console.log(params);
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Fan Generation</title>
  <link rel="stylesheet" href="/Css/Home.css">
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
      <li><a href="/Fan-Generation" class="active">FAN GENERATION</a></li>
      <li><a href="/contact">ENTRY BRIDGE</a></li>
    </ul>
  </nav>
  <h2 style="font-family: 'DM Sans', sans-serif;">FAN GENERATION DATA</h2>
</body>
</html>`;
    res.send(html);
});

module.exports = router;
