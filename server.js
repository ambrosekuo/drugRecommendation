const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const {ReactDOMServer} = require('react-dom/server');
const schedule = require('node-schedule');


const databaseUsername = "ambrosek";
const databasePassword = "f8skYQUDSE4pfcRn"; //have to set it up for development later.
const googleAPIKey = "AIzaSyCi--e04YNiA2icQYTZCtoIkIPzMliQbHY";

var xlsx = require('node-xlsx');

const app = express();
const port = process.env.PORT || 5000;

const connectionString = `mongodb+srv://${databaseUsername}>:${databasePassword}>@cluster0-4rlno.azure.mongodb.net/test?retryWrites=true`

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var obj = xlsx.parse(__dirname + '/masterData.xlsx');

function updateDrugImageDatabase() {
 };
const runSchedule = schedule.scheduleJob('0 0 0,12 * *', function(){
  console.log('This will run twice per day, midnight, and midday');
  updateDrugImageDatabase();
});




app.get('/api/getData', (req,res) => {
  res.send(obj[0].data);
});

  // Server any static iles
  app.use(express.static(path.join(__dirname, 'build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, 'build',
    'index.html'));
  });


app.listen(port, () => console.log(`Listening on port ${port}`));


