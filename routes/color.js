const express = require('express');

const router = express.Router();

function cToHex(c) { // single component of rbg to hex
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) { // turns rbg colors into hex colors
  return "#" + cToHex(rgb[0]) + cToHex(rgb[1]) + cToHex(rgb[2]);
}

function rgbToCmyk(rgb) { // turns rgb colors into cmyk colors
  let r2 = rgb[0] / 255;
  let g2 = rgb[1] / 255;
  let b2 = rgb[2] / 255;
  let k = 1 - Math.max(r2, g2, b2);
  return [(1 - r2 - k) / (1 - k), (1 - g2 - k) / (1 - k), (1 - b2 - k) / (1 - k), k];
}

router.get('/random', (req, res) => {
  //rgb colors
  let rgb = [Math.random() * 255, Math.random() * 255, Math.random() * 255];

  let hex = rgbToHex(rgb); // color in hex (str)

  let cmyk = rgbToCmyk(rgb); // color in cmyk [c, m, y, k]

});
