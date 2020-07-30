const express = require('express');
const uuid = require('uuid');
const fs = require('fs');
const captcha = require('../util/captchagen');

const router = express.Router();

router.get('/captcha', (req, res) => { // captcha generator, takes a size param
  let size = parseInt(req.query.size);
  let imgOnly = req.query.imgonly;

  if (size == null || size == NaN){
    size = 4;
  }

  if (size > 5 || size < 1) {
    res.status(400).json({success: false, message: 'The size field must be an integer between 1 and 5.'});
    return;
  }

  let captchaGenned = new captcha(200, 100, size);

  if (imgOnly == 'true') {
    res.send(`<img src="${captchaGenned.canvas.toDataURL('image/png', .25)}"/>`);
    return;
  }

  res.json({success: true, text: captchaGenned.value, data: captchaGenned.canvas.toDataURL('image/png', .25)});
});

router.get('/uuid', (req, res) => { // generates a uuid4
  res.json({success: true, uuid: uuid.v4()});
});

router.get('/bulkuuid', (req, res) => {
  let amount = parseInt(req.query.amount);

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  if (amount > 500 || amount < 1) {
    res.status(400).json({success: false, message: 'The amount field must be an integer between 1 and 200.'});
    return;
  }

  uuids = [];
  for (i = 0; i < amount; i++) {
    uuids.push(uuid.v4());
  }

  res.json({success: true, uuids: uuids});
});

router.get('/password', (req, res) => {
  res.json({success: true, password: Math.random().toString(36).substr(2, 8)});
});

router.get('/bulkpassword', (req, res) => {
  let amount = parseInt(req.query.amount);

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  if (amount > 500 || amount < 1) {
    res.status(400).json({success: false, message: 'The amount field must be an integer between 1 and 200'});
    return;
  }

  let passwords = [];
  for (i = 0; i < amount; i++) {
    passwords.push(Math.random().toString(36).substr(2, 8));
  }

  res.json({success: true, passwords: passwords});
});

module.exports = router;
