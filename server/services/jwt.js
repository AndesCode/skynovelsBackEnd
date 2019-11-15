/*jshint esversion: 6 */
var njwt = require('njwt');
const users = require('../models').users;
var config = require('../config/config');
// var secret = config.token_secret;
// var secureRandom = require('secure-random');

exports.createToken = (user) => {
    var signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var params = {
        sub: user.id,
        user_login: user.user_login,
        user_rol: user.user_rol
    };
    var jwt = njwt.create(params, signingKey); // trabajando aquí
    var t = new Date();
    t.setHours(t.getHours() + 2);
    jwt.setExpiration(t);
    var token_data = {
        token: jwt.compact(),
        key: signingKey
    };
    return token_data; // quitar estooooo
};

exports.createPasswordResetToken = (user) => {
    console.log(user.user_login);
    console.log(user.user_verification_key);
    var params = {
        sub: user.id,
        user_verification_key: user.user_verification_key,
        user_email: user.user_email
    };

    var nsecret = params.user_verification_key + params.user_email;
    console.log(nsecret);

    var jwt = njwt.create(params, nsecret);

    var t = new Date();
    t.setHours(t.getHours() + 1);
    jwt.setExpiration(t);

    var token = jwt.compact();

    console.log(token);
    return token;
};