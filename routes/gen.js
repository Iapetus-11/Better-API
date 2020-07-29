const express = require('express');
const captcha = require('@haileybot/captcha-generator');
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

  captcha = svgCaptcha.create({size: size, noise: 3, color: true}); // returns json {"text": "text", "data": "svgshit"}
  captcha.success = true;

  res.json(captcha);
});

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
