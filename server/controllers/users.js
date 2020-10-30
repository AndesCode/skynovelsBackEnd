/*jshint esversion: 6 */
const config = require('../config/config');
// Models
const bookmarks_model = require('../models').bookmarks;
const invitations_model = require('../models').invitations;
const users_model = require('../models').users;
const novels_model = require('../models').novels;
const novels_collaborators_model = require('../models').novels_collaborators;
const chapters_model = require('../models').chapters;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// Encrypters
const bcrypt = require('bcrypt');
const saltRounds = 10;
const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.key);
// Json web tokens
const jwt = require('../services/jwt');
// More requires
const nodemailer = require("nodemailer");
const atob = require('atob');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const path = require('path');
const passport = require('passport');
const hbs = require('nodemailer-express-handlebars');

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mayra71@ethereal.email',
        pass: 'numBwzhaPczEE6HjcJ'
    }
});

transporter.use('compile', hbs({
    viewEngine: 'express-handlebars',
    viewPath: './views/'
}));

function createUser(req, res) {
    const body = req.body;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,"'#{}()¡¿])[A-Za-z\d@$!%*?&.,"'#{}()¡¿]{8,16}$/.test(body.user_pass)) {
        return res.status(400).send({ message: 'La contraseña no cumple con el parametro regex' });
    }
    console.log(body);
    users_model.create(body).then(user => {
        console.log(user.user_verification_key);
        const activation_user_key = cryptr.encrypt(user.user_verification_key);
        console.log(activation_user_key);
        const mailOptions = {
            from: 'lucas.kessler13@ethereal.email',
            to: req.body.user_email,
            subject: 'Skynovels: Confirmación de registro',
            text: 'haz click en el enalce para activar reiniciar tu contraseña de Skynovels! http://localhost:4200/activacion-de-usuario/' + activation_user_key,
            context: {
                token: 'http://localhost:4200/activacion-de-usuario/' + activation_user_key,
                user: user.user_login
            },
            template: 'createUser'
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                return res.status(500).send({ message: 'Error al enviar el correo' });
            } else {
                console.log('Email enviado');
                return res.status(201).send({ message: 'Usuario creado con exito' });
            }
        });

    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error en el registro de usuario' });
        }
    });
}

function getUser(req, res) {
    const id = req.params.id;
    users_model.sequelize.query('SELECT u.id, u.user_login, u.user_email, u.user_rol, u.user_description, u.user_profile_image, u.createdAt, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("genres", (IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON))), "id", n.id, "nvl_title", n.nvl_title, "nvl_author", n.nvl_author, "nvl_content", n.nvl_content, "nvl_acronym", n.nvl_acronym, "nvl_status", n.nvl_status, "chapters", (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id), "nvl_last_update", (SELECT (SELECT createdAt FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1), "nvl_publication_date", n.nvl_publication_date, "nvl_name", n.nvl_name, "nvl_img", n.nvl_img, "createdAt", n.createdAt, "updatedAt", n.updatedAt, "nvl_rating", (SELECT AVG(rate_value) FROM novels_ratings WHERE novel_id = n.id))), "]"), JSON) FROM novels n WHERE n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v WHERE v.nvl_id = n.id AND (SELECT id FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g WHERE g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND n.nvl_author = u.id), CONVERT(CONCAT("[]"), JSON)) AS novels, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("genres", (IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON))), "id", n.id, "nvl_title", n.nvl_title, "nvl_author", n.nvl_author, "nvl_content", n.nvl_content, "nvl_acronym", n.nvl_acronym, "nvl_status", n.nvl_status, "chapters", (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), "nvl_last_update", (SELECT (SELECT createdAt FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1), "nvl_publication_date", n.nvl_publication_date, "nvl_name", n.nvl_name, "nvl_img", n.nvl_img, "createdAt", n.createdAt, "updatedAt", n.updatedAt, "nvl_rating", (SELECT AVG(rate_value) FROM novels_ratings WHERE novel_id = n.id))), "]"), JSON) FROM novels n, novels_collaborators nc WHERE n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v WHERE v.nvl_id = n.id AND (SELECT id FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g WHERE g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND nc.novel_id = n.id AND nc.user_id = u.id), CONVERT(CONCAT("[]"), JSON)) AS collaborations, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_title", c.chp_title)), "]"), JSON) FROM chapters c WHERE c.chp_author = u.id AND c.chp_status = "Active"), CONVERT(CONCAT("[]"), JSON)) AS chapters, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", nr.id, "novel_id", nr.novel_id, "novel_id", nr.novel_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "novel", (SELECT n.nvl_title  FROM novels n WHERE n.id = nr.novel_id))), "]"), JSON) FROM novels_ratings nr WHERE nr.user_id = u.id), CONVERT(CONCAT("[]"), JSON)) AS novels_ratings FROM users u WHERE u.id = ?', { replacements: [id], type: users_model.sequelize.QueryTypes.SELECT })
        .then(user => {
            if (user.length > 0) {
                if (req.user && user[0].id === req.user.id) {
                    const self_user = true;
                    return res.status(200).send({ user, self_user });
                } else {
                    return res.status(200).send({ user });
                }
            } else {
                return res.status(404).send({ message: 'No se encuentra ningún usuario' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar el usuario' + err });
        });
}

function getUserNovels(req, res) {
    const id = req.user.id;
    novels_model.sequelize.query('SELECT n.*, (SELECT createdAt FROM chapters c where c.nvl_id = n.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS genres FROM novels n WHERE n.nvl_author = ?', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            novels_collaborators_model.sequelize.query('SELECT n.*, (SELECT createdAt FROM chapters c where c.nvl_id = n.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS genres FROM novels n, novels_collaborators nc WHERE nc.novel_id = n.id AND nc.user_id = ?', { replacements: [id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
                .then(collaborations => {
                    return res.status(200).send({ novels, collaborations });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas ' + err });
                });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas ' + err });
        });
}

/*
function getUserNovels(req, res) {
    const id = req.user.id;
    novels_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS genres FROM novels n WHERE n.nvl_author = ?', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            novels_collaborators_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS genres FROM  novels n, novels_collaborators nc WHERE nc.user_id = ? AND nc.novel_id = n.id', { replacements: [id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
                .then(collaborations => {
                    return res.status(200).send({ novels, collaborations });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas' });
                });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas' });
        });
}
*/

function activateUser(req, res) {
    const decryptedkey = cryptr.decrypt(req.body.key);
    console.log(decryptedkey);
    users_model.findOne({
        where: {
            user_verification_key: decryptedkey
        }
    }).then(user => {
        const new_user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.update({
            user_status: 'Active',
            user_verification_key: new_user_verification_key
        }).then(() => {
            const userLogin = user.user_login;
            return res.status(200).send({ user_login: userLogin });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio algún error durante la activación del usuario' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio algún error durante la activación del usuario' });
    });
}

function updateUser(req, res) {
    const body = req.body;
    if (body.user_pass) {
        return res.status(401).send({ message: 'Operación no permitida' });
    }
    users_model.findByPk(body.id).then(user => {
        if (user.id === req.user.id) {
            user.update({
                user_description: body.user_description
            }).then(() => {
                return res.status(200).send({ message: '¡Cambios guardados con exito!' });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario ' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }

    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' });
    });
}

function login(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return res.status(500).send({ 'status': 'err', 'message': err.message }); }
        if (!user) {
            return res.status(500).send({ 'status': 'fail', 'message': info.message });
        } else {
            if (user.user_rol === 'Admin' || user.user_rol === 'Editor') {
                const token_data = jwt.createAdminToken(user);
                user.update({ user_verification_key: token_data.key }).then(user => {
                    req.logIn(user, function(err) {
                        if (err) { return res.status(500).send({ 'status': 'err', 'message': err.message }); }
                    });
                    return res.status(200).send({
                        sknvl_s: token_data.token
                    });
                }).catch(err => {
                    return res.status(500).send({ message: 'Error al actualizar la key de administrador' });
                });
            } else {
                let sToken;
                if (user.user_rol === 'Editor') {
                    sToken = jwt.createEditorToken(user);
                } else {
                    sToken = jwt.createSessionToken(user);
                }
                req.logIn(user, function(err) {
                    if (err) { return res.status(500).send({ 'status': 'err', 'message': err.message }); }
                });
                return res.send({
                    sknvl_s: sToken
                });
            }
        }

    })(req, res, next);
}

function logout(req, res) {
    req.logOut();
    req.session.destroy();
    res.clearCookie('sessionId');
    return res.status(200).send({ message: 'Sesion finalizada' });
}

function passwordResetRequest(req, res) {
    console.log(req.body.user_email);
    users_model.findOne({
        where: {
            user_email: req.body.user_email,
        }
    }).then(user => {
        if (user) {
            const token_data = jwt.createPasswordRecoveryToken(user);
            user.update({
                user_verification_key: token_data.key
            }).then(() => {
                const mailOptions = {
                    from: 'lucas.kessler13@ethereal.email',
                    to: req.body.user_email,
                    subject: 'Skynovels: Restablecer contraseña',
                    text: 'haz click en el enalce para activar reiniciar tu contraseña de Skynovels! http://localhost:4200/nueva-contraseña/' + token_data.token,
                    context: {
                        token: 'http://localhost:4200/nueva-contraseña/' + token_data.token,
                        user: user.user_login
                    },
                    template: 'passwordResetRequest'
                };

                transporter.sendMail(mailOptions, function(err, data) {
                    if (err) {
                        return res.status(500).send({ message: 'Error al enviar el correo ' + err });
                    } else {
                        console.log('Email enviado');
                        return res.status(200).send({ message: 'Email enviado con exito' });
                    }
                });
            }).catch(err => {
                return res.status(500).send({ message: 'Error al actualizar la clave de usuario' });
            });
        } else {
            return res.status(404).send({ message: 'No existe usuario registrado con el correo electronico especificado' });
        }
    }).catch(err => {
        if (err.message.includes('Invalid value')) {
            return res.status(404).send({ message: 'No existe usuario registrado con el correo electronico especificado' });
        } else {
            return res.status(500).send({ message: 'Ocurrio algún error al enviar el correo, intentelo de nuevo' });
        }
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
    users_model.findByPk(id).then(user => {
        if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,"'#{}()¡¿])[A-Za-z\d@$!%*?&.,"'#{}()¡¿]{8,16}$/.test(body.user_pass)) {
            const salt = bcrypt.genSaltSync(saltRounds);
            body.user_pass = bcrypt.hashSync(body.user_pass, salt);
            body.user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            user.update({
                user_pass: body.user_pass,
                user_verification_key: body.user_verification_key
            }).then(() => {
                return res.status(200).send({ message: '¡Contraseña actualizada con exito!' });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la contraseña ' });
            });
        } else {
            return res.status(400).send({ message: 'La contraseña no cumple con el parametro regex' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar el usuario ' });
    });
}

function passwordResetAccess(req, res) {
    return res.status(200).send({ message: 'Acceso otorgado' });
}

function uploadUserProfileImg(req, res) {
    const id = req.params.id;
    if (req.files) {
        const file_path = req.files.user_profile_image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[3];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];
        if (file_ext.toUpperCase() === 'JPG' || file_ext.toUpperCase() === 'JPEG') {
            if (req.body.old_user_profile_image) {
                const old_img = req.body.old_user_profile_image;
                old_file_path = './server/uploads/users/' + old_img;
                old_file_thumb_path = './server/uploads/users/thumbs/' + old_img;
                fs.exists(old_file_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua' });
                            }
                        });
                    }
                });
                fs.exists(old_file_thumb_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_thumb_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al eliminar el thumb antiguo' });
                            }
                        });
                    }
                });
            }
            const user_profile_image = {};
            user_profile_image.user_profile_image = file_name;
            users_model.findByPk(id).then(user => {
                if (user.id === req.user.id) {
                    user.update(user_profile_image).then(() => {
                        const newPath = './server/uploads/users/' + file_name;
                        const thumbPath = './server/uploads/users/thumbs/' + file_name;
                        const options = { width: 210, height: 280 };
                        imageThumbnail(path.resolve(newPath), options)
                            .then(thumbnail => {
                                const buf = new Buffer(thumbnail, 'buffer');
                                fs.writeFile(thumbPath, buf, function(err) {
                                    if (err) {
                                        fs.unlink(file_path, (error) => {
                                            if (error) {
                                                return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                                            }
                                        });
                                    }
                                });
                                return res.status(200).send({ image: user.user_profile_image });
                            }).catch(err => {
                                fs.unlink(file_path, (err) => {
                                    if (err) {
                                        return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                                    }
                                });
                                return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail. ' });
                            });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                            }
                        });
                        return res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario.' });
                    });
                } else {
                    return res.status(401).send({ message: 'No autorizado' });
                }
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                    }
                });
                return res.status(500).send({ message: 'No existe el usuario.' });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                }
            });
            return res.status(400).send({ message: 'La extensión del archivo no es valida.' });
        }
    } else {
        return res.status(400).send({ message: 'Debe Seleccionar un usuario.' });
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
            return res.sendFile(path.resolve(img_path));
        } else {
            return res.status(404).send({
                message: "No se encuentra la imagen del usuario"
            });
        }
    });
}

function getUserBookmarks(req, res) {
    const uid = req.user.id;
    novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active") AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS genres FROM novels n, bookmarks b WHERE b.nvl_id = n.id AND b.user_id = ? AND n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL', { replacements: [uid], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            return res.status(200).send({ novels });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas' });
        });
}

function createUserbookmark(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_model.findOne({
        where: {
            id: body.nvl_id,
            nvl_status: 'Active'
        },
        attributes: ['id', 'nvl_status']
    }).then(novel => {
        if (novel) {
            if (body.chp_id !== null) {
                chapters_model.findOne({
                    where: {
                        id: body.chp_id,
                        chp_status: 'Active',
                    },
                    attributes: ['id', 'chp_status']
                }).then(chapter => {
                    if (chapter) {
                        bookmarks_model.create(body).then(bookmark => {
                            return res.status(201).send({ bookmark });
                        }).catch(err => {
                            if (err && err.errors && err.errors[0].message) {
                                return res.status(400).send({ message: err.errors[0].message });
                            } else {
                                return res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' });
                            }
                        });
                    } else {
                        return res.status(404).send({ message: 'El capitulo no existe o no esta activo' });
                    }
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
                });
            } else {
                bookmarks_model.create(body).then(bookmark => {
                    return res.status(201).send({ bookmark });
                }).catch(err => {
                    if (err && err.errors && err.errors[0].message) {
                        return res.status(400).send({ message: err.errors[0].message });
                    } else {
                        return res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' });
                    }
                });
            }
        } else {
            return res.status(404).send({ message: 'La novela no existe o no esta activa' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function updateUserbookmark(req, res) {
    const body = req.body;
    bookmarks_model.findByPk(body.id).then(bookmark => {
        if (req.user.id === bookmark.user_id) {
            chapters_model.findOne({
                where: {
                    id: body.chp_id,
                    chp_status: 'Active',
                },
                attributes: ['id', 'chp_status']
            }).then(chapter => {
                if (chapter) {
                    bookmark.update({
                        chp_id: body.chp_id
                    }).then(() => {
                        return res.status(200).send({ bookmark });
                    }).catch(err => {
                        if (err && err.errors && err.errors[0].message) {
                            return res.status(400).send({ message: err.errors[0].message });
                        } else {
                            return res.status(500).send({ message: 'Ocurrio un error al actualizar el marca-paginas' });
                        }
                    });
                } else {
                    return res.status(404).send({ message: 'El capitulo no existe o no esta activo' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el marca-paginas' });
    });
}

function removeUserbookmark(req, res) {
    const id = req.params.id;
    bookmarks_model.findByPk(id).then(bookmark => {
        if (req.user.id === bookmark.user_id) {
            bookmark.destroy({
                where: {
                    id: id
                }
            }).then(bookmark => {
                return res.status(200).send({ bookmark });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela de la lista de lectura' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el marca libro' });
    });
}

function createUserInvitation(req, res) {
    const body = req.body;
    novels_model.findOne({
        include: [{
            model: users_model,
            as: 'collaborators',
            attributes: ['id', 'user_login'],
            through: { attributes: [] },
        }],
        where: {
            nvl_author: req.user.id,
            id: req.body.invitation_novel
        },
        attributes: ['id']
    }).then(novel => {
        if (novel) {
            users_model.findOne({
                where: {
                    user_status: 'Active',
                    [Op.or]: [
                        { user_login: body.user_login },
                        { user_email: body.user_login }
                    ]
                },
                attributes: ['id', 'user_login', 'user_rol']
            }).then(user => {
                if (user !== null) {
                    if (user.user_rol === 'Admin' || user.user_rol === 'Editor') {
                        const collaborators = novel.collaborators.map(collaborator => collaborator.id);
                        if (collaborators.includes(user.id)) {
                            return res.status(500).send({ message: 'El usuario ya es colaborador de la novela' });
                        } else {
                            if (user.id !== req.user.id) {
                                invitations_model.findOne({
                                    where: {
                                        invitation_to_id: user.id,
                                        invitation_novel: body.invitation_novel
                                    }
                                }).then(invitation => {
                                    if (invitation === null) {
                                        invitations_model.create({
                                            invitation_from_id: req.user.id,
                                            invitation_to_id: user.id,
                                            invitation_novel: body.invitation_novel
                                        }).then(invitation => {
                                            return res.status(201).send({ invitation });
                                        }).catch(err => {
                                            return res.status(500).send({ message: 'Ocurrio un error al crear la invitación del usuario' });
                                        });
                                    } else {
                                        return res.status(400).send({ message: 'Ya has invitado al usuario' });
                                    }
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error al buscar la invitación' });
                                });
                            } else {
                                return res.status(400).send({ message: '¡No te puedes invitar a ti mismo!' });
                            }
                        }
                    } else {
                        return res.status(400).send({ message: 'Usuario debe ser Editor o Administrador' });
                    }
                } else {
                    return res.status(400).send({ message: 'No se encuentra ningún usuario por ese nombre' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ha ocurrido algún error durante la carga del usuario' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    });
}

function getUserInvitations(req, res) {
    if (req.user) {
        invitations_model.sequelize.query('SELECT *, (SELECT user_login FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_login, (SELECT user_profile_image FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_user_image, (SELECT nvl_title FROM novels n WHERE n.id = i.invitation_novel) AS invitation_nvl_title FROM invitations i WHERE i.invitation_status = "Active" AND i.invitation_to_id = ?;', { replacements: [req.user.id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
            .then(invitations => {
                return res.status(200).send({ invitations });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' });
            });
    } else {
        return res.status(401).send({ message: 'No autorizado' });
    }

}

function updateUserInvitation(req, res) {
    const body = req.body;
    invitations_model.findByPk(body.id).then(invitation => {
        if (req.user.id === invitation.invitation_to_id) {
            if (body.invitation_status === 'Confirmed') {
                novels_collaborators_model.create({
                    novel_id: invitation.invitation_novel,
                    user_id: req.user.id
                }).then(() => {
                    invitations_model.destroy({
                        where: {
                            id: invitation.id
                        }
                    }).then(() => {
                        return res.status(200).send({ invitation });
                    });
                });
            } else {
                invitations_model.destroy({
                    where: {
                        id: invitation.id
                    }
                }).then(() => {
                    return res.status(200).send({ invitation });
                });
            }
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la invitación ' });
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
    getUser,
    getUserNovels,
    // Passwords
    passwordResetRequest,
    updateUserPassword,
    passwordResetAccess,
    // Imgs
    getUserProfileImage,
    uploadUserProfileImg,
    // Bookmarks
    getUserBookmarks,
    createUserbookmark,
    removeUserbookmark,
    updateUserbookmark,
    // Invitations
    getUserInvitations,
    createUserInvitation,
    updateUserInvitation,
};