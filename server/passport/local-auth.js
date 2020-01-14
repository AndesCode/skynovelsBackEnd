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
    passwordField: 'user_pass',
    passReqToCallback: true
}, function execute(req, user_login, user_pass, done) {
    users.findOne({
        where: {
            [Op.or]: [{ user_login: user_login }, { user_email: user_login }]
        }
    }).then(user => {
        if (user && bcrypt.compareSync(req.body.user_pass, user.user_pass)) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Usuario o contraseña incorrectos' });
        }
    });
}));

/*passport.use('local-register', new LocalStrategy({
    userLoginField: 'user_login',
    userPassField: 'user_pass',
    userEmailField: 'user_email',
    passReqToCallback: true
}, (req, user_login, user_pass, user_email, done) => {
    const user = new users();
    const body = req.body;
    console.log(req);
    user.user_login = user_login;
    user.user_pass = user_pass;
    user.user_email = user_email;
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z_.\d]{8,16}$/.test(body.user_pass)) {
        res.status(500).send({ message: 'La contraseña no cumple con el parametro regex' });
        return;
    }
    console.log(body);
    user.create(body).then(user => {
        done(null, user);
        const activation_user_key = cryptr.encrypt(user.user_verification_key);
        res.status(200).send({ activation_user_key }); // Aqui debe ir NodeMailer enviando la clave a traves de una URL
    }).catch(err => {
        done(null, false);
        res.status(500).send({ message: 'Error en el registro del usuario.<br>' + err.message });
    });
}));*/