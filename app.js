const Helmet = require('helmet');
const Express = require('express');
const Constants = require('./constants');

const app = Express();
app.use(Helmet())
const port = 80;

app.use('/gen', require('./routes/gen')); // generation endponts
app.use('/mc', require('./routes/mc')); // mc utils endpoints
app.use('/color', require('./routes/color')); // color endpoints

// actually run the server
app.listen(port, () => {
    console.log(`theapi running on port ${port}`);
});
