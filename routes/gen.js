const express = require('express');
const svgCaptcha = require('svg-captcha');
const uuid = require('uuid');

const router = express.Router();

router.get('/captcha', (req, res) => { // captcha generator, takes a size param
  let size = parseInt(req.query.size);
  let doColor = req.query.size.toString().toLowerCase();
  let noise = parseInt(req.query.noise);

  if (size == null || size == NaN){
    size = 4;
  }

  if (doColor == 'false') {
    doColor = false;
  } else {
    doColor = true;
  }

  if (noise == null || noise == NaN) {
    noise = 2;
  }

  if (size > 10 || size < 1) {
    res.status(400).json({success: false, message: 'The size field must be an integer between 1 and 10.'});
    return;
  }

  captcha = svgCaptcha.create(size=size, color=doColor, noise=noise); // returns json {"text": "text", "data": "svgshit"}
  captcha.success = true;

  res.json(captcha);
});

router.get('/bulkcaptcha', (req, res) => { // bulk genereates up to 100 captchas at a time, takes size and amount params
  let size = parseInt(req.query.size);
  let amount = parseInt(req.query.amount);
  let doColor = req.query.size.toString().toLowerCase();
  let noise = parseInt(req.query.noise);

  if (size == null || size == NaN) {
    size = 4;
  }

  if (size > 10 || size < 1) {
    res.status(400).json({success: false, message: 'The size field must be an integer between 1 and 10.'});
    return;
  }

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  if (amount > 75 || amount < 1) {
    res.status(400).json({success: false, message: 'The amount field must be an integer between 1 and 75.'});
    return;
  }

  if (doColor == 'false') {
    doColor = false;
  } else {
    doColor = true;
  }

  if (noise == null || noise == NaN) {
    noise = 2;
  }

  captchas = [];
  for (i = 0; i < amount; i++) {
    captchas.push(svgCaptcha.create(size=size, color=doColor, noise=noise));
  }

  res.json({success: true, captchas: captchas});
})

router.get('/uuid', (req, res) => { // generates a uuid4
  res.json({success: true, uuid: uuid.v4()});
});

router.get('/bulkuuid', (req, res) => {
  let amount = parseInt(req.query.size);

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  if (amount > 200 || amount < 1) {
    res.status(400).json({success: false, message: 'The amount field must be an integer between 1 and 200.'});
    return;
  }

  uuids = [];
  for (i = 0; i < amount; i++) {
    uuids.push(uuid.v4());
  }

  res.json({success: true, uuids: uuids});
})

module.exports = router;
