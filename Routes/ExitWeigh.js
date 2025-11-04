const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const params = req.query;
  console.log(params);
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Exit Weigh Bridge</title>
  <link rel="stylesheet" href="/Css/ExitWeigh.css">
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
      <li><a href="/Fan-Generation">FAN GENERATION</a></li>
      <li><a href="/EntryWeight">ENTRY BRIDGE</a></li>
      <li><a class="active" href="/ExitWeigh">EXIT BRIDGE</a></li>
    </ul>
  </nav>
  <h2>
  <img src="/Icons/login-.png"">
  EXIT WEIGH BRIDGE
</h2>

<div class="form-container">
  <!-- LEFT SIDE -->
  <div class="form-left">
    <div class="form-group">
      <label for="CARD_NO">Card Number :</label>
      <input id="card_no" name="CARD_NO" type="text" placeholder="Enter Card Number">
    </div>

    <div class="form-group">
      <label for="TRUCK_REG_NO">Truck Number :</label>
      <input id="truck_reg" name="TRUCK_REG_NO" type="text" readonly>
    </div>

    <div class="form-group">
      <label for="MAX_WEIGHT_ENTRY">Max Weight Entry :</label>
      <input id="max_weight_entry" name="MAX_WEIGHT_ENTRY" type="text">
    </div>

    <div class="form-group">
      <label for="SEAL_NO">SEAL NO :</label>
      <input id="seal_no" name="SEAL_NO" type="text">
    </div>
  </div>

  <!-- RIGHT SIDE -->
  <div class="form-right">
    <div class="form-group">
      <label for="PROCESS_TYPE">Process Type :</label>
      <input id="process_type" name="PROCESS_TYPE" type="text" readonly>
    </div>

    <div class="form-note">
      <p>
        (*)
        For Loading – Measured Weight will be <strong>Tare Weight</strong><br>
        For Unloading – Measured Weight will be <strong>Gross Weight</strong>
      </p>
    </div>
  </div>
   <!-- ✅ ACCEPT BUTTON inside the form-container -->
  <div class="button-container">
    <button id="acceptBtn">ACCEPT</button>
  </div>
</div>
  
<script>
 

</script>

</body>
</html>`;
  res.send(html);
});




module.exports = router;
