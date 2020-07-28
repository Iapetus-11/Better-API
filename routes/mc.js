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

  json_status = axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}});

  req.json(json_status);
});

module.exports = router;
