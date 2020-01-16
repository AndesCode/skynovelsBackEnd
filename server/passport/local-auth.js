/*jshint esversion: 6 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

var users = require('../models').users;


passport.serializeUser((user, done) => {
    console.log('serializando');
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log('deserializando');
    users.findByPk(id).then(user => {
        done(null, user);
    });
});

passport.use('local-login', new LocalStrategy({
    usernameField: 'user_login',
    passwordField: 'user_pass'
}, function execute(user_login, user_pass, done) {
    users.findOne({
        where: {
            [Op.or]: [{ user_login: user_login }, { user_email: user_login }]
        }
    }).then(user => {
        if (user && bcrypt.compareSync(user_pass, user.user_pass) && user.user_status === 'Active') {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Usuario o contraseña incorrectos' });
        }
    });
}));