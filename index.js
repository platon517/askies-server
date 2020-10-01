const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;
const combinedRoutes = require('./routes/combinedRoutes');
require('dotenv').config();

app.use(cors());

app.get('/', (req, res) => res.send('Welcome to Express'));

app.listen(port, function() {
    console.log("Running on Port "+ port);
});

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const dbPath = 'mongodb+srv://platon517:5902168brut@vendetta-1-r7a2c.mongodb.net/main?retryWrites=true&w=majority';
const options = {useNewUrlParser: true, useUnifiedTopology: true};
const mongo = mongoose.connect(dbPath, options);

mongo.then(() => {
    console.log('connected');
}, error => {
    console.log(error, 'error');
});

app.use(express.static(__dirname));
combinedRoutes(app);
