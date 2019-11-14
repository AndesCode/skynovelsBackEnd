/*jshint esversion: 6 */
var njwt = require('njwt');
const users = require('../models').users;
var config = require('../config/config');
var secret = config.token_secret;
// var secureRandom = require('secure-random');

var signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


exports.createToken = (user) => {
    var params = {
        sub: user.id,
        user_login: user.user_login,
        user_rol: user.user_rol
    };
    var jwt = njwt.create(params, secret); // trabajando aquí

    var t = new Date();
    t.setHours(t.getHours() + 2);
    jwt.setExpiration(t);

    var token = jwt.compact();

    users.findByPk(user.id).then(user => {
        user.update({
            user_verification_key: signingKey,
        }).then(() => {
            console.log('Verification_key_updated');
        }).catch(err => {
            console.log('Ocurrio un error al actualizar el usuario');
        });
    }).catch(err => {
        console.log('Ocurrio un error al buscar el usuario');
    });

    return token;
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