/*jshint esversion: 6 */
// Models
const forum_categories_model = require('../models').forum_categories;
const forum_posts_model = require('../models').forum_posts;
const posts_comments_model = require('../models').posts_comments;
const users_model = require('../models').users;

// Categories




function getCategories(req, res) {
    forum_categories_model.findAll({
        include: [{
            model: forum_posts_model,
            as: 'posts',
            attributes: ['id', 'post_author_id', 'post_title', 'createdAt'],
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }, {
                model: posts_comments_model,
                as: 'post_comments',
                attributes: ['comment_author_id', 'createdAt'],
                include: [{
                    model: users_model,
                    as: 'user',
                    attributes: ['user_login']
                }]
            }]
        }],
        attributes: ['id', 'category_name', 'category_title', 'category_description', 'category_order'],
        order: [
            ['category_order', 'ASC']
        ]
    }).then(forum_categories => {
        return res.status(200).send({ forum_categories });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getCategory(req, res) {
    const id = req.params.id;
    forum_categories_model.findByPk(id, {
        include: [{
            model: forum_posts_model,
            as: 'posts',
            attributes: ['id', 'post_author_id', 'post_title', 'createdAt'],
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }, {
                model: posts_comments_model,
                as: 'post_comments',
                attributes: ['id', 'comment_author_id', 'createdAt'],
                include: [{
                    model: users_model,
                    as: 'user',
                    attributes: ['user_login']
                }]
            }]
        }]
    }).then(forum_category => {
        if (forum_category) {
            return res.status(200).send({ forum_category });
        } else {
            return res.status(404).send({ message: 'No se encontro ninguna categoria' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

// Posts

function getPost(req, res) {
    const id = req.params.id;
    forum_posts_model.findByPk(id, {
        include: [{
            model: users_model,
            as: 'user',
            attributes: ['user_login'],
            include: [{
                model: forum_posts_model,
                as: 'forum_posts',
                attributes: ['id']
            }]
        }, {
            model: posts_comments_model,
            as: 'post_comments',
            attributes: ['id', 'comment_content', 'comment_author_id', 'createdAt', 'updatedAt'],
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login'],
                include: [{
                    model: forum_posts_model,
                    as: 'forum_posts',
                    attributes: ['id']
                }]
            }]
        }, {
            model: forum_categories_model,
            as: 'forum_category',
            attributes: ['category_name', 'category_title'],
        }]
    }).then(post => {
        if (post) {
            return res.status(200).send({ post });
        } else {
            return res.status(404).send({ message: 'No se encontro ningún post' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
    });
}

function createPost(req, res) {
    const body = req.body;
    body.post_author_id = req.user.id;
    forum_categories_model.findByPk(body.forum_category_id).then(forum_category => {
        if (forum_category) {
            forum_posts.create(body).then(post => {
                return res.status(200).send({ post });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
            });
        } else {
            return res.status(500).send({ message: 'Categoria invalida' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar una categoria para la publicación ' + err });
    });
}

function updatePost(req, res) {
    const body = req.body;
    forum_posts_model.findByPk(body.id).then(post => {
        if (post.post_author_id === req.user.id) {
            post.update(body).then((post) => {
                res.status(200).send({ post });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function deletePost(req, res) {
    const id = req.params.id;
    forum_posts_model.findByPk(id).then(post => {
        if (post.post_author_id === req.user.id) {
            forum_posts.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                return res.status(200).send({ post });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' + err });
    });
}

// Posts comments

function createComment(req, res) {
    const body = req.body;
    body.comment_author_id = req.user.id;
    posts_comments_model.create(body).then(post_comment => {
        return res.status(200).send({ post_comment });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro ' + err });
    });
}

function updateComment(req, res) {
    const body = req.body;
    posts_comments_model.findByPk(body.id).then(post_comment => {
        if (post_comment.comment_author_id === req.user.id) {
            post_comment.update(body).then((post_comment) => {
                return res.status(200).send({ post_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function deleteComment(req, res) {
    const id = req.params.id;
    posts_comments_model.findByPk(id).then(post_comment => {
        if (post_comment.comment_author_id === req.user.id) {
            post_comment.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                return res.status(200).send({ post_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' + err });
    });
}


module.exports = {
    // Categories
    getCategories,
    getCategory,
    // Posts
    getPost,
    createPost,
    updatePost,
    deletePost,
    // Comments
    createComment,
    updateComment,
    deleteComment
};