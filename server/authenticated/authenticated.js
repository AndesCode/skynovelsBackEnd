/*jshint esversion: 6 */
var nJwT = require('njwt');
var atob = require('atob');
var users = require('../models').users;

// Autorización de usuario logeado
function auth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.headers.authorization.replace(/['"]+/g, '');
        const jwtData = token.split('.')[1];
        const decodedJwtData = JSON.parse(atob(jwtData));
        const user_id = decodedJwtData.sub;

        users.findByPk(user_id).then((user) => {
            if (user.dataValues.user_status === 'Active') {
                const payload = nJwT.verify(token, user.dataValues.user_verification_key, (err, verifiedJwT) => {
                    if (!err) {
                        next();
                    } else {
                        return res.status(401).send({ message: 'No autorizado' });
                    }
                });
            } else {
                return res.status(401).send({ message: 'No autorizado' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    }
}

// Autorización de usuario logeado y autorización de posteo en el foro
function forumAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.headers.authorization.replace(/['"]+/g, '');
        const jwtData = token.split('.')[1];
        const decodedJwtData = JSON.parse(atob(jwtData));
        const user_id = decodedJwtData.sub;

        users.findByPk(user_id).then((user) => {
            if (user.dataValues.user_status === 'Active' && user.dataValues.user_forum_auth == 'Active') {
                const payload = nJwT.verify(token, user.dataValues.user_verification_key, (err, verifiedJwT) => {
                    if (!err) {
                        next();
                    } else {
                        return res.status(401).send({ message: 'No autorizado' });
                    }
                });
            } else {
                return res.status(401).send({ message: 'No autorizado o sin acceso al foro' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    }
}

// Autorización de usuario administrador
function adminAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.headers.authorization.replace(/['"]+/g, '');

        const jwtData = token.split('.')[1];
        const decodedJwtData = JSON.parse(atob(jwtData));
        const user_id = decodedJwtData.sub;

        users.findByPk(user_id).then((user) => {
            if (user.dataValues.user_status === 'Active' && user.dataValues.user_rol == 'admin') {
                const payload = nJwT.verify(token, user.dataValues.user_verification_key, (err, verifiedJwT) => {
                    if (!err) {
                        next();
                    } else {
                        return res.status(401).send({ message: 'No autorizado' });
                    }
                });
            } else {
                return res.status(401).send({ message: 'No autorizado o no es administrador' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' + err });
        });
    }
}

function cookieAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.headers.authorization.replace(/['"]+/g, '');
        const jwtData = token.split('.')[1];
        const decodedJwtData = JSON.parse(atob(jwtData));
        const user_id = decodedJwtData.sub;

        users.findByPk(user_id).then((user) => {
            if (user.dataValues.user_status === 'Active') {
                const payload = nJwT.verify(token, user.dataValues.user_verification_key, (err, verifiedJwT) => {
                    if (!err) {
                        next();
                    } else {
                        return res.status(401).send({ message: 'No autorizado' });
                    }
                });
            } else {
                return res.status(401).send({ message: 'No autorizado' });
            }
        }).catch(err => {
            res.status(500).send({ message: 'No se encuentra usuario por el id indicado' });
        });
    }
}

module.exports = {
    auth,
    forumAuth,
    adminAuth,
    cookieAuth
};