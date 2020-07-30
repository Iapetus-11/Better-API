const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const constants = require('../constants');
const canvas = require('canvas');

const router = express.Router();

async function pingMCServer(host, port) {
  let data = await axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}});
  return data.data;
}

router.get('/mcping', rateLimit({windowMs: 1500, max: 1}) /*every 1.5 sec*/, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (port == null || port == NaN) {
    port = 0;
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  for (i = 0; i < constants.ipsToIgnore.length; i++) {
    if (host.indexOf(constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  pingMCServer(host, port).then(statusData => {
    statusData.success = true;
    res.json(statusData);
  });
});

router.get('/mcpingimg', rateLimit({windowMs: 2500, max: 1}) /*every 2.5 sec*/, (req, res) => { // checks the status of an mc server and generates a pretty image
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (port == null || port == NaN) {
    port = 0;
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  for (i = 0; i < constants.ipsToIgnore.length; i++) {
    if (host.indexOf(constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  let image = canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  canvas.loadImage('assets/mcserver_background.png')
  .then(background => { // load and then draw the image
    ctx.drawImage(background, 0, 0, 768, 140);

    pingMCServer(host, port).then(statusData => {
      if (statusData.favicon != null) { // if favicon is there
        canvas.loadImage(statusData.favicon)
        .then(favi => { //    x  y
          ctx.drawImage(favi, 6, 6, 126, 126);
          res.json({success: true, data: image.toDataURL()});
          return;
        })
      }
    });

    res.json({success: true, data: image.toDataURL()});
  })
  .catch(e => {
    console.log(e);
  });
});

module.exports = router;
