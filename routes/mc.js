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

  // name/host of the server to display next to the favicon
  let serverName = host;
  if (port != 0) { // port will be 0 because of above if statements
    serverName = serverName.concat(`:${port}`);
  }

  let image = Canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  Canvas.loadImage('assets/mcserver_background.png') // dirt background
  .then(background => {
    ctx.drawImage(background, 0, 0, 768, 140); // then draw the bg image to the image

    pingMCServer(host, port).then(statusData => { // draw the favicon if it exists
      if (statusData.favicon != null) { // if favicon is there
        Canvas.loadImage(statusData.favicon)
        .then(favi => { //    x  y
          ctx.drawImage(favi, 6, 6, 128, 128);

          let serverDesc = statusData.description;
          let serverPlayerCount = statusData.player_count;

          console.log(serverDesc); // debug

          let serverDescFinal = '';

          try { // serverDesc has a chance to be a weird dict / array or regular text
            for (i = 0; i < serverDesc.extra.length; i++) {
              serverDescFinal = serverDescFinal.concat(serverDesc.extra[i].text);
            }
            serverDescFinal = serverDescFinal.concat(serverDesc.text);
          } catch (err) {
            serverDescFinal = serverDesc;
          }

          // Server motd / desc
          ctx.font = '22px "Minecraft"'; // monotype font, 15px wide, 3px between letters @ 22 px font
          ctx.textAlign = 'start';
          ctx.textBaseline = 'bottom'; // set bottom of text to bottom of image
          ctx.fillText(serverDescFinal, 134/*padding of image 6+width of image*/+6/*extra padding*/, 140/*height of image*/-22/*font px size*/-24/*extra padding*/);

          ctx.font = '22px "Minecraft"';
          ctx.textAlign = 'start';
          ctx.textBaseline = 'bottom';
          ctx.fillText(serverName, 142, 28);

          res.json({success: true, data: image.toDataURL()});
        })
      }
    });
  })
  .catch(e => {
    console.log(e);
  });
});

module.exports = router;
