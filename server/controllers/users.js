/*jshint esversion: 6 */
const users = require('../models').users;
const jwt = require('../services/jwt');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('testkey');
const saltRounds = 10;
const atob = require('atob');
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const user_reading_lists = require('../models').user_reading_lists;

function create(req, res) {
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
                        user_verification_key: user_verification_key,
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
}

function activateUser(req, res) {
    var key = req.params.key;
    var decryptedkey = cryptr.decrypt(key);
    if (decryptedkey.length > 4) {
        console.log(decryptedkey);
        users.findOne({
            where: {
                user_verification_key: decryptedkey
            }
        }).then(user => {
            console.log('activando el usuario con el email = ');
            var new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
    } else {
        res.status(500).send({ message: 'Codigo de verificación invalido ' });
    }
}

function update(req, res) {
    var id = req.params.id;
    var body = req.body;

    users.findByPk(id).then(user => {
        user.update(body).then(() => {
            res.status(200).send({ user });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' });
    });
}

function passwordResetRequest(req, res) {
    console.log(req.body);
    users.findOne({
        where: {
            user_email: req.body.user_email,
        }
    }).then(user => {
        requestToken = jwt.createPasswordResetToken(user);
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
        });
    }).catch(err => {
        res.status(500).send({ message: 'Error, No se encuentra el email especificado' });
    });
}

function login(req, res) {
    console.log(req.body);
    users.findOne({
        where: {
            [Op.or]: [{ user_login: req.body.user_login }, { user_email: req.body.user_login }]
        }
    }).then(user => {
        console.log(user.dataValues);
        hash = user.dataValues.user_pass;
        user_password = bcrypt.compare(req.body.user_pass, hash, function(err, response) {
            if (user && user.dataValues.user_status == 'Active' && response == true) {
                res.status(200).send({
                    token: jwt.createToken(user),
                    user: user
                });
            } else {
                res.status(401).send({ message: 'Error, Usuario o contraseña incorrectos' });
            }
        });
    }).catch(err => {
        res.status(500).send({ message: 'Error, Usuario o contraseña incorrectos' });
    });
}

function getAll(req, res) {
    users.all().then(users => {
        res.status(200).send({ users });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar a todos los usuarios' });
    });
}

function getUser(req, res) {
    var id = req.params.id;
    users.sequelize.query("SELECT user_description, users.user_profile_image, users.id, users.user_login, users.user_email, users.user_status, users.user_rol, (SELECT COUNT(*) FROM posts where posts.post_author_id = users.id) AS post_count, (SELECT COUNT(*) FROM posts_comments WHERE posts_comments.post_comment_author_id = users.id) AS comment_count, (SELECT COUNT(*) FROM novels where novels.nvl_author = users.id) AS novel_count, (SELECT p.post_title FROM posts p where p.post_author_id=users.id ORDER BY createdAt DESC LIMIT 1) AS last_post FROM users WHERE users.id = ?", {
        replacements: [id],
        type: users.sequelize.QueryTypes.SELECT
    }).then(user => {
        res.status(200).send({
            user
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Ocurrio un error al buscar al usuario' + err
        });
    });
}

function getUserByEmailToken(req, res) {
    var token = req.params.token.replace(/['"]+/g, '');
    var jwtData = token.split('.')[1];
    var decodedJwtData = JSON.parse(atob(jwtData));
    var id = decodedJwtData.sub;
    users.findOne({
        where: {
            id: id,
        },
        attributes: ['id'],
    }).then(user => {
        res.status(200).send({ user });
    }).catch(err => {
        res.status(500).send({ message: 'EL usuario indicado no existe.' });
    });
}

function updateUserPassword(req, res) {
    if (req.body.user_pass == req.body.user_confirm_pass) {
        var id = req.body.user_id;
        users.findOne({
            where: {
                id: id
            }
        }).then(user => {
            var hashed_password = bcrypt.hash(req.body.user_pass, saltRounds, function(err, hash) {
                if (err) {
                    console.log('error ' + err);
                } else {
                    hashed_password = hash;
                    var new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    user.update({
                        user_pass: hashed_password,
                        user_verification_key: new_user_verification_key
                    }).then(() => {
                        res.status(200).send({ user });
                        console.log('contraseña de usuario ' + user.id + ' actualizada');
                    }).catch(err => {
                        res.status(500).send({ message: 'Error al generar la clave secreta de usuario ' + err });
                    });
                }
            });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio algún error al encontrar esta clave secreta ' + err });
        });
    } else {
        res.status(500).send({ message: 'La contraseña no coincide con el campo de confirmación de contraseña.<br>' });
    }
}

function uploadUserProfileImg(req, res) {
    var id = req.params.id;
    console.log(req.files);
    console.log(req.body);
    // var update = req.params.update;
    if (req.body.old_user_profile_image) {
        console.log(req.body.old_user_profile_image);
        var old_img = req.body.old_user_profile_image;
        old_file_path = './server/uploads/users/' + old_img;
        old_file_thumb_path = './server/uploads/users/thumbs/' + old_img;
        console.log(old_img);
        fs.unlink(old_file_path, (err) => {
            if (err) {
                res.status(500).send({
                    message: 'Ocurrio un error al eliminar la imagen antigua.' + err
                });
            } else {
                fs.unlink(old_file_thumb_path, (err) => {
                    if (err) {
                        res.status(500).send({
                            message: 'Ocurrio un error al eliminar la imagen thumb antigua.'
                        });
                    } else {

                    }
                });
            }
        });
    } else {
        console.log('Usuario no tiene imagen de usuario');
    }
    if (req.files) {
        console.log('subiendo una nueva imagen de usuario');
        var file_path = req.files.user_profile_image.path;
        console.log(file_path);
        var file_split = file_path.split('\\');
        var file_name = file_split[3];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        if (file_ext == 'jpg') {
            var user_profile_image = {};
            user_profile_image.user_profile_image = file_name;

            users.findByPk(id).then(user => {
                console.log(id);
                user.update(user_profile_image).then(() => {
                    var newPath = './server/uploads/users/' + file_name;
                    var thumbPath = './server/uploads/users/thumbs';
                    console.log(thumbPath);
                    thumb({
                        source: path.resolve(newPath),
                        destination: path.resolve(thumbPath),
                        width: 200,
                        suffix: ''
                    }).then(() => {
                        console.log("Se esta enviando el usuario");
                        res.status(200).send({ user });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                res.status(500).send({
                                    message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' + err
                                });
                            }
                        });
                        res.status(500).send({
                            message: 'Ocurrio un error al crear el thumbnail.' + err
                        });
                    });
                }).catch(err => {
                    fs.unlink(file_path, (err) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Ocurrio un error al intentar eliminar el archivo.' + err
                            });
                        }
                    });
                    res.status(500).send({
                        message: 'Ocurrio un error al actualziar la foto de perfil.' + err
                    });
                });
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        res.status(500).send({
                            message: 'Ocurrio un error al intentar eliminar el archivo.' + err
                        });
                    }
                });
                res.status(500).send({
                    message: 'No existe el usuario.' + err
                });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    res.status(500).send({
                        message: 'Ocurrio un error al intentar eliminar el archivo.' + err
                    });
                }
            });
            res.status(500).send({
                message: 'La extensión del archivo no es valida.' + err
            });
        }
    }
}

function getUserProfileImage(req, res) {
    var image = req.params.profile_img;
    var thumb = req.params.thumb;

    console.log(image);
    console.log(thumb);

    if (thumb == "false") {
        var img_path = './server/uploads/users/' + image;
    } else if (thumb == "true") {
        var img_path = './server/uploads/users/thumbs/' + image;
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

function createUserReadingList(req, res) {
    var body = req.body;
    console.log(body);
    user_reading_lists.create(body).then(user_reading_list => {
        res.status(200).send({ user_reading_list });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' + err });
    });
}

function findUserReadingList(req, res) {
    var id = req.params.id;
    user_reading_lists.sequelize.query("SELECT novels.id, novels.nvl_title, novels.nvl_name, user_reading_lists.nvl_chapter from novels, user_reading_lists WHERE novels.id = user_reading_lists.nvl_id AND user_reading_lists.user_id = ?", {
        replacements: [id],
        type: user_reading_lists.sequelize.QueryTypes.SELECT
    }).then(user_reading_list => {
        res.status(200).send({ user_reading_list });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' + err });
    });
}

function checkNovelIsBookmarked(req, res) {
    var novel_id = req.params.nvl;
    var user_id = req.params.uid;
    user_reading_lists.findOne({
        where: {
            nvl_id: novel_id,
            user_id: user_id
        }
    }).then(user_reading_list => {
        res.status(200).send({ user_reading_list });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar si la novela esta marcada' + err });
    });
}

function removeUserReadingList(req, res) {
    var novel_id = req.params.nvl;
    var user_id = req.params.uid;
    user_reading_lists.destroy({
        where: {
            nvl_id: novel_id,
            user_id: user_id
        }
    }).then(user_reading_list => {
        res.status(200).send({ user_reading_list });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al eliminar la novela de la lista de lectura' + err });
    });
}

function updateUserReadingListItem(req, res) {
    var body = req.body;

    user_reading_lists.findByPk(body.id).then(user_reading_list => {
        user_reading_list.update(body).then(() => {
            res.status(200).send({ user_reading_list });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el marcapaginas' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el marcapaginas' });
    });
}

module.exports = {
    create,
    login,
    update,
    getAll,
    activateUser,
    getUser,
    passwordResetRequest,
    getUserByEmailToken,
    updateUserPassword,
    uploadUserProfileImg,
    getUserProfileImage,
    createUserReadingList,
    findUserReadingList,
    removeUserReadingList,
    updateUserReadingListItem,
    checkNovelIsBookmarked
};