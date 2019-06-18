/*jshint esversion: 6 */
var njwt = require('njwt');
var config = require('../config/config');
var secret = config.token_secret;
var secureRandom = require('secure-random');


exports.createToken = (usuario) => {
    var params = {
        sub: usuario.id,
        user_login: usuario.user_login,
        user_rol: usuario.user_rol
    };

    var jwt = njwt.create(params, secret);

    var t = new Date();
    t.setHours(t.getHours() + 2);
    jwt.setExpiration(t);

    var token = jwt.compact();

    return token;
};

exports.createPasswordResetToken = (usuario) => {
    console.log(usuario.user_login);
    console.log(usuario.user_verification_key);
    var params = {
        sub: usuario.id,
        user_verification_key: usuario.user_verification_key,
        user_email: usuario.user_email
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