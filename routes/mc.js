const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const mcPingRatelimiter = rateLimit({windowMs: 1250, max: 1}); // 1 every 1.25 seconds

router.get('/mcping', mcPingRatelimiter, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field. (example: GET /mc/mcping?host=mc.hypixel.net&port=25565)'});
    return;
  }

  if (port == null || port == NaN) {
    port = 0;
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}})
  .then(data => {
    json_status = data.data
    json_status.success = true;
    res.json(json_status);
  })
  .catch(e => {
    console.log(e)
  });
});

module.exports = router;
