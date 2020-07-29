const express = require('express');
const canvas = require('canvas');
const fs = require('fs');
const constants = require('../constants');

const router = express.Router();
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

    if (rgb[i] == NaN || rgb[i] == null || rgb[i] < 0 || rgb[i] > 255) {
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

function genColorImage(hex, x, y) { // generates an solid image color from a hex color & two vars
  let image = canvas.createCanvas(x, y);
  let ctx = image.getContext('2d');

  ctx.fillStyle = hex; // set the fill "style" (basically how it's going to be filled)
  ctx.fillRect(0, 0, x, y); // actually fill the full image up

  let buffer = image.toBuffer('image/png');
  fs.writeFileSync(`./img/${hex}_${x}x${y}.png`, buffer); // actually save / write it

  return `${hex}_${x}x${y}.png`;
}

router.get('/random', (req, res) => {
  //rgb colors
  let rgb = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
  let hex = rgbToHex(rgb); // color in hex (str)

  res.json({success: true, rgb: rgb, hex: hex});
});

router.get('/bulkrandom', (req, res) => {
  amount = parseInt(req.query.amount);

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  if (amount < 1 || amount > 500) {
    res.status(400).json({success: false,
      message: 'The amount field must be an integer between 1 and 500.'})
  }

  colors = [];
  for (i = 0; i < amount; i++) {
    let rgb = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
    colors.push({rgb: rgb, hex: rgbToHex(rgb)});
  }

  res.json({success: true, colors: colors});
});

router.get('/color', (req, res) => {
  type = req.query.type;
  color = req.query.color.toString().toLowerCase().replace(/ /gi, '');

  if (type != 'rgb' && type != 'hex') {
    res.status(400).json({success: false,
      message: 'The type field must exist and must be of \'rgb\' or \'hex\''});
    return;
  }

  if (type == 'rgb') {
    rgb = color.split(',');

    if (!isValidRgb(rgb)) {
      res.status(400).json({success: false, message: 'Malformed rgb color was received.'});
      return;
    }

    res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }

  if (type == 'hex') {
    hex = color.replace('#', '');

    if (!isValidHex(hex)) {
      res.status(400).json({success: false, message: 'Malformed hex color was received.'});
      return;
    }

    rgb = hexToRgb(hex);
    res.json({success: true, rgb: rgb, hex: hex, hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }
});

router.get('/image', (req, res) => {
  let color = req.query.color.toString().toLowerCase().replace(/ /gi, '');
  let x = parseInt(req.query.x); // width
  let y = parseInt(req.query.y); // height ig

  if (x == NaN || y == NaN || x > 1024 || x < 1 || y > 1024 || y < 1) {
    res.status(400).json({success: false,
      message: 'Fields x and y must be valid integers in the range from 1 to 1024.'});
    return;
  }

  if (!isValidHex(color)) {
    if (isValidRgb(color)) { // convert color to hex if it's valid rgb
      color = hexToRgb(color);
    } else {
      res.status(400).json({success: false, message: 'The color field must be a valid hex or rgb color.'});
      return;
    }
  }

  let image = canvas.createCanvas(x, y);
  let ctx = image.getContext('2d');

  ctx.fillStyle = `#${color}`; // set the fill "style" (basically how it's going to be filled)
  ctx.fillRect(0, 0, x, y); // actually fill the full image up

  // let buffer = image.toBuffer('image/png');
  // fs.writeFileSync(`./tmp/img/${color}_${x}x${y}.png`, buffer); // actually save / write it
  // res.sendFile(`${constants.baseDir}/tmp/img/${color}_${x}x${y}.png`);
  res.send(`<img src="${.image.toDataURL()}"/>`);
});

module.exports = router;
