const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const params = req.query;
  console.log(params);
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Home</title>
  <link rel="stylesheet" href="/Css/Home.css">
  <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
  <nav style="font-family: 'DM Sans', sans-serif;">
    <ul>
      <li><a href="/"  class="active">HOME</a></li>
      <li><a href="/tees">CARD MASTER</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
  <h2 style="font-family: 'DM Sans', sans-serif;">SHIV ENGINEERING</h2>

  
<script>
 
  //smooth transition page
  // When clicking any link, fade out the page before leaving
  document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
      if (link.hostname === window.location.hostname) {
        link.addEventListener("click", e => {
          e.preventDefault();
          document.body.classList.add("fade-out");
          setTimeout(() => {
            window.location = link.href;
          }, 500); // match CSS transition duration
        });
      }
    });
  });
</script>

</body>
</html>`;
  res.send(html);
});

module.exports = router;
