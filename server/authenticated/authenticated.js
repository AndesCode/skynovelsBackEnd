/*jshint esversion: 6 */
var nJwT = require('njwt');
var config = require('../config/config');
var secret = config.token_secret;
var atob = require('atob');
var usuarios = require('../models').usuarios;

function auth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    var payload = nJwT.verify(token, secret, (err, verifiedJwT) => {

        var jwtData = token.split('.')[1];
        var decodedJwtData = JSON.parse(atob(jwtData));
        var user_id = decodedJwtData.sub;

        usuarios.findByPk(user_id).then((usuarios) => {
            if ((usuarios.dataValues.user_status == 'Active') && (!err)) {
                next();
            } else {
                return res.status(401).send({ message: 'No autorizado' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    });
}

function forumAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    var payload = nJwT.verify(token, secret, (err, verifiedJwT) => {

        var jwtData = token.split('.')[1];
        var decodedJwtData = JSON.parse(atob(jwtData));
        var user_id = decodedJwtData.sub;

        usuarios.findByPk(user_id).then((usuarios) => {
            if ((usuarios.dataValues.user_forum_auth == 'Active') && (!err)) {
                if (usuarios.dataValues.user_status == 'Active') {
                    next();
                } else {
                    return res.status(401).send({ message: 'Usuario desactivado' });
                }
            } else {
                return res.status(401).send({ message: 'Usuario sin acceso a foro' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    });
}

function adminAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    var payload = nJwT.verify(token, secret, (err, verifiedJwT) => {

        var jwtData = token.split('.')[1];
        var decodedJwtData = JSON.parse(atob(jwtData));
        var user_id = decodedJwtData.sub;
        var user_rol = decodedJwtData.user_rol;

        usuarios.findByPk(user_id).then((usuarios) => {
            if (usuarios.dataValues.user_status != 'Active') {
                return res.status(401).send({ message: 'Usuario desactivado' });
            } else {
                if ((user_rol === 'admin') && (!err)) {
                    next();
                } else {
                    return res.status(401).send({ message: 'Acceso no autorizado' });
                }
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    });
}

function emailVerificationAuth(req, res, next) {
    if (!req.params.token) {
        if (!req.headers.authorization) {
            return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
        } else {
            var token = req.headers.authorization.replace(/['"]+/g, '');
        }
    } else {
        var token = req.params.token.replace(/['"]+/g, '');
    }
    console.log('entra la autorizacion');
    console.log(req.params.token);

    var jwtData = token.split('.')[1];
    var decodedJwtData = JSON.parse(atob(jwtData));
    var token_user_email = decodedJwtData.user_email;
    var token_user_verification_key = decodedJwtData.user_verification_key;
    var user_id = decodedJwtData.sub;
    var nsecret = token_user_verification_key + token_user_email;
    console.log(nsecret);
    var payload = nJwT.verify(token, nsecret, (err, verifiedJwT) => {
        usuarios.findByPk(user_id).then((usuario) => {
            if ((usuario.dataValues.user_verification_key == token_user_verification_key) && (!err)) {
                next();
            } else {
                return res.status(401).send({ message: 'Token de cambio de contraseña invalido' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    });
}

module.exports = {
    auth,
    forumAuth,
    adminAuth,
    emailVerificationAuth
};