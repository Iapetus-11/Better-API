const Axios = require('axios');
const Canvas = require('canvas');
const Express = require('express');
const RateLimit = require('express-rate-limit');
const Constants = require('../constants');

const router = Express.Router();

Canvas.registerFont('assets/Minecraftia.ttf', {family: 'Minecraft'});

async function pingMCServer(host, port) {
  let data = await Axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}});
  return data.data;
}

async function drawFavicon(ctx, faviData) {
  if (faviData != null) {
    Canvas.loadImage(faviData)
    .then(favi => { //    x  y
      ctx.drawImage(favi, 6, 6, 128, 128);
      return true;
    });
  } else {
    return true;
  }
}

async function renderServerImage(host, port) {
  let image = Canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.quality = 'nearest'; // nearest cause dealing with pixels cause Minecraft ya

  let bgImage = await Canvas.loadImage('assets/mcserver_background.png');
  ctx.drawImage(bgImage, 0, 0, 768, 140);

  let statusData = await pingMCServer(host, port);

  drawFavicon(ctx, statusData.favicon)
  .then(() => {})

  let motd = statusData.description;
  let motdFinal = '';

  try { // motd has a chance to be a weird dict / array or regular text
    for (i = 0; i < motd.extra.length; i++) {
      motdFinal = motdFinal.concat(motd.extra[i].text);
    }
    motdFinal = motdFinal.concat(motd.text);
  } catch (err) {
    motdFinal = motd;
  }

  while (motdFinal == void(0)) {} // for some reason this needs to be here

  // Server motd / desc
  ctx.font = '22px "Minecraft"'; // monotype font, 15px wide, 3px between letters @ 22 px font || .measureText()
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom'; // set bottom of text to bottom of image
  ctx.fillStyle = "#222"
  ctx.fillText(motdFinal, 140/*padding of image 6+end of image*/+6/*extra padding*/, 140/*height of image*/-22/*font px size*/-24/*extra padding*/);

  ctx.font = '22px "Minecraft"';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = "#EEE"
  ctx.fillText(host, 146, 42);

  return image;
}

router.get('/mcping', RateLimit({windowMs: 1500, max: 1}) /*every 1.5 sec*/, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (port == null || port == NaN) {
    port = 0; // used to tell mcping_server.py that there was no port specified.
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  for (i = 0; i < Constants.ipsToIgnore.length; i++) {
    if (host.indexOf(Constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  pingMCServer(host, port)
  .then(statusData => {
    statusData.success = true;
    res.json(statusData);
  })
  .catch(e => {
    console.log(e)
  });
});

router.get('/mcpingimg', RateLimit({windowMs: 2500, max: 1}) /*every 2.5 sec*/, (req, res) => { // checks the status of an mc server and generates a pretty image
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

  for (i = 0; i < Constants.ipsToIgnore.length; i++) {
    if (host.indexOf(Constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  renderServerImage(host, port)
  .then(image => {
    res.json({success: true, data: image.toDataURL()});
  })
  .catch(e => {
    console.log(e);
  });
});

module.exports = router;
