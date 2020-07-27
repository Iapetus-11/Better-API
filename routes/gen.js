const express = require('express');
const svgCaptcha = require('svg-captcha');
const uuid = require('uuid');

const router = express.Router();

router.get('/captcha', (req, res) => { // captcha generator, takes a length param
  let length = 4;

  if (req.query.length != null) {
    length = parseInt(req.query.length);
  }

  if (length > 10 || length < 1) {
    res.status(406).json({success: false, message: 'The length field should be an integer between 1 and 10.'})
    return;
  }

  captcha = svgCaptcha.create(size=length); // returns json {"text": "text", "data": "svgshit"}
  captcha.success = true;

  res.json(captcha);
});

router.get('/gen/uuid', (req, res) => { // generates a uuid4
  res.json({success: true, uuid: uuid.v4()});
});

module.exports = router;
