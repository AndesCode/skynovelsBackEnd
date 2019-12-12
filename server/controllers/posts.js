/*jshint esversion: 6 */
// Models
const posts = require('../models').posts;
const posts_comments = require('../models').posts_comments;

function create(req, res) {
    var body = req.body;
    posts.create(body).then(posts => {
        res.status(200).send({ posts });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar' + err });
    });
}

function update(req, res) {
    var id = req.params.id;
    var body = req.body;

    posts.findByPk(id).then(posts => {
        posts.update(body).then(() => {
            res.status(200).send({ posts }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
            });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

//Funcion que trae todos los Post de la base de datos

function getPosts(req, res) {
    var type = req.params.type;
    posts.sequelize.query("SELECT posts.createdAt, posts.updatedAt, ( SELECT COUNT(*) FROM posts_comments WHERE posts_comments.forum_topic_id = posts.id ) AS comment_count, forum.forum_type, posts.id, posts.post_author_id, posts.post_title, posts.forum_type_id, users.user_login AS post_user_login FROM forum, posts JOIN users ON posts.post_author_id = users.id WHERE posts.forum_type_id = forum.id AND forum.forum_type = ?", { replacements: [type], type: posts.sequelize.QueryTypes.SELECT }).then(posts => {
        res.status(200).send({ posts });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}

//Funcion que trae un (1) post en especifico 

function getPost(req, res) {
    var id = req.params.id;
    posts.sequelize.query("SELECT posts.createdAt, posts.updatedAt,posts.id, (SELECT COUNT(*) from posts where posts.post_author_id = users.id) AS author_post_count, (SELECT COUNT(*) FROM posts_comments WHERE posts_comments.post_comment_author_id = users.id ) AS author_commnet_count ,posts.post_author_id, posts.post_title, posts.post_content, users.user_login AS user, users.user_profile_image FROM posts JOIN users ON posts.post_author_id = users.id WHERE posts.id = ?", { replacements: [id], type: posts.sequelize.QueryTypes.SELECT }).then(posts => {
        res.status(200).send({ posts });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}

function getPostComments(req, res) {
    var id = req.params.id;
    console.log(id);
    posts_comments.sequelize.query("SELECT posts.id, (posts_comments.id) as post_comment_id, posts_comments.post_comment_content ,posts_comments.post_comment_author_id, users.user_login AS user FROM posts,posts_comments JOIN users ON posts_comments.post_comment_author_id = users.id WHERE posts.id = posts_comments.forum_topic_id AND forum_topic_id = ?", { replacements: [id], type: posts_comments.sequelize.QueryTypes.SELECT }).then(postsComments => {
        res.status(200).send({ postsComments });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' });
    });
}

function newPostComment(req, res) {
    var body = req.body;
    posts_comments.create(body).then(comment => {
        res.status(200).send({ comment });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar el comentario ' });
    });
}

function getComment(req, res) {
    var id = req.params.id;
    posts_comments.findByPk(id).then(comment => {
        res.status(200).send({ comment });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el comentario' });
    });
}

function updateComment(req, res) {

    var id = req.body.post_comment_id;
    var body = req.body;
    console.log(body);
    posts_comments.findByPk(id).then(posts_comment => {
        posts_comment.update(body).then(() => {
            res.status(200).send({ posts_comment }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario ' + err });
            });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el comentario ' + err });
    });
}

function deletePost(req, res) {
    var id = req.params.id;
    console.log(id);
    posts.findByPk(id).then((post) => {
        post.destroy({
            where: {
                id: id
            }
        }).then(posts_comment => {
            res.status(200).send({ posts_comment });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el post a eliminar ' + err });
    });
}

function deleteComment(req, res) {
    var id = req.params.id;
    console.log(id);
    posts_comments.findByPk(id).then((posts_comment) => {
        posts_comment.destroy({
            where: {
                id: id
            }
        }).then(posts_comment => {
            res.status(200).send({ posts_comment });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar comentario ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el comentario a eliminar ' + err });
    });
}

module.exports = {
    create,
    update,
    getPosts,
    getPost,
    getPostComments,
    newPostComment,
    getComment,
    updateComment,
    deletePost,
    deleteComment
};