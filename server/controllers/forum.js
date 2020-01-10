/*jshint esversion: 6 */
// Models
const forum_categories = require('../models').forum_categories;
const forum_posts = require('../models').forum_posts;
const posts_comments = require('../models').posts_comments;
const users = require('../models').users;

// Categories

function createCategory(req, res) {
    const body = req.body;
    forum_categories.create(body).then(forum_category => {
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function updateCategory(req, res) {
    const body = req.body;
    forum_categories.findByPk(body.id).then(forum_category => {
        forum_category.update(body).then((forum_category) => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}


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
        res.status(200).send({ forum_categories });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
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
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function deleteCategory(req, res) {
    const id = req.params.id;
    forum_categories.findByPk(id).then(forum_category => {
        forum_category.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' });
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
        res.status(200).send({ post });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function createPost(req, res) {
    const body = req.body;
    forum_posts.create(body).then(post => {
        res.status(200).send({ post });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function updatePost(req, res) {
    const body = req.body;
    forum_posts.findByPk(body.id).then(post => {
        post.update(body).then((post) => {
            res.status(200).send({ post });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function deletePost(req, res) {
    const id = req.params.id;
    forum_posts.findByPk(id).then(post => {
        post.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ post });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' });
    });
}

// Posts comments

function createComment(req, res) {
    const body = req.body;
    posts_comments.create(body).then(post_comment => {
        res.status(200).send({ post_comment });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro' });
    });
}

function updateComment(req, res) {
    const body = req.body;
    posts_comments.findByPk(body.id).then(post_comment => {
        post_comment.update(body).then((post_comment) => {
            res.status(200).send({ post_comment });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function deleteComment(req, res) {
    const id = req.params.id;
    posts_comments.findByPk(id).then(post_comment => {
        post_comment.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ post_comment });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' });
    });
}


module.exports = {
    // Categories
    createCategory,
    updateCategory,
    deleteCategory,
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