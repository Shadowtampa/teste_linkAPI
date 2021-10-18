const express = require('express');

const app = express();

require('./controllers/DealController')(app)
app.use(express.json())
app.listen(3333)