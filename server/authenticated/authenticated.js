/*jshint esversion: 6 */
const nJwT = require('njwt');
const atob = require('atob');
const users = require('../models').users;

// Autorización de usuario logeado
function changePasswordTokenAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.headers.authorization.replace(/['"]+/g, '');
        const jwtData = token.split('.')[1];
        const decodedJwtData = JSON.parse(atob(jwtData));
        const user_id = decodedJwtData.sub;
        users.findByPk(user_id).then((user) => {
            if (user.dataValues.user_status === 'Active') {
                const payload = nJwT.verify(token, user.dataValues.user_verification_key, 'HS384', (err, verifiedJwT) => {
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

function changePasswordAccessToken(req, res, next) {
    if (!req.params.token) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        const token = req.params.token.replace(/['"]+/g, '');
        const payload = nJwT.verify(token, user.dataValues.user_verification_key, 'HS384', (err, verifiedJwT) => {
            if (!err) {
                next();
            } else {
                return res.status(401).send({ message: 'No autorizado' });
            }
        });
    }
}

function adminAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabezera de autenticación' });
    } else {
        if (req.user && req.user.user_rol === 'Admin' && req.user.user_status === 'Active' && req.isAuthenticated()) {
            const token = req.headers.authorization.replace(/['"]+/g, '');
            const payload = nJwT.verify(token, req.user.user_verification_key, 'HS512', (err, verifiedJwT) => {
                if (!err) {
                    next();
                } else {
                    return res.status(401).send({ message: 'No autorizado' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }

    }
}

function adminListsAuth(req, res, next) {
    if (req.user && req.user.user_rol === 'Admin' && req.user.user_status === 'Active' && req.isAuthenticated()) {
        next();
    } else {
        return res.status(401).send({ message: 'No autorizado' });
    }
}

function EditorAuth(req, res, next) {
    if (req.user && req.user.user_status === 'Active' && req.isAuthenticated() && (req.user.user_rol === 'Editor' || req.user.user_rol === 'Admin')) {
        next();
    } else {
        return res.status(401).send({ message: 'No autorizado' });
    }
}

function auth(req, res, next) {
    if (req.user && req.isAuthenticated() && req.user.user_status === 'Active') {
        next();
    } else {
        return res.status(401).send({ message: 'No autorizado' });
    }
}

function forumAuth(req, res, next) {
    if (req.user && req.user.user_status === 'Active' && req.user.user_forum_auth === 'Active' && req.isAuthenticated()) {
        next();
    } else {
        return res.status(401).send({ message: 'No autorizado' });
    }
}

module.exports = {
    auth,
    forumAuth,
    adminAuth,
    adminListsAuth,
    EditorAuth,
    changePasswordTokenAuth,
    changePasswordAccessToken
};