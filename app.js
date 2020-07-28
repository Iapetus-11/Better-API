const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 80;

app.use('/gen', require('./routes/gen'));

app.use('/mc', require('./routes/mc'));
const mcPingApiRateLimiter = rateLimit({windowMs: 1000, max: 1}) // 1 per second
app.use('/mc/mcping', mcPingApiRateLimiter)

// actually run the server
app.listen(port, () => {
    console.log(`theapi running on port ${port}`);
});
