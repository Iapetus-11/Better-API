const express = require('express');
const svgCaptcha = require('svg-captcha');
const uuid = require('uuid');

const router = express.Router();

router.get('/captcha', (req, res) => { // captcha generator, takes a size param
  let size = parseInt(req.query.size);

  if (size == null || size == NaN){
    size = 4;
  }

  if (size > 10 || size < 1) {
    res.status(400).json({success: false, message: 'The size field must be an integer between 1 and 10.'});
    return;
  }

  captcha = svgCaptcha.create(size=size); // returns json {"text": "text", "data": "svgshit"}
  captcha.success = true;

  res.json(captcha);
});

router.get('/bulkcaptcha', (req, res) => {
  let size = parseInt(req.query.size);
  let amount = parseInt(req.query.amount);

  if (size == null || size == NaN) {
    size = 4;
  }

  if (amount == null || amount == NaN) {
    amount = 50;
  }

  captchas = [];
  for (i = 0; i < amount; i++) {
    captchas.put(svgCaptcha.create(size=size));
  }

  res.json({success: true, captchas: captchas});
})

router.get('/uuid', (req, res) => { // generates a uuid4
  res.json({success: true, uuid: uuid.v4()});
});

module.exports = router;
