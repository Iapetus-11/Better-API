const express = require('express')
const svgCaptcha = require('svg-captcha')
const uuid = require('uuid')

const app = express();
const port = 80

app.get('/gen/captcha', (req, res) => { // captcha generator, takes a length param
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

app.get('/gen/uuid', (req, res) => { // generates a uuid4

})

// actually run the server
app.listen(port, () => {
    console.log(`theapi running on port ${port}`);
});
