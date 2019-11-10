/*jshint esversion: 6 */
const forum = require('../models').forum;

function create(req, res) {
    var body = req.body;
    forum.create(body).then(forum => {
        res.status(200).send({ forum });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function update(req, res) {
    var id = req.params.id;
    var body = req.body;

    forum.findById(id).then(forum => {
        forum.update(body).then(() => {
            res.status(200).send({ forum }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
            });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}


function getForum(req, res) {
    var type = req.params.type;
    forum.sequelize.query("SELECT (SELECT(SELECT u.user_login FROM users u WHERE u.id = p.post_author_id) FROM posts p WHERE p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_posted, (SELECT(SELECT u.id FROM users u WHERE u.id = p.post_author_id) FROM posts p WHERE p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_id,(SELECT p.post_title FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_title,(SELECT p.createdAt FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_date, forum.forum_type, COUNT(*) as forum_posts_count, (SELECT p.id FROM posts p WHERE p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_id, forum.forum_category_description FROM posts p, forum WHERE p.forum_type_id = forum.id GROUP BY p.forum_type_id", { type: forum.sequelize.QueryTypes.SELECT }).then(forum => {
        res.status(200).send({ forum });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}
module.exports = {
    create,
    update,
    getForum
};