const express = require('express')

const app = express();
const port = 80;

app.use('/gen', require('./routes/gen'));

// actually run the server
app.listen(port, () => {
    console.log(`theapi running on port ${port}`);
});
