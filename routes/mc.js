const express = require('express');
const axios = require('axios')

const router = express.Router();

router.get('/mcping', (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = req.query.port;

  if (host == null){
    res.status(406).json({success: false, message: 'host is a required field. (example: GET /mc/mcping?host=mc.hypixel.net&port=25565)'});
    return;
  }

  if (port == null){
    port = -1;
  }

  axios.get('http://0.0.0.0:6942/mcping', {headers: {'host': host, 'port': port}})
  .then(data => {
    json_status = data.data
    res.json(json_status);
  })
  .catch(e => {
    console.log(e)
  });
});

module.exports = router;
