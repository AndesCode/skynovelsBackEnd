/*jshint esversion: 6 */
require('dotenv').config();
// Models
const bookmarks_model = require('../models').bookmarks;
const invitations_model = require('../models').invitations;
const users_model = require('../models').users;
const novels_model = require('../models').novels;
const novels_collaborators_model = require('../models').novels_collaborators;
const chapters_model = require('../models').chapters;
const notifications_model = require('../models').notifications;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// Encrypters
const bcrypt = require('bcrypt');
const saltRounds = 10;
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.cryptrKey);
// Json web tokens
const jwt = require('../services/jwt');
// More requires
const nodemailer = require("nodemailer");
const atob = require('atob');
const passport = require('passport');
const hbs = require('nodemailer-express-handlebars');
const mariadbHelper = require('../services/mariadbHelper');
const applicationURL = process.env.NODE_ENV === 'production' ? 'https://www.skynovels.net' : 'http://localhost:4200';
const imageService = require('../services/imageService');

const noReplyFromUser = process.env.noReplyFromUser;
const noReplyEmailUser = process.env.noReplyEmailUser;
const noReplyEmailPass = process.env.noReplyEmailPass;

const transporter = nodemailer.createTransport({
    host: 'mail.skynovels.net',
    port: 465,
    auth: {
        user: noReplyEmailUser,
        pass: noReplyEmailPass
    }
});

transporter.use('compile', hbs({
    viewEngine: 'express-handlebars',
    viewPath: './views/'
}));

function createUser(req, res) {
    const body = req.body;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$_\-!%*?&.,"'#{}()¡¿])[A-Za-z\d@$_\-!%*?&.,"'#{}()¡¿]{8,16}$/.test(body.user_pass)) {
        return res.status(400).send({ message: 'La contraseña no cumple con el parametro regex' });
    }
    users_model.create(body).then(user => {
        const activation_user_key = cryptr.encrypt(user.user_verification_key);
        const mailOptions = {
            from: noReplyEmailUser,
            to: req.body.user_email,
            subject: 'Skynovels: Confirmación de registro',
            text: 'haz click en el enlace para activar tu cuenta de Skynovels! ' + applicationURL + '/activacion-de-usuario/' + activation_user_key,
            context: {
                token: applicationURL + '/activacion-de-usuario/' + activation_user_key,
                user: user.user_login,
                year: new Date().getFullYear()
            },
            template: 'createUser'
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                return res.status(500).send({ message: 'Error al enviar el correo' });
            } else {
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
    users_model.sequelize.query('SELECT u.id, u.user_login, u.user_email, u.user_rol, u.user_description, u.image, u.createdAt, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("nvl_chapters", (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), "genres", (IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY())), "id", n.id, "nvl_title", n.nvl_title, "nvl_author", n.nvl_author, "nvl_content", n.nvl_content, "nvl_acronym", n.nvl_acronym, "nvl_status", n.nvl_status, "nvl_last_update", (SELECT createdAt FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1), "nvl_publication_date", n.nvl_publication_date, "nvl_name", n.nvl_name, "image", n.image, "createdAt", n.createdAt, "updatedAt", n.updatedAt)) FROM novels n WHERE n.nvl_status IN ("Active", "Finished") AND n.nvl_author = u.id), JSON_ARRAY()) AS novels, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("nvl_chapters", (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), "genres", (IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY())), "id", n.id, "nvl_title", n.nvl_title, "nvl_author", n.nvl_author, "nvl_content", n.nvl_content, "nvl_acronym", n.nvl_acronym, "nvl_status", n.nvl_status, "nvl_last_update", (SELECT createdAt FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1), "nvl_publication_date", n.nvl_publication_date, "nvl_name", n.nvl_name, "image", n.image, "createdAt", n.createdAt, "updatedAt", n.updatedAt)) FROM novels n, novels_collaborators nc WHERE n.nvl_status IN ("Active", "Finished") AND nc.novel_id = n.id AND nc.user_id = u.id), JSON_ARRAY()) AS collaborations, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_title", c.chp_title)) FROM chapters c WHERE c.chp_author = u.id AND c.chp_status = "Active"), JSON_ARRAY()) AS chapters, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", nr.id, "novel_id", nr.novel_id, "novel_id", nr.novel_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "novel", (SELECT n.nvl_title  FROM novels n WHERE n.id = nr.novel_id))) FROM novels_ratings nr WHERE nr.user_id = u.id), JSON_ARRAY()) AS novels_ratings FROM users u WHERE u.id = ?', { replacements: [id], type: users_model.sequelize.QueryTypes.SELECT })
        .then(user => {
            user = mariadbHelper.verifyJSON(user, ['novels', 'collaborations', 'chapters', 'novels_ratings']);
            user[0].novels = mariadbHelper.verifyJSON(user[0].novels, ['genres']);
            user[0].collaborations = mariadbHelper.verifyJSON(user[0].collaborations, ['genres']);
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
    novels_model.sequelize.query('SELECT n.*, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id WHERE n.nvl_author = ? GROUP BY n.id', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            novels = mariadbHelper.verifyJSON(novels, ['genres']);
            novels_collaborators_model.sequelize.query('SELECT n.*, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels_collaborators nc, novels n left JOIN chapters c ON c.nvl_id = n.id WHERE nc.novel_id = n.id AND nc.user_id = ? GROUP BY n.id', { replacements: [id], type: novels_collaborators_model.sequelize.QueryTypes.SELECT })
                .then(collaborations => {
                    collaborations = mariadbHelper.verifyJSON(collaborations, ['genres']);
                    return res.status(200).send({ novels, collaborations });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas ' + err });
                });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas ' + err });
        });
}



function activateUser(req, res) {
    const key = req.body.key;
    const new_user_verification_key = String(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    const decryptedkey = String(cryptr.decrypt(key));
    users_model.sequelize.query('SELECT id FROM users WHERE user_verification_key = ? AND user_status = "Disabled"', { replacements: [decryptedkey], type: users_model.sequelize.QueryTypes.SELECT })
        .then(disabledUser => {
            if (disabledUser.length > 0) {
                users_model.findByPk(disabledUser[0].id).then(user => {
                    user.update({
                        user_status: 'Active',
                        user_verification_key: new_user_verification_key
                    }).then(() => {
                        return res.status(200).send({ user_login: user.user_login });
                    }).catch(err => {
                        return res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario' });
                    });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio algún error durante la activación del usuario' });
                });
            } else {
                return res.status(500).send({ message: 'No se encuentra el usuario a activar' });
            }
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
                let token_data;
                if (user.user_rol === 'Admin') {
                    token_data = jwt.createAdminToken(user);
                } else {
                    token_data = jwt.createEditorToken(user);
                }
                user.update({ user_verification_key: token_data.key }).then(user => {
                    req.logIn(user, function(err) {
                        if (err) { return res.status(500).send({ 'status': 'err', 'message': err.message }); }
                    });
                    return res.status(200).send({
                        sknvl_s: [token_data.token.slice(0, 46), 'S', token_data.token.slice(46)].join('')
                    });
                }).catch(err => {
                    return res.status(500).send({ message: 'Error al actualizar la key de administrador' });
                });
            } else {
                const sToken = jwt.createSessionToken(user);
                req.logIn(user, function(err) {
                    if (err) { return res.status(500).send({ 'status': 'err', 'message': err.message }); }
                });
                return res.send({
                    sknvl_s: [sToken.slice(0, 46), 'S', sToken.slice(46)].join('')
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
    users_model.findOne({
        where: {
            user_email: req.body.user_email,
            user_status: 'Active',
        }
    }).then(user => {
        if (user) {
            const token_data = jwt.createPasswordRecoveryToken(user);
            user.update({
                user_verification_key: token_data.key
            }).then(() => {
                const mailOptions = {
                    from: noReplyEmailUser,
                    to: req.body.user_email,
                    subject: 'Skynovels: Restablecer contraseña',
                    text: 'haz click en el enlace para reiniciar tu contraseña de Skynovels! ' + applicationURL + '/nueva-contrasena/' + token_data.token,
                    context: {
                        token: applicationURL + '/nueva-contrasena/' + token_data.token,
                        user: user.user_login,
                        year: new Date().getFullYear()
                    },
                    template: 'passwordResetRequest'
                };
                transporter.sendMail(mailOptions, function(err, data) {
                    if (err) {
                        return res.status(500).send({ message: 'Error al enviar el correo ' + err });
                    } else {
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
        if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$_\-!%*?&.,"'#{}()¡¿])[A-Za-z\d@$_\-!%*?&.,"'#{}()¡¿]{8,16}$/.test(body.user_pass)) {
            const salt = bcrypt.genSaltSync(saltRounds);
            body.user_pass = bcrypt.hashSync(body.user_pass, salt);
            body.user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            user.update({
                user_pass: body.user_pass,
                user_verification_key: body.user_verification_key
            }).then(() => {
                return res.status(200).send({ message: '¡Contraseña actualizada con exito!' });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la contraseña' });
            });
        } else {
            return res.status(400).send({ message: 'La contraseña no cumple las normas de contraseña' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar el usuario' });
    });
}

function passwordResetAccess(req, res) {
    return res.status(200).send({ message: 'Acceso otorgado' });
}

function uploadUserProfileImg(req, res) {
    const id = req.params.id;
    users_model.findByPk(id).then(user => {
        if (user.id === req.user.id && req.files) {
            imageService.uploadImage(user, 'users', req.files).then((image) => {
                const sToken = jwt.createSessionToken(user);
                return res.send({
                    sknvl_s: [sToken.slice(0, 46), 'S', sToken.slice(46)].join(''),
                    image: image
                });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al subir la imagen' + err.error });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'No existe el usuario.' + err });
    });
}

function getUserBookmarks(req, res) {
    const uid = req.user.id;
    novels_model.sequelize.query('SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((select AVG(nr.rate_value) from novels_ratings nr where nr.novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM bookmarks b, novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.nvl_status IN ("Active", "Finished") AND b.nvl_id = n.id AND b.user_id = ? GROUP BY n.id;', { replacements: [uid], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(ActiveNovels => {
            ActiveNovels = mariadbHelper.verifyJSON(ActiveNovels, ['genres']);
            const novels = [];
            for (const novel of ActiveNovels) {
                if (novel.nvl_chapters > 0 && novel.genres.length > 0) {
                    novels.push(novel);
                }
            }
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
            [Op.or]: [
                { nvl_status: 'Active' },
                { nvl_status: 'Finished' }
            ]
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
                    return res.status(404).send({ message: 'No se encuentra ningún usuario por ese nombre' });
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
        invitations_model.sequelize.query('SELECT *, (SELECT user_login FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_login, (SELECT image FROM users u WHERE u.id = i.invitation_from_id) AS invitation_from_user_image, (SELECT nvl_title FROM novels n WHERE n.id = i.invitation_novel) AS invitation_nvl_title FROM invitations i WHERE i.invitation_status = "Active" AND i.invitation_to_id = ?;', { replacements: [req.user.id], type: invitations_model.sequelize.QueryTypes.SELECT })
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
                novels_collaborators_model.findOne({
                    where: {
                        [Op.and]: [
                            { novel_id: invitation.invitation_novel },
                            { user_id: req.user.id }
                        ]
                    }
                }).then((novel_collaborator) => {
                    if (novel_collaborator) {
                        invitations_model.destroy({
                            where: {
                                id: invitation.id
                            }
                        }).then(() => {
                            return res.status(200).send({ invitation });
                        });
                    } else {
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
                    }
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar la invitación ' });
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

function getUserNotifications(req, res) {
    notifications_model.sequelize.query(
            `SELECT n.*, 
            (SELECT JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = l.user_id), "image", (SELECT image FROM users u WHERE u.id = l.user_id), "adv_id", l.adv_id, "adv_title", (SELECT adv_title FROM advertisements adv WHERE adv.id = l.adv_id), "adv_name", (SELECT adv_name FROM advertisements adv WHERE adv.id = l.adv_id), "novel_rating_id", l.novel_rating_id, "rate_comment", (SELECT rate_comment FROM novels_ratings nr WHERE nr.id = l.novel_rating_id), "novel_id", (SELECT novel_id FROM novels_ratings nr WHERE nr.id = l.novel_rating_id), "nvl_name", ( SELECT nvl_name FROM novels nov left join novels_ratings nr on nr.novel_id = nov.id WHERE nr.id = l.novel_rating_id LIMIT 1), "comment_id", l.comment_id,  "comment", (SELECT JSON_OBJECT("id", c.id, "user_id", c.user_id, "chp_id", c.chp_id, "adv_id", c.adv_id, "comment_content", c.comment_content, "adv_name", (SELECT adv_name FROM advertisements adv WHERE adv.id = c.adv_id), "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = c.chp_id), "nvl_id", (SELECT nvl_id FROM chapters ch WHERE ch.id = c.chp_id), "nvl_name", (SELECT nvl_name FROM novels nov LEFT JOIN chapters ch on ch.nvl_id = nov.id WHERE ch.id = c.chp_id LIMIT 1)) FROM comments c WHERE c.id = l.comment_id), "comment_content", (SELECT comment_content FROM comments c WHERE c.id = l.comment_id), "reply_id", l.reply_id, "reply_content", (SELECT reply_content FROM replys r WHERE r.id = l.reply_id), "reply", (SELECT JSON_OBJECT("id", r.id, "user_id", r.user_id, "comment_id", r.comment_id, "novel_rating_id", r.novel_rating_id, "reply_content", r.reply_content, "comment", (SELECT JSON_OBJECT("id", c.id, "user_id", c.user_id, "chp_id", c.chp_id, "adv_id", c.adv_id, "comment_content", c.comment_content, "adv_name", (SELECT adv_name FROM advertisements adv WHERE adv.id = c.adv_id), "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = c.chp_id), "nvl_id", (SELECT nvl_id FROM chapters ch WHERE ch.id = c.chp_id), "nvl_name", (SELECT nvl_name FROM novels nov LEFT JOIN chapters ch on ch.nvl_id = nov.id WHERE ch.id = c.chp_id LIMIT 1)) FROM comments c WHERE c.id = r.comment_id), "novel_rating", (SELECT JSON_OBJECT("id", nr.id, "user_id", nr.user_id, "rate_comment", nr.rate_comment, "rate_value", nr.rate_value, "novel_id", nr.novel_id, "nvl_title", (SELECT nvl_title FROM novels nvl WHERE nvl.id = nr.novel_id), "nvl_name", (SELECT nvl_name FROM novels nvl WHERE nvl.id = nr.novel_id)) FROM novels_ratings nr WHERE nr.id = r.novel_rating_id)) FROM replys r WHERE r.id = l.reply_id)) FROM likes l WHERE l.id = n.like_id) AS like_notification, 
            (SELECT JSON_OBJECT("id", c.id, "user_id", c.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = c.user_id), "image", (SELECT image FROM users u WHERE u.id = c.user_id), "comment_content", c.comment_content, "adv_id", c.adv_id, "adv_title", (SELECT adv_title FROM advertisements adv WHERE adv.id = c.adv_id), "adv_name", (SELECT adv_name FROM advertisements adv WHERE adv.id = c.adv_id), "chp_id", c.chp_id, "chp_title", (SELECT chp_title FROM chapters ch WHERE ch.id = c.chp_id), "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = c.chp_id), "nvl_id", (SELECT nvl_id FROM chapters ch WHERE ch.id = c.chp_id), "nvl_name", (SELECT nvl_name FROM novels nov LEFT JOIN chapters ch on ch.nvl_id = nov.id WHERE ch.id = c.chp_id LIMIT 1)) FROM comments c WHERE c.id = n.comment_id) AS comment_notification, 
            (SELECT JSON_OBJECT("id", r.id, "user_id", r.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = r.user_id), "image", (SELECT image FROM users u WHERE u.id = r.user_id), "reply_content", r.reply_content, "comment_id", r.comment_id, "comment", (SELECT JSON_OBJECT("id", c.id, "user_id", c.user_id, "chp_id", c.chp_id, "adv_id", c.adv_id, "comment_content", c.comment_content, "adv_name", (SELECT adv_name FROM advertisements adv WHERE adv.id = c.adv_id), "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = c.chp_id), "nvl_id", (SELECT nvl_id FROM chapters ch WHERE ch.id = c.chp_id), "nvl_name", (SELECT nvl_name FROM novels nov LEFT JOIN chapters ch on ch.nvl_id = nov.id WHERE ch.id = c.chp_id LIMIT 1)) FROM comments c WHERE c.id = r.comment_id), "comment_content", (SELECT comment_content FROM comments c WHERE c.id = r.comment_id), "novel_raintg_id", r.novel_rating_id, "rate_comment", (SELECT rate_comment FROM novels_ratings nr WHERE nr.id = r.novel_rating_id), "nvl_name", ( SELECT nvl_name FROM novels nov left join novels_ratings nr on nr.novel_id = nov.id WHERE nr.id = r.novel_rating_id LIMIT 1), "novel_id", ( SELECT nov.id FROM novels nov left join novels_ratings nr on nr.novel_id = nov.id WHERE nr.id = r.novel_rating_id LIMIT 1)) FROM replys r WHERE r.id = n.reply_id) AS reply_notification,   
            (SELECT JSON_OBJECT("id", nr.id, "user_id", nr.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = nr.user_id), "image", (SELECT image FROM users u WHERE u.id = nr.user_id), "rate_comment", nr.rate_comment, "rate_value", nr.rate_value, "novel_id", nr.novel_id, "nvl_title", (SELECT nvl_title FROM novels nvl WHERE nvl.id = nr.novel_id), "nvl_name", (SELECT nvl_name FROM novels nvl WHERE nvl.id = nr.novel_id)) FROM novels_ratings nr WHERE nr.id = n.novel_rating_id) AS novel_rating_notification
            FROM notifications n 
            WHERE 
            n.user_id = ? ORDER BY n.createdAt DESC LIMIT 10;`, { replacements: [req.user.id], type: notifications_model.sequelize.QueryTypes.SELECT })
        .then(notifications => {
            notifications = mariadbHelper.verifyJSON(notifications, ['like_notification', 'comment_notification', 'reply_notification', 'reply_notification', 'novel_rating_notification', 'advertisement_notification']);
            for (let notification of notifications) {
                if (notification.like_notification !== null) {
                    notification.type = 'like';
                    if (notification.like_notification.adv_id !== null) {
                        notification.message = `A ${notification.like_notification.user_login} le gusta el anuncio ´${notification.like_notification.adv_name}´`;
                        notification.url = `/noticias/${notification.like_notification.adv_id}/${notification.like_notification.adv_name}`;
                    }
                    if (notification.like_notification.novel_rating_id !== null) {
                        notification.message = `A ${notification.like_notification.user_login} le gusta tu calificación de novela ´${notification.like_notification.rate_comment}´`;
                        notification.url = `/novelas/${notification.like_notification.novel_id}/${notification.like_notification.nvl_name}`;
                    }
                    if (notification.like_notification.comment_id !== null) {
                        notification.like_notification.comment = JSON.parse(notification.like_notification.comment);
                        notification.message = `A ${notification.like_notification.user_login} le gusta tu comentario ´${notification.like_notification.comment_content}´`;
                        if (notification.like_notification.comment.adv_id !== null) {
                            notification.url = `/noticias/${notification.like_notification.comment.adv_id}/${notification.like_notification.comment.adv_name}`;
                        }
                        if (notification.like_notification.comment.chp_id !== null) {
                            notification.url = `/novelas/${notification.like_notification.comment.nvl_id}/${notification.like_notification.comment.nvl_name}/${notification.like_notification.comment.chp_id}/${notification.like_notification.comment.chp_name}`;
                        }
                    }
                    if (notification.like_notification.reply_id !== null) {
                        notification.like_notification.reply = JSON.parse(notification.like_notification.reply);
                        notification.message = `A ${notification.like_notification.user_login} le gusta tu respuesta ´${notification.like_notification.reply.reply_content}´`;
                        if (notification.like_notification.reply.comment_id !== null) {
                            notification.like_notification.reply.comment = JSON.parse(notification.like_notification.reply.comment);
                            if (notification.like_notification.reply.comment.adv_id !== null) {
                                notification.url = `/noticias/${notification.like_notification.reply.comment.adv_id}/${notification.like_notification.reply.comment.adv_name}`;
                            }
                            if (notification.like_notification.reply.comment.chp_id !== null) {
                                notification.url = `/novelas/${notification.like_notification.reply.comment.nvl_id}/${notification.like_notification.reply.comment.nvl_name}/${notification.like_notification.reply.comment.chp_id}/${notification.like_notification.reply.comment.chp_name}`;
                            }
                        }
                        if (notification.like_notification.reply.novel_rating_id !== null) {
                            notification.like_notification.reply.novel_rating = JSON.parse(notification.like_notification.reply.novel_rating);
                            notification.url = `/novelas/${notification.like_notification.reply.novel_rating.novel_id}/${notification.like_notification.reply.novel_rating.nvl_name}`;
                        }
                    }
                    notification.user_image = notification.like_notification.image;
                }
                if (notification.comment_notification !== null) {
                    notification.type = 'comment';
                    if (notification.comment_notification.adv_id !== null) {
                        notification.message = `${notification.comment_notification.user_login} ha comentado en el anuncio ´${notification.comment_notification.adv_title}´`;
                        notification.url = `/noticias/${notification.comment_notification.adv_id}/${notification.comment_notification.adv_name}`;
                    }
                    if (notification.comment_notification.chp_id !== null) {
                        notification.message = `${notification.comment_notification.user_login} ha comentado en el capítulo ´${notification.comment_notification.chp_title}´`;
                        notification.url = `/novelas/${notification.comment_notification.nvl_id}/${notification.comment_notification.nvl_name}/${notification.comment_notification.chp_id}/${notification.comment_notification.chp_name}`;
                    }
                    notification.user_image = notification.comment_notification.image;
                }
                if (notification.novel_rating_notification !== null) {
                    notification.type = 'novel_rating';
                    notification.message = `${notification.novel_rating_notification.user_login} ha calificado con ${notification.novel_rating_notification.rate_value} estrellas la novela ´${notification.novel_rating_notification.nvl_title}´`;
                    notification.user_image = notification.novel_rating_notification.image;
                    notification.url = `/novelas/${notification.novel_rating_notification.novel_id}/${notification.novel_rating_notification.nvl_name}`;
                }
                if (notification.reply_notification !== null) {
                    notification.type = 'reply';
                    if (notification.reply_notification.comment_id !== null) {
                        notification.reply_notification.comment = JSON.parse(notification.reply_notification.comment);
                        notification.message = `${notification.reply_notification.user_login} ha respondido sobre tu comentario ´${notification.reply_notification.comment_content}´`;
                        if (notification.reply_notification.comment.adv_id !== null) {
                            notification.url = `/noticias/${notification.reply_notification.comment.adv_id}/${notification.reply_notification.comment.adv_name}`;
                        }
                        if (notification.reply_notification.comment.chp_id !== null) {
                            notification.url = `/novelas/${notification.reply_notification.comment.nvl_id}/${notification.reply_notification.comment.nvl_name}/${notification.reply_notification.comment.chp_id}/${notification.reply_notification.comment.chp_name}`;
                        }
                    }
                    if (notification.reply_notification.novel_raintg_id !== null) {
                        notification.message = `${notification.reply_notification.user_login} ha respondido sobre tu calificación de novela ´${notification.reply_notification.rate_comment}´`;
                        notification.url = `/novelas/${notification.reply_notification.novel_id}/${notification.reply_notification.nvl_name}`;
                    }
                    notification.user_image = notification.reply_notification.image;
                }
            }
            notifications_model.update({
                readed: true
            }, {
                where: {
                    user_id: req.user.id
                }
            }).then(() => {
                notifications = notifications.map(x => {
                    const map = {
                        id: x.id,
                        user_id: x.user_id,
                        url: x.url,
                        user_image: x.user_image,
                        readed: x.readed,
                        type: x.type,
                        message: x.message,
                        createdAt: x.createdAt
                    };
                    return map;
                });
                return res.status(200).send({ notifications });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error cargando las notificaciones' });
            });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las notificaciones ' + err });
        });
}

function getUnreadUserNotifications(req, res) {
    notifications_model.sequelize.query('SELECT COUNT(n.id) AS user_unread_notifications_count FROM notifications n WHERE n.user_id = ? AND n.readed = false', { replacements: [req.user.id], type: notifications_model.sequelize.QueryTypes.SELECT })
        .then((notifications) => {
            return res.status(200).send(notifications[0]);
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargando las notificaciones' });
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
    // User notifications
    getUserNotifications,
    getUnreadUserNotifications
};