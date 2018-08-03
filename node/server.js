//=================================================================================================================================
//Contains all dependency requirements and setup for MySQL DB Querying, HTTP hosting, express sessions, and passport logins.       
//Also contains all express routing. Socket IO (express.io) is used for the majority of front-end to backend communication         
//using sockets, however socket listening and emittion is almost entirely contained in separate JS files that are called within    
//the routes.                                                                                                                      
//=================================================================================================================================


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

//Passport is a Node JS library that allows for easy authentication
var passport = require('passport');

//Connect flash allows you to send messages through a session
var flash = require('connect-flash');

//Required for session authentication
var cookieParser = require('cookie-parser');

//Required for HTML POST requests, which
var bodyParser = require('body-parser');

//Used for path.join() to locate files
var path = require("path");

require('../config/passport')(passport); // pass passport for configuration

//Setting and using dependencies
//  Set up ejs for templating. Used to parse flash messages on login/signup pretty much (for the <% %> syntax)
app.set('view engine', 'ejs'); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//The secret is used to calculate the hashing of the session cookie so it can't be as easily hacked
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

//Open local port
app.listen(3000, function(){
    console.log('listening on *:3000');
});


//========================
//ROUTING=================
//========================

//Import segmented JS files
//These files contain most of the dynamic functionality of each page
//and are called within the routes
var admin_control = require('./admin_control.js');
var game_initialization = require('./game_initialization.js');
var seller_selection = require('./seller_selection.js');
var buyer_selection = require('./buyer_selection.js');
var load_history = require('./load_history.js');
var load_leaderboard = require('./load_leaderboard.js');
var wait = require('./wait.js');
var auditor_bid = require('./auditor_bid.js');

//redirect / to our index.ejs file
app.get('/', function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/index.ejs'));
});

//Redirect to the login page
app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render(path.join(__dirname, '..', 'views/login.ejs'), { message: req.flash('loginMessage') });
});

//Process the login form. Uses the local-login function from passport, which was altered
//in Config/passport.js. Check there to see what the function is actually doing
app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/redirect',
        failureRedirect : '/login',
        failureFlash : true // allow flash messages
    }),
    function(req, res) {
        if (req.body.remember) {
          req.session.cookie.maxAge = 1000 * 60 * 3;    //Session lasts 3 hours
        } else {
          req.session.cookie.expires = false;
        }
    res.redirect('/');
});

//Redirect to the signup page
app.get('/signup', function(req, res) {
    res.render(path.join(__dirname, '..', 'views/signup.ejs'), { message: req.flash('signupMessage') });
});

//Similar to the login form, this page is using the HTTP POST request to submit a form which
//is then processed by passport in a predefined way set in Config/passport.js
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/redirect', 
    failureRedirect : '/signup',
    failureFlash : true // allow flash messages
}));

//Bulk of redirect logic. This route loads no front-end page, and used solely to redirect users
//based on role and stage within the game. The database is queried to check the stage of the
//game (stage_id).
//TODO: Add auditor functionality/routing
app.get('/redirect', isLoggedIn, function(req, res, next) {
    connection.query('SELECT COUNT(*) FROM game', function(err, result){
        if (err) {
            console.error(err);
            return;
        }
        if(result[0]["COUNT(*)"] == 0 && req.user.role_id == 3)
            res.redirect('game_initialization');
        else{
            connection.query('SELECT stage_id FROM game WHERE game_id = 1', function(err, result){
                if (err) {
                    console.error(err);
                    return;
                }
                var stage = result[0]["stage_id"];
                connection.query('SELECT customer_id FROM auditor WHERE game_id = 1', function(err, result){
                    if (err) {
                        console.error(err);
                        return;
                    }
                    //Stage 0 = Seller Selection | Stage 1-4 = Buyer 1-4 Selection | Stage 5 = Audit Bid
                    //Role_id: 1 = Buyer, 2 = Seller, 3 = Admin
                    var auditCustomer = result[0]["customer_id"];
                    var role = req.user.role_id;
                    if(role == 1){  //If user role is buyer
                        if(req.user.buy_pos == stage)   //Check if it is this buyers turn
                            res.redirect('buyer_selection');
                        else if((auditCustomer == role) && (stage == 5))
                            res.redirect('auditor_bid');
                        else if(stage == 6)
                            res.redirect('results');
                        else
                            res.redirect('buyer_wait');
                    }
                    else if(role == 2){ //If user role is seller
                        if(stage == 0)  //Check if it is the seller selection stage 
                            connection.query('SELECT offers.seller_id FROM offers INNER JOIN `seller list` ON offers.seller_id = `seller list`.seller_id WHERE `seller list`.user_id = ?', req.user.user_id, function(err, result) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                                if(result.length == 0)
                                    res.redirect('seller_selection');
                                else
                                    res.redirect('seller_wait');
                            });
                        else if((auditCustomer == role) && (stage == 5))
                            res.redirect('auditor_bid');
                        else if(stage == 6)
                            res.redirect('results');
                        else
                            res.redirect('seller_wait');
                    }
                    else if(role == 3){ //If user role is admin
                        connection.query("SELECT COUNT(*) FROM game;", function(err, result){   //TEMP: Check if game list is empty
                            if (err) {
                                console.error(err);
                                return;
                            }
                            game_count = result[0]["COUNT(*)"];
                            if(!(game_count == 0))
                                res.redirect('admin_control');
                            else
                                res.redirect('game_initialization');
                        });
                    }
                });
            });
        }
    });
});

//Routing to different role specific pages. The first two middleware function check for an 
//authenticated session and whether or not the user is the role. The last middleware function
//redirects the user and runs the javascript file that encapsulates most of the page functionality.

app.get('/admin_control', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/admin_control.ejs'));
    admin_control.admin_control();
});

app.get('/game_initialization', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/game_initialization.ejs'));
    game_initialization.game_initialization(req);
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
    wait.wait(req);
});

app.get('/seller_wait', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/seller_wait.ejs'));
    load_history.load_history();
    wait.wait(req);
});

app.get('/results', isLoggedIn, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/results.ejs'));
    load_history.load_history();
    load_leaderboard.load_leaderboard();
});

app.get('/auditor_bid', isLoggedIn, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/auditor_bid.ejs'));
    auditor_bid.auditor_bid(req);
});

//Middleware function that checks if user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}

//Middleware functions that checks if users are a specific type
function isBuyer(req, res, next) {
    // if user is a buyer, carry on
    if (req.user.role_id == 1)
        return next();
    // if they aren't, do the appropriate redirect
    res.redirect('/redirect');
}

function isSeller(req, res, next) {
    if (req.user.role_id == 2)
        return next();
    res.redirect('/redirect');
}

function isAdmin(req, res, next) {

    if (req.user.role_id == 3)
        return next();
    res.redirect('/redirect');
}

//connection.end(); ???????????????????????? 
//Do this if Sleep Queries become a problem (i.e. timeout isn't fast enough and connection pool fills up)