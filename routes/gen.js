const Express = require('express');
const Uuid = require('uuid');
const Captcha = require('../util/captchagen');

const router = Express.Router();

router.get('/captcha', (req, res) => { // Captcha generator, takes a size param
  let size = parseInt(req.query.size);
  let imgOnly = req.query.imgonly;

  if (size == null || size == NaN){
    size = 4;
  }

  if (size > 5 || size < 1) {
    res.status(400).json({success: false, message: 'The size field must be an integer between 1 and 5.'});
    return;
  }

  let CaptchaGenned = new Captcha(200, 100, size);

  if (imgOnly == 'true') {
    res.send(`<img src="${CaptchaGenned.canvas.toDataURL('image/png', .25)}"/>`);
    return;
  }

  res.json({success: true, text: CaptchaGenned.value, data: CaptchaGenned.canvas.toDataURL('image/png', .25)});
});

router.get('/uuid', (req, res) => { // generates a Uuid4
  res.json({success: true, Uuid: Uuid.v4()});
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

  Uuids = [];
  for (i = 0; i < amount; i++) {
    Uuids.push(Uuid.v4());
  }

  res.json({success: true, Uuids: Uuids});
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
