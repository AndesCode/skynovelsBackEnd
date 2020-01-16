/*jshint esversion: 6 */
var config = require('../config/config');
// Models
const user_reading_lists = require('../models').user_reading_lists;
const invitations = require('../models').invitations;
const users = require('../models').users;
const novels = require('../models').novels;
const novels_ratings = require('../models').novels_ratings;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// Encrypters
const bcrypt = require('bcrypt');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.key);
const saltRounds = 10;
// Json web tokens
const jwt = require('../services/jwt');
// More requires
const nodemailer = require("nodemailer");
const atob = require('atob');
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');
const passport = require('passport');


// TESTS

function createUser(req, res) {
    const body = req.body;
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z_.\d]{8,16}$/.test(body.user_pass)) {
        res.status(500).send({ message: 'La contraseña no cumple con el parametro regex' });
        return;
    }
    console.log(body);
    users.create(body).then(user => {
        const activation_user_key = cryptr.encrypt(user.user_verification_key);
        res.status(200).send({ activation_user_key }); // Aqui debe ir NodeMailer enviando la clave a traves de una URL
    }).catch(err => {
        res.status(500).send({ message: 'Error en el registro del usuario.<br>' + err.message });
    });
}

function getUser(req, res) {
    const id = req.params.id;
    users.findByPk(id, {
        include: [{
            model: novels,
            as: 'collaborations',
            attributes: ['id', 'nvl_author', 'nvl_title', 'nvl_status', 'nvl_name', 'nvl_writer', 'nvl_rating'],
            through: { attributes: [] }
        }, {
            model: novels,
            as: 'novels',
            attributes: ['id', 'nvl_title', 'nvl_status', 'nvl_name', 'nvl_writer', 'nvl_rating']
        }, {
            model: invitations,
            as: 'invitations'
        }, {
            model: novels_ratings,
            as: 'novels_ratings',
            attributes: ['id', 'novel_id', 'rate_value', 'createdAt', 'updatedAt'],
            include: [{
                model: novels,
                as: 'novel',
                attributes: ['nvl_title']
            }]
        }],
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_description', 'createdAt', 'updatedAt']
    }).then(user => {
        if (req.user && user.id === req.user.id) {
            const self_user = true;
            res.status(200).send({ user, self_user });
        } else {
            res.status(200).send({ user });
        }
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario ' + err });
    });
}


function getUsers(req, res) {
    let status = req.params.status;
    if (status === 'All') {
        status = {
            [Op.ne]: null
        };
    }
    users.findAll({
        include: [{
            model: novels,
            as: 'collaborations',
            attributes: ['id'],
            through: { attributes: [] }
        }, {
            model: novels,
            as: 'novels',
            attributes: ['id', 'nvl_title', 'nvl_status', 'nvl_name', 'createdAt', 'updatedAt']
        }, {
            model: invitations,
            as: 'invitations',
            attributes: ['id', 'invitation_status']
        }, {
            model: novels_ratings,
            as: 'novels_ratings',
            attributes: ['id', 'novel_id', 'rate_value']
        }],
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
        where: {
            user_status: status
        }
    }).then(users => {
        res.status(200).send({ users });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function activateUser(req, res) {
    const key = req.params.key;
    const decryptedkey = cryptr.decrypt(key);
    console.log(decryptedkey);
    users.findOne({
        where: {
            user_verification_key: decryptedkey
        }
    }).then(user => {
        console.log('activando el usuario con el email = ');
        const new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.update({
            user_status: 'Active',
            user_verification_key: new_user_verification_key
        }).then(() => {
            res.status(200).send({ message: 'Usuario activado con exito! bienvenido ' + user.user_login });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio algún error activando el usuario ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio algún error al encontrar esta clave secreta ' + err });
    });
}

function updateUser(req, res) {
    const body = req.body;
    if (body.user_rol || body.user_forum_auth || body.user_pass) {
        return res.status(401).send({ message: 'Operación no permitida' });
    }
    users.findByPk(body.id).then(user => {
        user.update(body).then(() => {
            res.status(200).send({ user });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el usuario ' + err });
    });
}

function deleteUser(req, res) {
    var id = req.params.id;
    users.findByPk(id).then(user => {
        user.destroy({
            where: {
                id: id
            }
        }).then(user => {
            res.status(200).send({ user });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario' });
    });
}

function login(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return res.send({ 'status': 'err', 'message': err.message }); }
        if (!user) { return res.send({ 'status': 'fail', 'message': info.message }); }
        req.logIn(user, function(err) {
            if (err) { return res.send({ 'status': 'err', 'message': err.message }); }
            if (user.user_rol === 'admin') {
                token_data = jwt.createAdminToken(user);
                user.update({ user_verification_key: token_data.key }).then(user => {
                    return res.send({
                        'user': {
                            id: user.id,
                            user_login: user.user_login,
                            user_rol: user.user_rol
                        },
                        token: token_data.token
                    });
                }).catch(err => {
                    res.status(500).send({ message: 'Error al actualizar la key de administrador ' + err });
                });
            } else {
                return res.send({
                    'user': {
                        id: user.id,
                        user_login: user.user_login,
                        user_rol: user.user_rol
                    }
                });
            }
        });
    })(req, res, next);
}

function logout(req, res) {
    req.logOut();
    req.session.destroy();
    res.clearCookie('sessionId');
    res.status(200).send({ message: 'sesion finalizada' });
}

function cookieTest(req, res) {
    console.log('User is => ' + req.user.user_rol);
    res.status(200).send({ message: 'sesion conseguida. ' });
}

function passwordResetRequest(req, res) {
    users.findOne({
        where: {
            user_email: req.body.user_email,
        }
    }).then(user => {
        const token_data = jwt.createToken(user);
        user.update({
            user_verification_key: token_data.key
        }).then(() => {
            res.status(200).send({
                message: 'haz click en el enalce para activar reiniciar tu contraseña de Skynovels! http://localhost:4200/reseteo-de-contraseña/' + token_data.token
            });
        }).catch(err => {
            res.status(500).send({ message: 'Error al actualizar la key de usuario ' + err });
        });
        /*const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'halle.lehner@ethereal.email',
                pass: 'EQhdryhNC456BX7wKR'
            }
        });

        let mailOptions = {
            from: 'halle.lehner@ethereal.email',
            to: req.body.user_email,
            subject: 'Password reset test',
            // template: '../templates/email-confirmation',
            text: 'haz click en el enalce para activar reiniciar tu contraseña de Skynovels! http://localhost:4200/reseteo-de-contraseña/' + requestToken
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                console.log(err);
                res.status(500).send({ message: 'Error al enviar el correo ' + err });
            } else {
                console.log('Email enviado');
                res.status(200).send({ message: 'Email enviado con exito' });
            }
        });*/
    }).catch(err => {
        res.status(500).send({ message: 'Error, No se encuentra el email especificado' });
    });
}

function updateUserPassword(req, res) {
    const token = req.headers.authorization.replace(/['"]+/g, '');
    const jwtData = token.split('.')[1];
    const decodedJwtData = JSON.parse(atob(jwtData));
    const id = decodedJwtData.sub;
    const body = req.body;
    if (!body.user_pass) {
        return res.status(401).send({ message: 'Operación no permitida' });
    }
    users.findByPk(id).then(user => {
        if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z_.\d]{8,16}$/.test(body.user_pass)) {
            const salt = bcrypt.genSaltSync(saltRounds);
            body.user_pass = bcrypt.hashSync(body.user_pass, salt);
            body.user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        } else {
            res.status(500).send({ message: 'La contraseña no cumple con el parametro regex' });
            return;
        }
        user.update({
            user_pass: body.user_pass,
            user_verification_key: body.user_verification_key
        }).then(() => {
            res.status(200).send({ message: '¡Contraseña actualizada con exito!' });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la contraseña ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario ' + err });
    });
}

function uploadUserProfileImg(req, res) {
    const id = req.params.id;
    if (req.files) {
        const file_path = req.files.user_profile_image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[3];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];
        if (file_ext == 'jpg') {
            if (req.body.old_user_profile_image) {
                const old_img = req.body.old_user_profile_image;
                old_file_path = './server/uploads/users/' + old_img;
                old_file_thumb_path = './server/uploads/users/thumbs/' + old_img;
                fs.exists(old_file_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua.' + err });
                            } else {
                                console.log('imagen de novela eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de novela inexistente.');
                    }
                });
                fs.exists(old_file_thumb_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_thumb_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar el thumb antiguo.' + err });
                            } else {
                                console.log('thumb de novela eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de novela inexistente.');
                    }
                });
            }
            const user_profile_image = {};
            user_profile_image.user_profile_image = file_name;

            users.findByPk(id).then(user => {
                user.update(user_profile_image).then(() => {

                    const newPath = './server/uploads/users/' + file_name;
                    const thumbPath = './server/uploads/users/thumbs';

                    thumb({
                        source: path.resolve(newPath),
                        destination: path.resolve(thumbPath),
                        width: 210,
                        height: 280,
                        suffix: ''
                    }).then(() => {
                        res.status(200).send({ user });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                            }
                        });
                        res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail.' });
                    });
                }).catch(err => {
                    fs.unlink(file_path, (err) => {
                        if (err) {
                            res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                        }
                    });
                    res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario.' });
                });
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                    }
                });
                res.status(500).send({ message: 'No existe el usuario.' });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                }
            });
            res.status(500).send({ message: 'La extensión del archivo no es valida.' });
        }
    } else {
        res.status(400).send({ message: 'Debe Seleccionar un usuario.' });
    }
}

function getUserProfileImage(req, res) {
    const image = req.params.profile_img;
    const thumb = req.params.thumb;
    let img_path = null;

    if (thumb == "false") {
        img_path = './server/uploads/users/' + image;
    } else if (thumb == "true") {
        img_path = './server/uploads/users/thumbs/' + image;
    }

    fs.exists(img_path, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(img_path));
        } else {
            res.status(404).send({
                message: "No se encuentra la imagen del usuario"
            });
        }
    });
}






// Esta función create tiene la función de enviar email de confirmación deshabilitada temporalmente *nodemailer*
/*function create(req, res) {
    if (req.body.user_pass == req.body.user_confirm_pass) {
        console.log(req.body);
        var user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var crypted_verification_key = cryptr.encrypt(user_verification_key);
        users.create(req.body).then(user => {
            console.log(req.body.user_pass);
            var hashed_password = bcrypt.hash(req.body.user_pass, saltRounds, function(err, hash) {
                if (err) {
                    console.log('error ' + err);
                } else {
                    hashed_password = hash;
                    user.update({
                        user_verification_key: crypted_verification_key,
                        user_pass: hashed_password
                    }).then(() => {
                        res.status(200).send({ user });
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.ethereal.email',
                            port: 587,
                            auth: {
                                user: 'halle.lehner@ethereal.email',
                                pass: 'EQhdryhNC456BX7wKR'
                            }
                        });
                        let mailOptions = {
                            from: 'halle.lehner@ethereal.email',
                            to: req.body.user_email,
                            subject: 'testing stuff',
                            // template: '../templates/email-confirmation',
                            text: 'haz click en el enalce para activar tu cuenta de Skynovels! http://localhost:4200/verificacion/' + crypted_verification_key
                        };
                        transporter.sendMail(mailOptions, function(err, data) {
                            if (err) {
                                console.log(err);
                                res.status(500).send({ message: 'Error al enviar el correo ' + err });
                            } else {
                                console.log('Email enviado');
                            }
                        });
                    }).catch(err => {
                        res.status(500).send({ message: 'Error al generar la clave secreta de usuario ' + err });
                    });
                }
            });
            console.log(user_verification_key);
            console.log(hashed_password);
        }).catch(err => {
            res.status(500).send({ message: 'Error en el registro del usuario.<br>' + err.message });
        });
    } else {
        res.status(500).send({ message: 'La contraseña no coincide con el campo de confirmación de contraseña.<br>' });
    }
}*/

function createUserbookmark(req, res) {
    const body = req.body;
    body.user_id = req.user.id
    user_reading_lists.create(body).then(bookmark => {
        return res.status(200).send({ bookmark });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' + err });
    });
}

function removeUserbookmark(req, res) {
    const id = req.params.id
    user_reading_lists.findByPk(id).then(bookmark => {
        if (req.user.id === bookmark.user_id || req.user.user_rol === 'admin') {
            bookmark.destroy({
                where: {
                    id: id
                }
            }).then(bookmark => {
                return res.status(200).send({ bookmark });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela de la lista de lectura' + err });
            });
        } else {
            return res.status(500).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela de la lista de lectura' + err });
    });
}

function updateUserbookmark(req, res) {
    const body = req.body;
    user_reading_lists.findByPk(body.id).then(bookmark => {
        if (req.user.id === bookmark.user_id || req.user.user_rol === 'admin') {
            console.log(body.nvl_chapter);
            bookmark.update({
                nvl_chapter: body.nvl_chapter
            }).then(() => {
                return res.status(200).send({ bookmark });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el marcapaginas' });
            });
        } else {
            return res.status(500).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el marcapaginas' });
    });
}

function createUserInvitation(req, res) {
    const body = req.body;
    novels.findOne({
        where: {
            nvl_author: req.user.id,
            id: req.body.invitation_novel
        },
        attributes: ['id']
    }).then(novel => {
        if (novel) {
            users.findOne({
                where: {
                    user_login: body.user_login,
                },
                attributes: ['id', 'user_login',]
            }).then(user => {
                if (user !== null) {
                    if (user.id !== req.user.id) {
                        invitations.findOne({
                            where: {
                                invitation_to_id: user.id,
                                invitation_novel: body.invitation_novel
                            }
                        }).then(invitation => {
                            if (invitation === null) {
                                invitations.create({
                                    invitation_from_id: req.user.id,
                                    invitation_to_id: user.id,
                                    invitation_novel: body.invitation_novel
                                }).then(invitation => {
                                    return res.status(200).send({ invitation });
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error al crear la invitación del usuario' });
                                });
                            } else {
                                return res.status(500).send({ message: 'Ya has invitado al usuario' });
                            }
                        }).catch(err => {
                            return res.status(500).send({ message: 'Ocurrio un error al buscar la invitación ' + err });
                        });
                    } else {
                        return res.status(500).send({ message: '¡No te puedes invitar a ti mismo!' });
                    }
                } else {    
                    return res.status(500).send({ message: 'No se encuentra ningún usuario por ese nombre' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ha ocurrido algún error durante la busqueda de usuario ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    });
}

function updateUserInvitation(req, res) {
    const body = req.body;
    invitations.findByPk(body.id).then(invitation => {
        if (req.user.id === invitation.invitation_to_id || req.user.user_rol === 'admin') {
            invitation.update({
                invitation_status: body.invitation_status
            }).then(() => {
                return res.status(200).send({ invitation });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la invitación ' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la invitación ' + err});
    });
}

module.exports = {
    // LogIn - LogOut
    login,
    logout,
    // User register
    createUser,
    activateUser,
    // Users
    updateUser,
    deleteUser,
    getUser,
    getUsers,
    cookieTest,
    // Passwords
    passwordResetRequest,
    updateUserPassword,
    // Imgs
    getUserProfileImage,
    uploadUserProfileImg,
    // Bookmarks
    createUserbookmark,
    removeUserbookmark,
    updateUserbookmark,
    // Invitations
    createUserInvitation,
    updateUserInvitation
};