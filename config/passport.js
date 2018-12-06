// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1259",
  database: "mydb"
});

/*var connection = mysql.createConnection({
    host: "206.81.2.182",
    user: "admin",
    password: "5615f1f95884b2c3252ed34a13e0241ce442703b627261f9",
    database: "mydb"
});*/

// required for password encryption

/*==========BCRYPT ISSUE==========
var bcrypt = require('bcrypt');
const saltRounds = 10;
*/

connection.query('USE mydb');
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM user WHERE user_id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("SELECT * FROM user WHERE teamname = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That team name is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    var role = req.body.role;
                    
                    /*==========BCRYPT ISSUE==========
                    bcrypt.hash(password, saltRounds, function(err, hash) {
                        var newUserMysql = {
                            teamname: username,
                            password: hash,
                            profits: 0,
                            role_id: role,
                            game_id: null
                        };

                        connection.query('INSERT INTO user SET ?', newUserMysql, function(err, rows) {
                            if(err) {
                                console.error(err);
                                return;
                            }
                            newUserMysql.user_id = rows.insertId;
                            return done(null, newUserMysql);
                        });
                    });
                    */
                   var newUserMysql = {
                        teamname: username,
                        password: password,
                        profits: 0,
                        role_id: role,
                        game_id: null
                    };
                    connection.query('INSERT INTO user SET ?', newUserMysql, function(err, rows) {
                        if(err) {
                            console.error(err);
                            return;
                        }
                        newUserMysql.user_id = rows.insertId;
                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            connection.query("SELECT * FROM user WHERE teamname = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                /*==========BCRYPT ISSUE==========
                // if the user is found but the password is wrong
                bcrypt.compare(password, rows[0].password, function(err, res) {
                    if (!res)
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                    // all is well, return successful user
                    return done(null, rows[0]);
                });
                */
                
                if(rows[0].password == password)
                    return done(null, rows[0]);
                else
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
            });
        })
    );
};
