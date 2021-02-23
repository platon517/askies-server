const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;
const combinedRoutes = require('./routes/combinedRoutes');
require('dotenv').config();

app.use(cors({credentials: true, origin: true}));

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

//const dbPath = 'mongodb://127.0.0.1:27017/prod';
const dbPath =
  'mongodb+srv://platon517:Gf7eu76XRlkDwiCX@cluster0.xpmq8.mongodb.net/main?retryWrites=true&w=majority';
const options = {useNewUrlParser: true, useUnifiedTopology: true};
const mongo = mongoose.connect(dbPath, options);

mongo.then(() => {
    console.log('connected');
}, error => {
    console.log(error, 'error');
});

app.use(express.static(__dirname));
combinedRoutes(app);
