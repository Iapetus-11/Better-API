const express = require('express');
const uuid = require('uuid');
const fs = require('fs');
const captcha = require('../captchagen');

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

  // captcha = svgCaptcha.create({size: size, noise: 3, color: true}); // returns json {"text": "text", "data": "svgshit"}
  // captcha.success = true;

  let captchaGenned = new captcha();
  // captcha.PNGStream.pipe(fs.createWriteStream(`./tmp/img/${captcha.value}.png`));
  // let buffer = captcha._canvas.toDataURL();
  // let b64Data = fs.readFileSync(captcha.PNGStream, {encoding: 'BASE64'});

  res.json({success: true, text: captchaGenned.value, data: captchaGenned._canvas.toDataURL()});

  // fs.unlinkSync(`./tmp/img/${captcha.value}.png`);
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
