const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const {ReactDOMServer} = require('react-dom/server');


var xlsx = require('node-xlsx');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var obj = xlsx.parse(__dirname + '/masterData.xlsx'); // parses a file

//var obj = xlsx.parse(fs.readFileSync(__dirname + '/myFile.xlsx')); // parses a buffer

app.get('/api/getData', (req,res) => {
  res.send(obj[0].data);
});

if (process.env.NODE_ENV === 'production') {
  // Server any static iles
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, 'client/build',
    'index.html'));
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));


