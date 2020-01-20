/*jshint esversion: 6 */
// Models
const forum_categories = require('../models').forum_categories;
const forum_posts = require('../models').forum_posts;
const posts_comments = require('../models').posts_comments;
const users = require('../models').users;

// Categories




function getCategories(req, res) {
    forum_categories.findAll({
        include: [{
            model: forum_posts,
            as: 'posts',
            attributes: ['id', 'post_author_id', 'post_title', 'createdAt', 'updatedAt'],
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }, {
                model: posts_comments,
                as: 'post_comments',
                attributes: ['id', 'comment_author_id', 'createdAt', 'updatedAt'],
                include: [{
                    model: users,
                    as: 'user',
                    attributes: ['user_login']
                }]
            }]
        }]
    }).then(forum_categories => {
        return res.status(200).send({ forum_categories });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getCategory(req, res) {
    const category = req.params.category;
    forum_categories.findOne({
        include: [{
            model: forum_posts,
            as: 'posts',
            attributes: ['id', 'post_author_id', 'post_title', 'createdAt', 'updatedAt'],
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }, {
                model: posts_comments,
                as: 'post_comments',
                attributes: ['id', 'comment_author_id', 'createdAt', 'updatedAt'],
                include: [{
                    model: users,
                    as: 'user',
                    attributes: ['user_login']
                }]
            }]
        }],
        where: {
            category_name: category
        }
    }).then(forum_category => {
        return res.status(200).send({ forum_category });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

// Posts

function getPost(req, res) {
    const id = req.params.id;
    forum_posts.findByPk(id, {
        include: [{
            model: users,
            as: 'user',
            attributes: ['user_login']
        }, {
            model: posts_comments,
            as: 'post_comments',
            attributes: ['id', 'comment_content', 'comment_author_id', 'createdAt', 'updatedAt'],
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }]
        }]
    }).then(post => {
        if (req.user) {
            const user = req.user.id
            return res.status(200).send({ post, user });
        } else {
            return res.status(200).send({ post });
        }   
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function createPost(req, res) {
    const body = req.body;
    body.post_author_id = req.user.id;
    forum_posts.create(body).then(post => {
        return res.status(200).send({ post });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function updatePost(req, res) {
    const body = req.body;
    forum_posts.findByPk(body.id).then(post => {
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
    forum_posts.findByPk(id).then(post => {
        if (post.post_author_id === req.user.id) {
            post.destroy({
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
    posts_comments.create(body).then(post_comment => {
        return res.status(200).send({ post_comment });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro ' + err });
    });
}

function updateComment(req, res) {
    const body = req.body;
    posts_comments.findByPk(body.id).then(post_comment => {
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
    posts_comments.findByPk(id).then(post_comment => {
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