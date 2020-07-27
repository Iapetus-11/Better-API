const express = require('express');
const axios = require('axios')

const getJSON = bent('json')
const router = express.Router();

router.get('/server', (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = req.query.port;

  if (host == null){
    res.status(406).json({success: false, message: 'host is a required field. (example: GET /mc/server?host=mc.hypixel.net&port=25565)'});
    return;
  }

  json_status = axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}});

  return req.json(json_status);
});

module.exports = router;
