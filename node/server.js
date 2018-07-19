//Variable to allow connection to database
var mysql = require('mysql');

//Variables for socket io connections and express routing
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server); 

//Sign in to create connection with MySQL database
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1259",
  database: "mydb"
});

//Try connection
connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySQL!");
});

//Export variables for connected JS files

//exports.express = express;
//exports.app = app;
exports.server = server;
exports.io = io;
exports.mysql = mysql;
exports.connection = connection;

//Import segmented JS files
var user_creation = require('./user_creation.js');
var admin_control = require('./admin_control.js');
var game_initialization = require('./game_initialization.js');

//start our web server and socket.io server listening
server.listen(3000, function(){
  console.log('listening on *:3000');
}); 

//app.use(express.static(__dirname + '/test')); 

var path = require("path");

//redirect / to our index.html file
app.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/buyer.html', function(req, res, next) { 
  res.sendFile(path.join(__dirname, '..', 'buyer.html'));
  user_creation.user_create();
});

app.get('/seller.html', function(req, res, next) {
  res.sendFile(path.join(__dirname, '..', 'seller.html'));
  user_creation.user_create();
});

app.get('/admin_control.html', function(req, res, next) {
  res.sendFile(path.join(__dirname, '..', 'admin_control.html'));
  admin_control.admin_control();
});

app.get('/game_initialization.html', function(req, res, next) {
  res.sendFile(path.join(__dirname, '..', 'game_initialization.html'));
  game_initialization.game_initialization();
});


//connection.end(); ?????????????????????????????
