/*jshint esversion: 6 */
// Models
const forum_categories = require('../models').forum_categories;

function createCategory(req, res) {
    var body = req.body;
    forum_categories.create(body).then(forum_category => {
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function updateCategory(req, res) {
    var body = req.body;
    console.log(body);
    forum_categories.findByPk(body.id).then(forum_category => {
        forum_categories.update(body).then(() => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}


function getForum(req, res) {
    // forum.sequelize.query("SELECT (SELECT(SELECT u.user_login FROM users u WHERE u.id = p.post_author_id) FROM posts p WHERE p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_posted, (SELECT(SELECT u.id FROM users u WHERE u.id = p.post_author_id) FROM posts p WHERE p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_id,(SELECT p.post_title FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_title,(SELECT p.createdAt FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_date, forum.forum_type, COUNT(*) as forum_posts_count, (SELECT p.id FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_id, forum.forum_category_description FROM posts p, forum WHERE p.forum_type_id = forum.id GROUP BY p.forum_type_id", { type: forum.sequelize.QueryTypes.SELECT }).then(forum => {
    forum.sequelize.query("SELECT *, (SELECT COUNT(*) FROM posts where posts.forum_type_id = f.id) AS category_posts_count, (SELECT users.user_login FROM users, posts where posts.forum_type_id = f.id AND posts.post_author_id = users.id  ORDER BY posts.createdAt DESC LIMIT 1) AS last_post_user_login, (SELECT users.id FROM users, posts where posts.forum_type_id = f.id AND posts.post_author_id = users.id  ORDER BY posts.createdAt DESC LIMIT 1) AS last_post_user_id, (SELECT posts.post_title FROM posts where posts.forum_type_id = f.id ORDER BY posts.createdAt DESC LIMIT 1) AS category_last_post_name, (SELECT posts.createdAt FROM posts where posts.forum_type_id = f.id ORDER BY posts.createdAt DESC LIMIT 1) AS category_last_post_date, (SELECT posts.id FROM posts where posts.forum_type_id = f.id ORDER BY posts.createdAt DESC LIMIT 1) AS category_last_post_id FROM forum f", { type: forum.sequelize.QueryTypes.SELECT }).then(forum => {
        res.status(200).send({ forum });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}


function deleteForumCategory(req, res) {
    var id = req.params.id;
    forum.findByPk(id).then(category => {
        forum.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' });
    });
}
module.exports = {
    /*create,
    update,
    getForum,
    deleteForumCategory*/
};