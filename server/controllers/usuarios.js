/*jshint esversion: 6 */
const usuarios = require('../models').usuarios;
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

function create(req, res) {
    console.log(req.body);
    var user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var crypted_verification_key = cryptr.encrypt(user_verification_key);

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'jaleel.schuster2@ethereal.email',
            pass: 'qqGC49u1t75GEW7cyp'
        }
    });

    let mailOptions = {
        from: 'jaleel.schuster2@ethereal.email',
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
            usuarios.create(req.body).then(usuario => {
                console.log(req.body.user_pass);
                var hashed_password = bcrypt.hash(req.body.user_pass, saltRounds, function(err, hash) {
                    if (err) {
                        console.log('error ' + err);
                    } else {
                        hashed_password = hash;
                        usuario.update({
                            user_verification_key: user_verification_key,
                            user_pass: hashed_password
                        }).then(() => {
                            res.status(200).send({ usuario });
                        }).catch(err => {
                            res.status(500).send({ message: 'Error al generar la clave secreta de usuario ' + err });
                        });
                    }
                });
                console.log(user_verification_key);
                console.log(hashed_password);
            }).catch(err => {
                res.status(500).send({ message: 'Error al crear el usuario ' + err });
            });

        }
    });
}

function activateUser(req, res) {
    var key = req.params.key;
    var decryptedkey = cryptr.decrypt(key);
    if (decryptedkey.length > 4) {
        console.log(decryptedkey);
        usuarios.findOne({
            where: {
                user_verification_key: decryptedkey
            }
        }).then(usuario => {
            console.log('activando el usuario con el email = ');
            var new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            usuario.update({
                user_status: 'Active',
                user_verification_key: new_user_verification_key
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

    usuarios.findByPk(id).then(usuario => {
        usuario.update(body).then(() => {
            res.status(200).send({ usuario });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' });
    });
}

function passwordResetRequest(req, res) {
    console.log(req.body);
    usuarios.findOne({
        where: {
            user_email: req.body.user_email,
        }
    }).then(usuario => {
        requestToken = jwt.createPasswordResetToken(usuario);
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'jaleel.schuster2@ethereal.email',
                pass: 'qqGC49u1t75GEW7cyp'
            }
        });

        let mailOptions = {
            from: 'jaleel.schuster2@ethereal.email',
            to: req.body.user_email,
            subject: 'Password reset test',
            // template: '../templates/email-confirmation',
            text: 'haz click en el enalce para activar reiniciar tu contraseña de Skynovels! http://localhost:4200/password-reset/' + requestToken
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
        res.status(500).send({ message: 'Error, No se encuentra el email del usuario ' + err });
    });
}

function login(req, res) {
    usuarios.findOne({
        where: {
            user_login: req.body.user_login,
        }
    }).then(usuario => {
        console.log(usuario.dataValues);
        hash = usuario.dataValues.user_pass;
        user_password = bcrypt.compare(req.body.user_pass, hash, function(err, response) {
            if (usuario && usuario.dataValues.user_status == 'Active' && response == true) {
                if (req.body.token) {
                    res.status(200).send({
                        token: jwt.createToken(usuario)
                    });
                } else {
                    res.status(200).send({
                        usuario: usuario,
                    });
                }

            } else {
                res.status(401).send({ message: 'Error, Usuario o contraseña incorrectos' });
            }
        });
    }).catch(err => {
        res.status(500).send({ message: 'Error, Usuario o contraseña incorrectos' });
    });
}

function getAll(req, res) {
    usuarios.all().then(usuarios => {
        res.status(200).send({ usuarios });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar a todos los usuarios' });
    });
}

function getUser(req, res) {
    var id = req.params.id;
    usuarios.sequelize.query("SELECT user_description, usuarios.user_profile_image, usuarios.id, usuarios.user_login, usuarios.user_email, usuarios.user_status, usuarios.user_rol, (SELECT COUNT(*) FROM posts where posts.post_author_id = usuarios.id) AS Cuenta_Posts, (SELECT COUNT(*) FROM posts_comments WHERE posts_comments.post_comment_author_id = usuarios.id) AS Cuenta_Comentarios, (SELECT COUNT(*) FROM novelas where novelas.nvl_author = usuarios.id) AS Cuenta_Novelas, (SELECT p.post_title FROM posts p where p.post_author_id=usuarios.id ORDER BY createdAt DESC LIMIT 1) AS last_post FROM usuarios WHERE usuarios.id = ?", {
        replacements: [id],
        type: usuarios.sequelize.QueryTypes.SELECT
    }).then(usuarios => {
        res.status(200).send({
            usuarios
        });
    }).catch(err => {
        res.status(500).send({
            message: 'Ocurrio un error al buscar al usuario'
        });
    });
}

function getUserByEmailToken(req, res) {
    var token = req.params.token.replace(/['"]+/g, '');
    var jwtData = token.split('.')[1];
    var decodedJwtData = JSON.parse(atob(jwtData));
    var id = decodedJwtData.sub;
    usuarios.findOne({
        where: {
            id: id,
        },
        attributes: ['id'],
    }).then(usuario => {
        res.status(200).send({ usuario });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar a todos los usuarios' });
    });
}

function updateUserPassword(req, res) {
    var id = req.body.user_id;
    usuarios.findOne({
        where: {
            id: id
        }
    }).then(usuario => {
        res.status(200).send({ usuario });
        var hashed_password = bcrypt.hash(req.body.user_pass, saltRounds, function(err, hash) {
            if (err) {
                console.log('error ' + err);
            } else {
                hashed_password = hash;
                var new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                usuario.update({
                    user_pass: hashed_password,
                    user_verification_key: new_user_verification_key
                }).then(() => {
                    console.log('contraseña de usuario' + usuario.id + 'actualizada');
                }).catch(err => {
                    res.status(500).send({ message: 'Error al generar la clave secreta de usuario ' + err });
                });
            }
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio algún error al encontrar esta clave secreta ' + err });
    });
}

function uploadUserProfileImg(req, res) {
    var id = req.params.id;
    console.log(req.files);
    console.log(req.body);
    // var update = req.params.update;
    if (req.body.old_user_profile_image) {
        console.log(req.body.old_user_profile_image);
        var old_img = req.body.old_user_profile_image;
        old_file_path = './server/uploads/usuarios/' + old_img;
        old_file_thumb_path = './server/uploads/usuarios/thumbs/' + old_img;
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

            usuarios.findByPk(id).then(user => {
                console.log(id);
                user.update(user_profile_image).then(() => {
                    var newPath = './server/uploads/usuarios/' + file_name;
                    var thumbPath = './server/uploads/usuarios/thumbs';
                    console.log(thumbPath);
                    thumb({
                        source: path.resolve(newPath),
                        destination: path.resolve(thumbPath),
                        width: 200,
                        suffix: ''
                    }).then(() => {
                        console.log("Se esta enviando el usuario");
                        res.status(200).send({ usuarios });
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
        var img_path = './server/uploads/usuarios/' + image;
    } else if (thumb == "true") {
        var img_path = './server/uploads/usuarios/thumbs/' + image;
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
    getUserProfileImage
};