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

async function drawMOTD(ctx, motd) {
  // determine whether motd is json or regular text
  try {
    let isJj = motd.extra.length;
    isJj = true;
  } catch(err) {
    let isJj = false;
  }

  ctx.font = '22px "Minecraft"';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';

  if (isJj) {
    let drawnPixels = 0;
    let lastColor = 'white';
    let currentColor = 'white';
    let currentText = '';
    for (i = 0; i < motd.extra.length; i++) {
      if (motd.extra[i].color == void(0)) { // figure out color
        currentColor = lastColor;
      } else {
        currentColor = motd.extra[i].color;
      }

      currentText = motd.extra[i].text; // set current text to draw to image

      ctx.fillStyle = 
    }
  } else {
    return;
  }
}

async function drawMOTDPlain(ctx, motd, host) {
  let motdFinal = '';

  try { // motd has a chance to be a weird json obj / array or regular text
    for (i = 0; i < motd.extra.length; i++) {
      motdFinal = motdFinal.concat(motd.extra[i].text);
    }
    motdFinal = motdFinal.concat(motd.text);
  } catch (err) { // handle regular string of text
    motdFinal = '';
    for (i = 1; i < motd.length; i++) {
      if (motd.charAt(i) != '§' && motd.charAt(i-1) != '§') { // filter out section signs and color codes
        motdFinal = motdFinal.concat(motd.charAt(i));
      }
    }
  }

  motdFinal = motdFinal.replace(/\n+$/, ""); // remove trailing newlines

  // Server motd / desc
  ctx.font = '22px "Minecraft"'; // monotype font, 15px wide, 3px between letters @ 22 px font || .measureText()
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom'; // set bottom of text to bottom of image
  ctx.fillStyle = '#DEDEDE';
  ctx.fillText(motdFinal, 140/*padding of image 6+end of image*/+6/*extra padding*/, 140/*height of image*/-22/*font px size*/-24/*extra padding*/);

  // host name stuff
  ctx.font = '22px "Minecraft"';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#EEE';
  ctx.fillText(host, 146, 42);

  return true;
}

async function renderServerImage(host, port) {
  let image = Canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  ctx.save(); // saves default ctx we can restore to later

  ctx.imageSmoothingEnabled = false;
  ctx.quality = 'nearest'; // nearest cause dealing with pixels cause Minecraft ya

  let bgImage = await Canvas.loadImage('assets/mcserver_background.png');
  ctx.drawImage(bgImage, 0, 0, 768, 140);

  let statusData = await pingMCServer(host, port); // "blocking" ping the mc server

  if (statusData.description == void(0) || statusData.favicon == void(0)) {
    return await renderServerImage(host, port); // to handle weird shit
  }

  drawFavicon(ctx, statusData.favicon) // draw favicon to image
  .then(() => {});

  drawMOTDPlain(ctx, statusData.description, host) // draw a plain white motd
  .then(() => {});

  return image;
}

router.get('/mcping', RateLimit({windowMs: 1500, max: 1}) /*every 1.5 sec*/, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (port == null || isNaN(port)) {
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

  if (port == null || isNaN(port)) {
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
