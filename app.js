const express = require('express');
const constants = require('./constants');

const app = express();
const port = 80;

app.use('/gen', require('./routes/gen')); // generation endponts
app.use('/mc', require('./routes/mc')); // mc utils endpoints
app.use('/color', require('./routes/color')); // color endpoints

app.use('/img', express.static('img')); // server static dir /img

// actually run the server
app.listen(port, () => {
    console.log(`theapi running on port ${port}`);
});
