//=================================================================================================================================
//Contains all dependency requirements and setup for MySQL DB Querying, http hosting, express sessions, and passport logins.
//Also contains all express routing. Socket IO (express.io) is used for the majority of front-end to back-end communication
//using sockets, however socket listening and emittion is almost entirely contained in seperate JS files that are called within
//the routes.
//==================================================================================================================================


//======================
//DEPENDENCIES==========
//======================

//Variable for connection to the MySQL database
var mysql = require('mysql');

//Variables for socket io (express.io) connections and express routing
var express = require('express.io');
var session = require('express-session');
var app = express();

//HTTP connection with express.io
app.http().io();

//
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require("path");

require('../config/passport')(passport); // pass passport for configuration

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'SuperUberSecretCode',
    resave: true,
    saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



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

exports.app = app;
exports.mysql = mysql;
exports.connection = connection;


app.listen(3000, function(){
    console.log('listening on *:3000');
});


//========================
//ROUTING=================
//========================

//Import segmented JS files
var admin_control = require('./admin_control.js');
var game_initialization = require('./game_initialization.js');
var seller_selection = require('./seller_selection.js');
var buyer_selection = require('./buyer_selection.js');
var load_history = require('./load_history.js');

//redirect / to our index.ejs file
app.get('/', function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/index.ejs'));
});

app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render(path.join(__dirname, '..', 'views/login.ejs'), { message: req.flash('loginMessage') });
});

// process the login form
app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/redirect', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }),
    function(req, res) {
        if (req.body.remember) {
          req.session.cookie.maxAge = 1000 * 60 * 3;
        } else {
          req.session.cookie.expires = false;
        }
    res.redirect('/');
});

app.get('/signup', function(req, res) {
    res.render(path.join(__dirname, '..', 'views/signup.ejs'), { message: req.flash('signupMessage') });
});

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/redirect', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/redirect', isLoggedIn, function(req, res, next) {

    connection.query("SELECT stage_id FROM game WHERE game_id = 1", function(err, result){
        if (err) {
            console.error(err);
            return;
        }
        stage = result[0]["stage_id"];
        if(req.user.role_id == 1){
            if(req.user.buy_pos == stage)
                res.redirect('buyer_selection');
            else
                res.redirect('buyer_wait');
        }
        else if(req.user.role_id == 2){
            if(stage == 0)
                res.redirect('seller_selection');
            else
                res.redirect('seller_wait');
        }
        else if(req.user.role_id == 3){
            var gameExistence;
            connection.query("SELECT COUNT(*) FROM game;", function(err, result){
                if (err) {
                    console.error(err);
                    return;
                }
                if(result[0] == 0)
                    gameExistence = false;
                else
                    gameExistence = true;
                if(gameExistence)
                    res.redirect('admin_control');
                else
                    res.redirect('game_initialization');
            });
        }
    });
});

app.get('/admin_control', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/admin_control.ejs'));
    admin_control.admin_control();
});

app.get('/game_initialization', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/game_initialization.ejs'));
    game_initialization.game_initialization();
});

app.get('/seller_selection', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/seller_selection.ejs'));
    seller_selection.seller_select(req);
});

app.get('/buyer_selection', isLoggedIn, isBuyer, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/buyer_selection.ejs'));
    buyer_selection.buyer_select(req);
});

app.get('/buyer_wait', isLoggedIn, isBuyer, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/buyer_wait.ejs'));
    load_history.load_history();
});

app.get('/seller_wait', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/seller_wait.ejs'));
    load_history.load_history();
});


function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function isBuyer(req, res, next) {

    if (req.user.role_id == 1){
        return next();
    }
    res.redirect('/redirect');
}

function isSeller(req, res, next) {
    if (req.user.role_id == 2){
        return next();
    }
    res.redirect('/redirect');
}

function isAdmin(req, res, next) {

    if (req.user.role_id == 3){
        return next();
    }
    res.redirect('/redirect');
}

//connection.end(); ?????????????????????????????
