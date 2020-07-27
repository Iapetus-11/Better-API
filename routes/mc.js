const express = require('express');
const bent = require('bent')

const getJSON = bent('json')
const router = express.Router();

router.get('/server', (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = req.query.port;

  if (host == null){
    res.status(406).json({success: false, message: 'host is a required field. (example: GET /mc/server?host=mc.hypixel.net&port=25565)'});
    return;
  }

  if (port == null){
    port = 25565;
  }

  res.json(await getJSON(`http://localhost:6942/mcping?host=${host}&port=${port}`)); // passes to local python aiohttp server running
});

module.exports = router;
