/*jshint esversion: 6 */
const forum = require('../models').forum;

function create(req, res) {
    var body = req.body;

    forum.create(body).then(forum => {
        res.status(200).send({ forum });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar' });
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
    forum.sequelize.query("SELECT (SELECT(select u.user_login from usuarios u where u.id = p.post_author_id) from posts p where p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_posted, (SELECT p.post_title FROM posts p where p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_title,forum.forum_type, COUNT(*) as forum_posts_count, (SELECT p.id FROM posts p where p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_id FROM posts p, forum WHERE p.forum_type_id = forum.id GROUP BY p.forum_type_id", { type: forum.sequelize.QueryTypes.SELECT }).then(forum => {
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