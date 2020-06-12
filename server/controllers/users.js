/*jshint esversion: 6 */
var config = require('../config/config');
// Models
const bookmarks_model = require('../models').bookmarks;
const invitations_model = require('../models').invitations;
const users_model = require('../models').users;
const novels_model = require('../models').novels;
const novels_collaborators_model = require('../models').novels_collaborators;
const novels_ratings_model = require('../models').novels_ratings;
const chapters_model = require('../models').chapters;
const forum_posts_model = require('../models').forum_posts;
const posts_comments_model = require('../models').posts_comments;
const forum_categories_model = require('../models').forum_categories;
const genres_model = require('../models').genres;
const volumes_model = require('../models').volumes;
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
    users_model.create(body).then(user => {
        const activation_user_key = cryptr.encrypt(user.user_verification_key);
        res.status(201).send({ activation_user_key }); // Aqui debe ir NodeMailer enviando la clave a traves de una URL
    }).catch(err => {
        res.status(500).send({ message: 'Error en el registro del usuario.<br>' + err.message });
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
            return res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' + err });
        });
}

function getUserNovels(req, res) {
    const id = req.user.id;
    novels_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n WHERE n.nvl_author = ?', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            novels_collaborators_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n, novels_collaborators nc WHERE nc.user_id = ? AND nc.novel_id = n.id', { replacements: [id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
                .then(collaborations => {
                    return res.status(200).send({ novels, collaborations });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
                });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function activateUser(req, res) {
    const key = req.params.key;
    const decryptedkey = cryptr.decrypt(key);
    console.log(decryptedkey);
    users_model.findOne({
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
    if (body.user_pass) {
        return res.status(401).send({ message: 'Operación no permitida' });
    }
    users_model.findByPk(body.id).then(user => {
        if (user.id === req.user.id) {
            user.update({
                user_description: body.user_description
            }).then(() => {
                res.status(200).send({ message: '¡Cambios guardados con exito!' });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }

    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el usuario ' + err });
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
                    res.status(500).send({ message: 'Error al actualizar la key de administrador ' + err });
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
    console.log("Usuario deslogeado " + req.user.user_login);
    req.logOut();
    req.session.destroy();
    res.clearCookie('sessionId');
    res.status(200).send({ message: 'sesion finalizada' });
}

function passwordResetRequest(req, res) {
    users_model.findOne({
        where: {
            user_email: req.body.user_email,
        }
    }).then(user => {
        if (user) {
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
        } else {
            res.status(404).send({ message: 'No existe usuario registrado con el correo electronico especificado' });
        }
    }).catch(err => {
        res.status(500).send({ message: 'Error inesperado al cargar el usuario' });
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

function passwordResetAccess(req, res) {
    res.status(200).send({ message: 'Acceso otorgado' });
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
                                console.log('imagen de usuario eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de usuario inexistente.');
                    }
                });
                fs.exists(old_file_thumb_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_thumb_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar el thumb antiguo.' + err });
                            } else {
                                console.log('thumb de usuario eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de usuario inexistente.');
                    }
                });
            }
            const user_profile_image = {};
            user_profile_image.user_profile_image = file_name;

            users_model.findByPk(id).then(user => {
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
    bookmarks_model.create(body).then(bookmark => {
        return res.status(200).send({ bookmark });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al agregar la novela a la lista de lectura' + err });
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
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela de la lista de lectura' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el marca libro' });
    });
}

function updateUserbookmark(req, res) {
    const body = req.body;
    bookmarks_model.findByPk(body.id).then(bookmark => {
        if (req.user.id === bookmark.user_id) {
            console.log(body.bkm_chapter);
            bookmark.update({
                bkm_chapter: body.bkm_chapter
            }).then(() => {
                return res.status(200).send({ bookmark });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el marcapaginas' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el marcapaginas' });
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
                        }
                    } else {
                        return res.status(500).send({ message: 'Usuario debe ser Editor o Administrador' });
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

function getUserInvitations(req, res) {
    if (req.user) {
        invitations_model.sequelize.query('SELECT *, (SELECT user_login FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_login, (SELECT user_profile_image FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_user_image, (SELECT nvl_title FROM novels n WHERE n.id = i.invitation_novel) AS invitation_nvl_title FROM invitations i WHERE i.invitation_status = "Active" AND i.invitation_to_id = ?;', { replacements: [req.user.id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
            .then(invitations => {
                return res.status(200).send({ invitations });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
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
        return res.status(500).send({ message: 'Ocurrio un error al buscar la invitación ' + err });
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