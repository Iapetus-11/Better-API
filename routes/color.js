const express = require('express');

const router = express.Router();

function cToHex(c) { // single component of rbg to hex
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) { // turns rbg colors into hex colors
  return "#" + cToHex(r) + cToHex(g) + cToHex(b);
}

function rgbToCmyk(r, g, b) { // turns rgb colors into cmyk colors
  let r2 = r / 255;
  let g2 = g / 255;
  let b2 = b / 255;
  let cmyk = [];
  cmyk.push(1 - Math.max(r2, g2, b2));
}

router.get('/random', (req, res) => {
  //rgb colors
  let r = Math.random() * 255;
  let g = Math.random() * 255;
  let b = Math.random() * 255;

  let hex = rgbToHex(r, g, b); // color in hex (str)

  let cmyk = rgbToCmyk(r, g, b); // color in cmyk [c, m, y, k]

});
