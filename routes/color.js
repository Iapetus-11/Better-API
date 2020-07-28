const express = require('express');

const router = express.Router();

function cToHex(c) { // single component of rbg to hex
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) { // turns rbg colors into hex colors
  return "#" + cToHex(rgb[0]) + cToHex(rgb[1]) + cToHex(rgb[2]);
}

function hexToRgb(hex) { // hex back into rgb
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return rgb ? {
    r: parseInt(rgb[1], 16),
    g: parseInt(rgb[2], 16),
    b: parseInt(rgb[3], 16)
  } : null;
}

function rgbToCmyk(rgb) { // turns rgb colors into cmyk colors
  let r2 = rgb[0] / 255;
  let g2 = rgb[1] / 255;
  let b2 = rgb[2] / 255;
  let k = 1 - Math.max(r2, g2, b2);
  return [(1 - r2 - k) / (1 - k), (1 - g2 - k) / (1 - k), (1 - b2 - k) / (1 - k), k];
}

function rgbToHsv(rgb) { // turns rgb into hsv
  let v = Math.max(rgb[0], rgb[1], rgb[2])
  let n = v - Math.min(rgb[0], rgb[1], rgb[2]);
  let h = n && ((v==r) ? (g-b)/n : ((v==g) ? 2 + (b - r) / n : 4+(r - g) / n));
  return [60 * (h < 0 ? h + 6 : h), v && n / v, v];
}

function hsvToRgb(hsv) {
    let h = hsv[0];
    let s = hsv[1];
    let v = hsv[2];
    let r, g, b, i, f, p, q, t;

    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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

router.get('/color' (req, res) => {
  type = req.query.type;
  color = req.query.color.toString().toLowerCase().replace(/ /gi, '');

  if (type != 'rgb' && type != 'hex' && type != 'hsv') {
    res.status(400).json({success: false, message: 'The type field must exist and must be of \'rgb\', \'hex\', or \'hsv\'\n\nExamples:\nGET /color/color?color=r,g,b&type=rgb\nGET /color/color?color=#FFFFFF&type=hex\nGET /color/color?color=h,s,v&type=hsv'});
    return;
  }

  if (type == 'rgb') {
    rgb = color.split(',');

    if (rgb.length != 3) {
      res.status(400).json({success: false, message: 'Malformed rgb color was received.\n\nExample: GET /color/color?color=r,g,b&type=rgb'});
      return;
    }

    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(rgb[i]);

      if (rgb[i] == Nan || rgb[i] == null || rgb[i] < 1 || rgb[i] > 255) {
        res.status(400).json({success: false, message: 'Malformed rgb color was received.\n\nExample: GET /color/color?color=r,g,b&type=rgb'});
        return;
      }
    }

    res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }

  if (type == 'hex') {
    hex = color.replace('#', '');

    if (hex.length != 6) {
      res.status(400).json({success: false, message: 'Malformed hex color was received.\n\nExample: GET /color/color?color=#FFFFFF&type=hex'});
      return;
    }

    hexValid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    for (i = 0; i < 6; i++) {
      if (hexValid.findIndex(hex.charAt(i)) == -1) {
        res.status(400).json({success: false, message: 'Malformed hex color was received.\n\nExample: GET /color/color?color=#FFFFFF&type=hex'});
        return;
      }
    }

    rgb = hexToRgb(hex);
    res.json({success: true, rgb: rgb, hex: hex, hsv: rgbToHsv(rgb), cmyk: rgbToCmyk(rgb)});
    return;
  }

  if (type == 'hsv') {
    hsv = color.split(',');

    if (hsv[0] > 360 || hsv[0] < 0 || hsv[1] > 100 || hsv[1] < 1 || hsv[2] > 100 || hsv[2] < 100) {
      res.status(400).json({success: false, message: 'Malformed hsv color was received.\n\nExample: GET /color/color?color=69,42,0&type=hsv'});
      return;
    }

    for (int i = 0; i < hsv.length; i++) {
      hsv[i] = parseInt(hsv[i]);

      if (hsv[i] == NaN) {
        res.status(400).json({success: false, message: 'Malformed hsv color was received.\n\nExample: GET /color/color?color=69,42,0&type=hsv'});
        return;
      }
    }

    rgb = hsvToRgb(hsv);
    res.json({success: true, rgb: rgb, hex: rgbToHex(rgb), hsv: hsv, cmyk: rgbToCmyk(rgb)});
    return;
  }

});

module.exports = router;
