/*jshint esversion: 6 */
// Models
const forum_categories_model = require('../models').forum_categories;
const users_model = require('../models').users;
const novels_model = require('../models').novels;
const novels_ratings_model = require('../models').novels_ratings;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const genres_model = require('../models').genres;
const forum_posts_model = require('../models').forum_posts;
const posts_comments_model = require('../models').posts_comments;
const bookmarks_model = require('../models').bookmarks;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

function adminPanelAccess(req, res) {
    res.status(200).send({ message: 'Acceso otorgado', status: 200 });
}

// forum

function adminGetCategories(req, res) {
    forum_categories_model.findAll({
        include: [{
            model: forum_posts_model,
            as: 'forum_posts',
            attributes: ['id'],
        }]
    }).then(forum_categories => {
        res.status(200).send({ forum_categories });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function adminCreateCategory(req, res) {
    const body = req.body;
    forum_categories_model.create(body).then(forum_category => {
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro ' + err });
    });
}

function adminUpdateCategory(req, res) {
    const body = req.body;
    forum_categories_model.findByPk(body.id).then(forum_category => {
        forum_category.update(body).then((forum_category) => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function adminDeleteCategory(req, res) {
    const id = req.params.id;
    forum_categories_model.findByPk(id).then(forum_category => {
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


function adminGetPosts(req, res) {
    forum_posts_model.findAll({
        include: [{
                model: forum_categories_model,
                as: 'forum_category',
                attributes: ['category_name', 'category_title'],
            },
            {
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            },
            {
                model: posts_comments_model,
                as: 'post_comments',
                attributes: ['id'],
            }
        ]
    }).then(forum_posts => {
        res.status(200).send({ forum_posts });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}


function adminUpdatePost(req, res) {
    const body = req.body;
    forum_posts_model.findByPk(body.id).then(post => {
        post.update(body).then((post) => {
            res.status(200).send({ post });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function adminDeletePost(req, res) {
    const id = req.params.id;
    forum_posts_model.findByPk(id).then(post => {
        post.destroy({
            where: {
                id: id
            }
        }).then(() => {
            return res.status(200).send({ post });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' + err });
    });
}

function adminDeleteComment(req, res) {
    const id = req.params.id;
    posts_comments_model.findByPk(id).then(post_comment => {
        post_comment.destroy({
            where: {
                id: id
            }
        }).then(() => {
            return res.status(200).send({ post_comment });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' + err });
    });
}

function adminUpdateComment(req, res) {
    const body = req.body;
    posts_comments_model.findByPk(body.id).then(post_comment => {
        post_comment.update(body).then((post_comment) => {
            return res.status(200).send({ post_comment });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

// Users

function adminGetUsers(req, res) {
    let status = req.params.status;
    if (status === 'All') {
        status = {
            [Op.ne]: null
        };
    }
    users_model.findAll({
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
        where: {
            user_status: status
        }
    }).then(users => {
        return res.status(200).send({ users });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminDeleteUser(req, res) {
    const id = req.params.id;
    users_model.findByPk(id).then(user => {
        user.destroy({
            where: {
                id: id
            }
        }).then(user => {
            return res.status(200).send({ user });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario' });
    });
}

function adminUpdateUser(req, res) {
    const body = req.body;
    users_model.findByPk(body.id, {
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt']
    }).then(user => {
        user.update(body).then((user) => {
            return res.status(200).send({ user });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el usuario ' + err });
    });
}

// Novels

function adminGetNovels(req, res) {
    novels_model.findAll({
        include: [{
            model: genres_model,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: volumes_model,
            as: 'volumes',
            attributes: ['id', 'vlm_title'],
            include: [{
                model: chapters_model,
                as: 'chapters',
                attributes: ['id']
            }]
        }, {
            model: novels_ratings_model,
            as: 'novel_ratings',
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }, {
            model: users_model,
            as: 'collaborators',
            attributes: ['id', 'user_login'],
            through: { attributes: [] },
        }, {
            model: users_model,
            as: 'author',
            attributes: ['user_login']
        }, {
            model: bookmarks_model,
            as: 'bookmarks',
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }]
    }).then(novels => {
        return res.status(200).send({ novels });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminUpdateNovel(req, res) {
    const body = req.body;
    novels_model.findByPk(body.id).then(novel => {
        novel.update(body).then((novel) => {
            if (body.genres && body.genres.length > 0) {
                novel.setGenres(body.genres);
            }
            if (body.collaborators && body.collaborators.length > 0) {
                novel.setCollaborators(body.collaborators);
            }
            return res.status(200).send({ novel });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar la novela ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminDeleteNovel(req, res) {
    const id = req.params.id;
    novels_model.findByPk(id).then((novel) => {
        // Deleting Novel image
        if (novel.dataValues.nvl_img !== '') {
            var old_img = novel.dataValues.nvl_img;
            delete_file_path = './server/uploads/novels/' + old_img;
            delete_file_thumb_path = './server/uploads/novels/thumbs/' + old_img;
            fs.unlink(delete_file_path, (err) => {
                if (err) {
                    return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua. ' });
                } else {
                    fs.unlink(delete_file_thumb_path, (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen thumb antigua. ' });
                        } else {
                            return res.status(200);
                        }
                    });
                }
            });
        }
        novel.destroy({
            where: {
                id: id
            }
        }).then(novel => {
            return res.status(200).send({ novel });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela ' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la novela a eliminar ' });
    });
}

// Chapters

function adminUpdateChapter(req, res) {
    const body = req.body;
    chapters_model.findByPk(body.id).then(chapter => {
        chapter.update(body).then(() => {
            return res.status(200).send({ chapter });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar el capitulos ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function adminDeleteChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id).then(chapter => {
        chapter.destroy({
            where: {
                id: id
            }
        }).then(chapter => {
            return res.status(200).send({ chapter });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

// Genres

function adminCreateGenre(req, res) {
    const body = req.body;
    console.log(body);
    genres_model.create(body).then(genre => {
        return res.status(200).send({ genre });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear el genero para las novelas ' + err });
    });
}

function adminUpdateGenre(req, res) {
    const body = req.body;
    console.log(body);
    genres_model.findByPk(body.id).then(genre => {
        genre.update(body).then(() => {
            return res.status(200).send({ genre });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar la novela' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminDeleteGenre(req, res) {
    const id = req.params.id;
    console.log(id);
    genres_model.findByPk(id).then(genre => {
        genre.destroy({
            where: {
                id: id
            }
        }).then(genre => {
            return res.status(200).send({ genre });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el genero indicado' });
    });
}



module.exports = {
    // Panel
    adminPanelAccess,
    // Forum
    adminGetCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminUpdateComment,
    adminDeleteComment,
    adminGetPosts,
    adminUpdatePost,
    adminDeletePost,
    // Users
    adminGetUsers,
    adminDeleteUser,
    adminUpdateUser,
    // Novels
    adminGetNovels,
    adminUpdateNovel,
    adminDeleteNovel,
    // Chapters
    adminUpdateChapter,
    adminDeleteChapter,
    // Genres
    adminCreateGenre,
    adminUpdateGenre,
    adminDeleteGenre

};