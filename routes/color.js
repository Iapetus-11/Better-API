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
})

module.exports = router;
