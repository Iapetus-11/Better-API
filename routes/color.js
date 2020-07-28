const express = require('express');

const router = express.Router();

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
    res.status(400).json({success: false, message: 'The amount field must be an integer between 1 and 500.'})
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
    res.status(400).json({success: false, message: 'The type field must exist and must be of \'rgb\' or \'hex\''});
    return;
  }

  if (type == 'rgb') {
    rgb = color.split(',');

    if (rgb.length != 3) {
      res.status(400).json({success: false, message: 'Malformed rgb color was received.'});
      return;
    }

    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(rgb[i]);

      if (rgb[i] == NaN || rgb[i] == null || rgb[i] < 0 || rgb[i] > 255) {
        res.status(400).json({success: false, message: 'Malformed rgb color was received.'});
        return;
      }
    }

    res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }

  if (type == 'hex') {
    hex = color.replace('#', '');

    if (hex.length != 6) {
      res.status(400).json({success: false, message: 'Malformed hex color was received.'});
      return;
    }

    hexValid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    for (i = 0; i < 6; i++) {
      if (hexValid.indexOf(hex.charAt(i)) == -1) {
        res.status(400).json({success: false, message: 'Malformed hex color was received.'});
        return;
      }
    }

    rgb = hexToRgb(hex);
    res.json({success: true, rgb: rgb, hex: hex, hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }
});

module.exports = router;