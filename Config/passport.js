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
                    var newUserMysql = {
                        teamname: username,
                        password: password,
                        role_id: role,
                        profits: 0,
                        game_id: null
                    };
                    if(newUserMysql.role_id != 3)
                        newUserMysql.game_id = 1;

                    var insertQuery = "INSERT INTO user ( teamname, password, role_id, profits, game_id ) values (?,?,?,?,?)";

                    connection.query(insertQuery,[newUserMysql.teamname, newUserMysql.password, newUserMysql.role_id, newUserMysql.profits, newUserMysql.game_id],function(err, rows) {
                        if(err) {
                            console.error(err);
                            return;
                        }

                        newUserMysql.user_id = rows.insertId;

                        if(role == 1){
                            connection.query('SELECT buyer_number FROM `buyer list` ORDER BY buyer_id DESC LIMIT 1', function(err, result){
                                if(err) {
                                    console.error(err);
                                    return;
                                }
                                var new_buyer_number = 1;
                                if(result.length != 0)
                                    new_buyer_number = ++result[0]["buyer_number"];
                                var newBuyer = {
                                    buyer_number : new_buyer_number,
                                    user_id : rows.insertId
                                }
                                connection.query('INSERT INTO `buyer list` SET ?', newBuyer, function(err, result) {
                                    if(err) {
                                        console.error(err);
                                        return;
                                    }
                                });
                                connection.query('UPDATE user SET buy_pos = ? WHERE user_id = ?', [newBuyer.buyer_number, newBuyer.buyer_id], function(err, result) {
                                    if(err) {
                                        console.error(err);
                                        return;
                                    }
                                });
                            });
                        }
                        else if(role == 2){
                            connection.query('SELECT seller_number FROM `seller list` ORDER BY seller_id DESC LIMIT 1', function(err, result){
                                if(err) {
                                    console.error(err);
                                    return;
                                }
                                var new_seller_number = 1;
                                if(result.length != 0)
                                    new_seller_number = ++result[0]["seller_number"];
                                var newSeller = {
                                    seller_number : new_seller_number,
                                    user_id : rows.insertId
                                }
                                connection.query('INSERT INTO `seller list` SET ?', newSeller, function(err, result) {
                                    if(err) {
                                        console.error(err);
                                        return;
                                    }
                                });
                            });
                        }

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

                // if the user is found but the password is wrong
                if (password != rows[0].password)
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
};
