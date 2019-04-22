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
//var server = require('http').createServer(app);

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
app.use(express.session({
    secret: 'SuperUberSecretCode',
    resave: true,
    saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



//Sign in to create connection with MySQL database
/*var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1259",
    database: "mydb"
});/*

/*var connection = mysql.createConnection({
    host: 'localhost',
    user: 'marketgame_admin',
    password: 'lz0n1y32psvf',
    database: 'marketgame_mydb'
});*/

var connection = mysql.createConnection({
    host: '206.189.205.150',
    user: 'marketgameAdmin',
    password: 'JVwwkjp6SpsxGlZX',
    database: 'mydb'
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

//express.io.listen(server);
//server.listen(80, function (){},function(){});

app.use(express.static(path.join(__dirname, '..', 'images')));

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
var load_transactions = require('./load_transactions');
var wait = require('./wait.js');
var auditor_bid = require('./auditor_bid.js');
var game_room = require('./game_room.js');
var profits = require('./profits.js')

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
//in config/passport.js. Check there to see what the function is actually doing
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
//is then processed by passport in a predefined way set in config/passport.js
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/redirect', 
    failureRedirect : '/signup',
    failureFlash : true // allow flash messages
}));

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//Bulk of redirect logic. This route loads no front-end page, and used solely to redirect users
//based on role and stage within the game. The database is queried to check the stage of the
//game (stage_id).
//TODO: Add auditor functionality/routing
app.get('/redirect', isLoggedIn, function(req, res, next) {
    
    var userGame = req.user.game_id;

    if(userGame == null)
        res.redirect('game_room');
    else{
        connection.query('SELECT stage_id FROM game WHERE game_id = ?', userGame, function(err, result){
            if (err) {
                console.error(err);
                return;
            }
            var stage = result[0]["stage_id"];
            //Stage 0 = Seller Selection | Stage 1-4 = Buyer 1-4 Selection | Stage 5 = Audit Bid
            //Role_id: 1 = Buyer, 2 = Seller, 3 = Admin
            var role = req.user.role_id;
            if(role == 1){  //If user role is buyer
                if(req.user.buy_pos == stage)   //Check if it is this buyers turn
                    res.redirect('buyer_selection');
                else if(stage == 5)
                    connection.query('SELECT `auditor bid`.user_id FROM `auditor bid` INNER JOIN user on `auditor bid`.user_id = user.user_id WHERE `auditor bid`.user_id = ? AND user.game_id = ?', [req.user.user_id, userGame], function(err, result) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        if(result.length == 0)
                            res.redirect('auditor_bid');
                        else
                            res.redirect('buyer_wait');
                    });
                else if(stage == 6)
                    res.redirect('results');
                else{
                    res.redirect('buyer_wait');
                }
            }
            else if(role == 2){ //If user role is seller
                if(stage == 0)  //Check if it is the seller selection stage 
                    connection.query('SELECT offers.seller_id FROM offers INNER JOIN `seller list` ON offers.seller_id = `seller list`.seller_id WHERE `seller list`.user_id = ? AND `seller list`.game_id = ?', [req.user.user_id, userGame], function(err, result) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        if(result.length == 0)
                            res.redirect('seller_selection');
                        else
                            res.redirect('seller_wait');
                    });
                else if(stage == 5)
                    connection.query('SELECT `auditor bid`.user_id FROM `auditor bid` INNER JOIN user on `auditor bid`.user_id = user.user_id WHERE `auditor bid`.user_id = ? AND user.game_id = ?', [req.user.user_id, userGame], function(err, result) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        if(result.length == 0)
                            res.redirect('auditor_bid');
                        else
                            res.redirect('audit_wait');
                    });
                else if(stage == 6)
                    res.redirect('results');
                else
                    res.redirect('seller_wait');
            }
            else if(role == 3){ //If user role is admin
                res.redirect('admin_control');
            }
        });
    }
});

//Routing to different role specific pages. The first two middleware functions check for an 
//authenticated session and whether or not the user is the role. The last callback function
//redirects the user and runs the javascript file that encapsulates most of the page functionality.

app.get('/admin_control', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/admin_control.ejs'));
    req.session.user_id = req.user.user_id;
    req.session.user = req.user;
    admin_control.admin_control(req);
    load_transactions.load_transactions(req);
    load_leaderboard.load_leaderboard(req);
    load_history.load_history(req);
    joinRoom(req);
});

app.get('/game_initialization', isLoggedIn, isAdmin, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/game_initialization.ejs'));
    req.session.user_id = req.user.user_id;
    req.session.user = req.user;
    game_initialization.game_initialization(req);
});

app.get('/seller_selection', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/seller_selection.ejs'));
    req.session.user_id = req.user.user_id;
    req.session.user = req.user;
    seller_selection.seller_select(req);
    joinRoom(req);
});

app.get('/buyer_selection', isLoggedIn, isBuyer, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/buyer_selection.ejs'));
    req.session.user = req.user;
    buyer_selection.buyer_select(req);
    load_transactions.load_transactions(req);
    joinRoom(req);
});

app.get('/buyer_wait', isLoggedIn, isBuyer, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/buyer_wait.ejs'));
    req.session.user = req.user;
    load_history.load_history(req);
    load_transactions.load_transactions(req);
    joinRoom(req);
    wait.wait(req);
});

app.get('/seller_wait', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/seller_wait.ejs'));
    req.session.user = req.user;
    load_history.load_history(req);
    wait.wait(req);
    load_transactions.load_transactions(req);
    joinRoom(req);
});

app.get('/results', isLoggedIn, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/results.ejs'));
    load_history.load_history(req);
    load_leaderboard.load_leaderboard(req);
    joinRoom(req);
});

app.get('/auditor_bid', isLoggedIn, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/auditor_bid.ejs'));
    req.session.user = req.user;
    auditor_bid.auditor_bid(req);
    joinRoom(req);
});

app.get('/audit_wait', isLoggedIn, isSeller, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/audit_wait.ejs'));
    req.session.user = req.user;
    app.io.route('getStage', function(request) {
        connection.query('SELECT stage_id FROM game WHERE game_id = ?', req.session.user.game_id, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            var stage = result[0]['stage_id'];
            request.io.emit('stage', stage);
        });
    });
    joinRoom(req);
});

app.get('/game_room', isLoggedIn, function(req, res, next) {
    res.render(path.join(__dirname, '..', 'views/game_room.ejs'));
    req.session.user = req.user;
    game_room.game_room(req);
});

app.get('/profits', isLoggedIn, profits.profits)

function joinRoom(request) {
    app.io.route('joinRoom', function(req) {
        req.io.join(request.user.game_id);
    });
}

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

//connection.end();
//Do this if Sleep Queries become a problem (i.e. timeout isn't fast enough and connection pool fills up)