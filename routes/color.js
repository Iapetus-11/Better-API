const Express = require('express');
const Canvas = require('canvas');
const Fs = require('fs');
const Constants = require('../constants');

const router = Express.Router();
const validHex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function cToHex(c) { // single component of rbg to hex
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) { // turns rgb colors into hex colors
  return "#" + cToHex(rgb[0]) + cToHex(rgb[1]) + cToHex(rgb[2]);
}

function hexToRgb(hex) { // hex to rgb
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r, g, b];
}

function rgbToCmyk(rgb) { // turns rgb colors into cmyk colors
  let r2 = rgb[0] / 255;
  let g2 = rgb[1] / 255;
  let b2 = rgb[2] / 255;
  let k = 1 - Math.max(r2, g2, b2);
  return [(1 - r2 - k) / (1 - k), (1 - g2 - k) / (1 - k), (1 - b2 - k) / (1 - k), k];
}

function rgbToHsv(rgb) { // turns rgb into hsv
  let r = rgb[0];
  let g = rgb[1];
  let b = rgb[2];

  let max = Math.max(r, g, b), min = Math.min(r, g, b),
      d = max - min,
      h,
      s = (max === 0 ? 0 : d / max),
      v = max / 255;

  switch (max) {
      case min: h = 0; break;
      case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
      case g: h = (b - r) + d * 2; h /= 6 * d; break;
      case b: h = (r - g) + d * 4; h /= 6 * d; break;
  }

  return [h, s, v];
}

function isValidRgb(rgb) { // takes [r, g, b]
  if (rgb.length != 3) {
    return false;
  }

  for (i = 0; i < 3; i++) {
    rgb[i] = parseInt(rgb[i]);

    if (isNaN(rgb[i]) || rgb[i] == null || rgb[i] < 0 || rgb[i] > 255) {
      return false;
    }
  }

  return true;
}

function isValidHex(hex) { // takes #hex or hex (string obviously)
  if (!(hex.length == 7 && hex.charAt(0) == '#') && hex.length != 6) {
    return false;
  }

  for (i = 0; i < 6; i++) {
    if (validHex.indexOf(hex.charAt(i)) == -1 && hex.charAt(i) != '#') {
      return false;
    }
  }

  return true;
}

router.get('/random', (req, res) => {
  //rgb colors
  let rgb = [Math.floor(Math.random() * 256) - 1, Math.floor(Math.random() * 256) - 1, Math.floor(Math.random() * 256) - 1];

  res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), cmyk: rgbToCmyk(rgb), hsv: rgbToHsv(rgb)});
});

router.get('/color', (req, res) => {
  let color = req.query.color;

  if (color == null) {
    res.status(400).json({success: false, message: 'The color field is required.'});
  }

  color = color.toString().toLowerCase().replace(/ /gi, '');

  let rgb = color.split(',')

  if (!isValidRgb(rgb)) {
    if (!isValidHex(color)) {
      res.status(400).json({success: false, message: 'The color field must be a valid hex or rgb color.'});
      return;
    } else {
      rgb = hexToRgb(color);
    }
  }

  res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), cmyk: rgbToCmyk(rgb), hsv: rgbToHsv(rgb)});
});

router.get('/image', (req, res) => {
  let color = req.query.color;
  let x = parseInt(req.query.x); // width
  let y = parseInt(req.query.y); // height

  if (x == null || y == null || color == null) {
    res.status(400).json({success: false, message: 'Fields color, x, and y are required.'});
    return;
  }

  color = color.toString().toLowerCase().replace(/ /gi, '');

  if (isNaN(x) || isNaN(y) || x > 1024 || x < 1 || y > 1024 || y < 1) {
    res.status(400).json({success: false,
      message: 'Fields x and y must be valid integers in the range from 1 to 1024.'});
    return;
  }

  if (!isValidHex(color)) {
    if (isValidRgb(color.split(','))) { // convert color to hex if it's valid rgb
      color = rgbToHex(color.split(','));
    } else {
      res.status(400).json({success: false, message: 'The color field must be a valid hex or rgb color.'});
      return;
    }
  }

  let image = Canvas.createCanvas(x, y);
  let ctx = image.getContext('2d');

  ctx.fillStyle = `#${color}`; // set the fill "style" (basically how it's going to be filled)
  ctx.fillRect(0, 0, x, y); // actually fill the full image up

  res.json({success: true, data: image.toDataURL()});
  // res.set('Content-Type', 'image/png');
  // let buffer = image.toBuffer('image/png');
  // Fs.writeFileSync(`./tmp/img/${color}_${x}x${y}.png`, buffer); // actually save / write it
  // res.sendFile(`${Constants.baseDir}/tmp/img/${color}_${x}x${y}.png`);
  // res.send(Buffer.from(image.toBuffer('image/png')));
});

module.exports = router;
