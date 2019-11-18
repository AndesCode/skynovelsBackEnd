/*jshint esversion: 6 */
const forum = require('../models').forum;
const posts = require('../models').posts;
const users = require('../models').users;
const posts_comments = require('../models').posts_comments;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;



function adminVerification(req, res) {
    body = req.body;
    users.findOne({
        where: {
            [Op.and]: [{ id: req.body.user_id }, { user_rol: 'admin' }]
        }
    }).then((user) => {
        res.status(200).send({ user });
    }).catch(err => {
        res.status(401).send({ message: 'Ocurrio un error al eliminar el usuario' + err });
    });
}

function getAllPosts(req, res) {
    var orderBy = req.body.orderBy;
    var orderOption = req.body.orderOption;
    posts.sequelize.query(`SELECT DISTINCT ( SELECT COUNT(*) FROM posts_comments WHERE posts_comments.forum_topic_id = posts.id ) AS comment_count, forum.forum_type, posts.createdAt AS postCreatedAt, posts.updatedAt AS postUpdatedAt, posts.id, posts.post_author_id, posts.post_title, posts.forum_type_id, users.user_login AS USER FROM forum, posts_comments, posts JOIN users ON posts.post_author_id = users.id WHERE posts.forum_type_id = forum.id ORDER BY ${orderBy} ${orderOption}`, { type: posts.sequelize.QueryTypes.SELECT }).then(posts => {
        res.status(200).send({ posts });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}

function adminUserDataUpdate(req, res) {
    var body = req.body;
    users.findByPk(body.id).then(user => {
        if (body.action && body.action == 'Desactivate') {
            var user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            user.update({
                user_verification_key: user_verification_key,
                user_status: 'Desactive'
            }).then(() => {
                res.status(200).send({ user });
            }).catch(err => {
                res.status(500).send({ message: 'Error al actualizar la key de usuario' });
            });
        } else {
            user.update(body).then(() => {
                res.status(200).send({ user });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario' });
            });
        }
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' });
    });
}

function getUserModificable(req, res) {
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

module.exports = {
    getAllPosts,
    adminUserDataUpdate,
    adminVerification,
    getUserModificable
};