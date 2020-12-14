/*jshint esversion: 6 */
//Models
const novels_ratings_model = require('../models').novels_ratings;
const chapters_model = require('../models').chapters;
const advertisements_model = require('../models').advertisements;
const likes_model = require('../models').likes;
const comments_model = require('../models').comments;
const replys_model = require('../models').replys;
// files mannager
const fs = require('fs');
const path = require('path');
const mariadbHelper = require('../services/mariadbHelper');

// likes 

function createLike(req, res) {
    const body = req.body;
    let modelDefined = false;
    let model;
    let objectId;
    let objectName;
    if (body.novel_rating_id && !modelDefined) {
        model = novels_ratings_model;
        modelDefined = true;
        objectId = body.novel_rating_id;
        objectName = 'novel_rating_id';
    }
    if (body.adv_id && !modelDefined) {
        model = advertisements_model;
        modelDefined = true;
        objectId = body.adv_id;
        objectName = 'adv_id';
    }
    if (body.comment_id && !modelDefined) {
        model = comments_model;
        modelDefined = true;
        objectId = body.comment_id;
        objectName = 'comment_id';
    }
    if (body.reply_id && !modelDefined) {
        model = replys_model;
        modelDefined = true;
        objectId = body.reply_id;
        objectName = 'reply_id';
    }
    model.findByPk(objectId, { attributes: ['id'] }).then(object => {
        if (object) {
            likes_model.create({
                'user_id': req.user.id,
                [objectName]: objectId
            }).then(like => {
                return res.status(201).send({ like });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al asignar el "Me gusta"' });
                }
            });
        } else {
            return res.status(500).send({ message: 'No se encuentra el elemento al que se intenta asignar el "Me gusta"' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el elemento al que se intenta asignar el "Me gusta"' });
    });
}

function deleteLike(req, res) {
    const id = req.params.id;
    likes_model.findByPk(id).then(like => {
        if (req.user.id === like.user_id) {
            like.destroy({
                where: {
                    id: id
                }
            }).then(like => {
                return res.status(200).send({ like });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el "Me gusta"' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el "Me gusta"' });
    });
}

// Advertisements

function getAdvertisements(req, res) {
    advertisements_model.sequelize.query('SELECT a.* FROM advertisements a WHERE a.adv_img IS NOT NULL', { type: advertisements_model.sequelize.QueryTypes.SELECT })
        .then(advertisements => {
            return res.status(200).send({ advertisements });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargar los anuncios' });
        });
}

function getAdvertisement(req, res) {
    const id = req.params.id;
    advertisements_model.sequelize.query('SELECT a.*, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "adv_id", l.adv_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) FROM likes l where l.adv_id = a.id), JSON_ARRAY()) AS likes, (SELECT user_login FROM users u WHERE u.id = a.user_id) AS user_login, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "comment_content", c.comment_content, "user_id", c.user_id, "user_login", (SELECT user_login FROM users u where u.id = c.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = c.user_id), "likes_count", (SELECT COUNT(id) FROM likes l where l.comment_id = c.id), "replys_count", (SELECT COUNT(id) FROM replys r where r.comment_id = c.id), "likes", (IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "comment_id", l.comment_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) FROM likes l where l.comment_id = c.id), JSON_ARRAY())))) FROM comments c where c.adv_id = a.id), JSON_ARRAY()) as comments FROM advertisements a WHERE a.id = ? AND a.adv_img IS NOT NULL', { replacements: [id], type: advertisements_model.sequelize.QueryTypes.SELECT })
        .then(advertisement => {
            if (advertisement.length > 0) {
                advertisement = mariadbHelper.verifyJSON(advertisement, ['likes', 'comments']);
                advertisement[0].comments = mariadbHelper.verifyJSON(advertisement[0].comments, ['likes']);
                return res.status(200).send({ advertisement: advertisement[0] });
            } else {
                return res.status(404).send({ message: 'No se encuentra ningún anuncio por el id indicado' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargar el anuncio' });
        });
}

function getAdvertisementImage(req, res) {
    const img_path = './server/uploads/advertisements/' + req.params.advertisement_img;
    fs.exists(img_path, (exists) => {
        if (exists) {
            return res.status(200).sendFile(path.resolve(img_path));
        } else {
            return res.status(404).send({ message: 'No se encuentra la imagen de anuncio' });
        }
    });
}

function createComment(req, res) {
    const body = req.body;
    let modelDefined = false;
    let model;
    let objectId;
    let atributes = [];
    let objectName;
    if (body.chp_id && !modelDefined) {
        model = chapters_model;
        modelDefined = true;
        objectId = body.chp_id;
        objectName = 'chp_id';
        atributes = ['id', 'chp_status'];
    }
    if (body.adv_id && !modelDefined) {
        model = advertisements_model;
        modelDefined = true;
        objectId = body.adv_id;
        objectName = 'adv_id';
        atributes = ['id', 'adv_img'];
    }
    model.findByPk(objectId, { attributes: atributes }).then(object => {
        if (object) {
            if (objectName === 'chp_id' && object.chp_status !== 'Active') {
                return res.status(409).send({ message: 'No se pudo agregar el comentario' });
            }
            if (objectName === 'adv_id' && (object.adv_img === null || object.adv_img.length === 0)) {
                return res.status(409).send({ message: 'No se pudo agregar el comentario' });
            }
            comments_model.create({
                'user_id': req.user.id,
                [objectName]: objectId,
                comment_content: body.comment_content
            }).then(comment => {
                return res.status(201).send({ comment });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al crear el comentario' });
                }
            });
        } else {
            return res.status(500).send({ message: 'No se encuentra el elemento al que se intenta asignar el comentario' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el elemento al que se intenta asignar el comentario' });
    });
}

function getComments(req, res) {
    const objectType = req.params.objt;
    const id = req.params.id;
    comments_model.sequelize.query('SELECT c.*, (SELECT user_login FROM users u where u.id = c.user_id) as user_login, (SELECT user_profile_image FROM users u where u.id = c.user_id) as user_profile_image, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "comment_id", l.comment_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) FROM likes l where l.comment_id = c.id), JSON_ARRAY()) as likes FROM comments c WHERE ' + objectType + ' = ?', { replacements: [id], type: comments_model.sequelize.QueryTypes.SELECT })
        .then(comments => {
            comments = mariadbHelper.verifyJSON(comments, ['likes']);
            return res.status(200).send({ comments });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar los comentarios' });
        });
}

function updateComment(req, res) {
    const body = req.body;
    comments_model.findByPk(body.id).then(comment => {
        if (req.user.id === comment.user_id) {
            comment.update({
                comment_content: body.comment_content
            }).then(() => {
                return res.status(200).send({ comment });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el comentario' });
    });
}

function deleteComment(req, res) {
    const id = req.params.id;
    comments_model.findByPk(id).then(comment => {
        if (comment && req.user.id === comment.user_id) {
            comment.destroy({
                where: {
                    id: id
                }
            }).then(comment => {
                return res.status(200).send({ comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el comentario' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el comentario' });
    });
}


function createReply(req, res) {
    const body = req.body;
    let modelDefined = false;
    let model;
    let objectId;
    let objectName;
    if (body.comment_id && !modelDefined) {
        model = comments_model;
        modelDefined = true;
        objectId = body.comment_id;
        objectName = 'comment_id';
    }
    if (body.novel_rating_id && !modelDefined) {
        model = novels_ratings_model;
        modelDefined = true;
        objectId = body.novel_rating_id;
        objectName = 'novel_rating_id';
    }
    model.findByPk(objectId, { attributes: ['id'] }).then(object => {
        if (object) {
            replys_model.create({
                'user_id': req.user.id,
                [objectName]: objectId,
                reply_content: body.reply_content
            }).then(reply => {
                return res.status(201).send({ reply });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al crear la respuesta' });
                }
            });
        } else {
            return res.status(404).send({ message: 'No se encuentra el elemento al que se intenta asignar la respuesta' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el elemento al que se intenta asignar la respuesta' });
    });
}

function getReplys(req, res) {
    const objectType = req.params.objt;
    const id = req.params.id;
    replys_model.sequelize.query('SELECT *, (SELECT user_login FROM users u where u.id = r.user_id) as user_login, (SELECT user_profile_image FROM users u where u.id = r.user_id) as user_profile_image, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "reply_id", l.reply_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = l.user_id))) FROM likes l WHERE l.reply_id = r.id), JSON_ARRAY()) as likes FROM replys r WHERE r.' + objectType + ' = ?', { replacements: [id], type: replys_model.sequelize.QueryTypes.SELECT })
        .then(replys => {
            replys = mariadbHelper.verifyJSON(replys, ['likes']);
            return res.status(200).send({ replys });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las respuesta' });
        });
}

function updateReplys(req, res) {
    const body = req.body;
    replys_model.findByPk(body.id).then(reply => {
        if (req.user.id === reply.user_id) {
            reply.update({
                reply_content: body.reply_content
            }).then(() => {
                return res.status(200).send({ reply });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar la respuesta' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la respuesta' });
    });
}

function deleteReplys(req, res) {
    const id = req.params.id;
    replys_model.findByPk(id).then(reply => {
        if (reply && req.user.id === reply.user_id) {
            reply.destroy({
                where: {
                    id: id
                }
            }).then(reply => {
                return res.status(200).send({ reply });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la respuesta' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la respuesta' });
    });
}

module.exports = {
    // Advertisements
    getAdvertisement,
    getAdvertisements,
    getAdvertisementImage,
    // Comments
    createComment,
    getComments,
    updateComment,
    deleteComment,
    // Replys
    createReply,
    getReplys,
    updateReplys,
    deleteReplys,
    // Likes
    createLike,
    deleteLike
};