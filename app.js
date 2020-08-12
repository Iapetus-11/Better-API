const Helmet = require('helmet');
const Express = require('express');
const Constants = require('./constants');

const app = Express();
app.use(Helmet())

app.use('/gen', require('./routes/gen')); // generation endponts
app.use('/mc', require('./routes/mc')); // mc utils endpoints
app.use('/color', require('./routes/color')); // color endpoints

app.use(express.static('assets'));

// actually run the server
app.listen(Constants.appPort, () => {
    console.log(`theapi running on port ${Constants.appPort}`);
});
