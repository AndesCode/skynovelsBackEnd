/*jshint esversion: 6 */
// Models
const forum_categories = require('../models').forum_categories;
const users = require('../models').users;
const novels = require('../models').novels;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

function adminPanelAccess(req, res) {
    res.status(200).send({ message: 'Acceso otorgado' });
}

// forum

function adminCreateCategory(req, res) {
    const body = req.body;
    forum_categories.create(body).then(forum_category => {
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro ' + err });
    });
}

function adminUpdateCategory(req, res) {
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

function adminDeleteCategory(req, res) {
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

function adminUpdatePost(req, res) {
    const body = req.body;
    forum_posts.findByPk(body.id).then(post => {
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
    forum_posts.findByPk(id).then(post => {
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
    posts_comments.findByPk(id).then(post_comment => {
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
    posts_comments.findByPk(body.id).then(post_comment => {
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
    users.findAll({
        include: [{
            model: novels,
            as: 'collaborations',
            attributes: ['id'],
            through: { attributes: [] }
        }, {
            model: novels,
            as: 'novels',
            attributes: ['id', 'nvl_title', 'nvl_status', 'nvl_name', 'createdAt', 'updatedAt']
        }, {
            model: invitations,
            as: 'invitations',
            attributes: ['id', 'invitation_status']
        }, {
            model: novels_ratings,
            as: 'novels_ratings',
            attributes: ['id', 'novel_id', 'rate_value']
        }],
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
        where: {
            user_status: status
        }
    }).then(users => {
        res.status(200).send({ users });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminDeleteUser(req, res) {
    var id = req.params.id;
    users.findByPk(id).then(user => {
        user.destroy({
            where: {
                id: id
            }
        }).then(user => {
            res.status(200).send({ user });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario' });
    });
}

// Novels

function adminGetNovels(req, res) {
    novels.findAll({
        include: [{
            model: genres,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: chapters,
            as: 'chapters',
            attributes: ['id']
        }, {
            model: novels_ratings,
            as: 'novel_ratings',
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }]
        }, {
            model: users,
            as: 'collaborators',
            attributes: ['id', 'user_login'],
            through: { attributes: [] },
        }, {
            model: users,
            as: 'author',
            attributes: ['user_login']
        }, {
            model: user_reading_lists,
            as: 'user_reading_lists',
            include: [{
                model: users,
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
    novels.findByPk(body.id).then(novel => {
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
    var id = req.params.id;
    novels.findByPk(id).then((novel) => {
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

function adminCreateGenre(req, res) {
    var body = req.body;
    console.log(body);
    genres.create(body).then(genre => {
        return res.status(200).send({ genre });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear el genero para las novelas ' + err });
    });
}

function adminUpdateGenre(req, res) {
    var body = req.body;
    console.log(body);
    genres.findByPk(body.id).then(genre => {
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
    var id = req.params.id;
    console.log(id);
    genres.findByPk(id).then(genre => {
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
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminUpdateComment,
    adminDeleteComment,
    adminUpdatePost,
    adminDeletePost,
    // Users
    adminGetUsers,
    adminDeleteUser,
    // Novels
    adminGetNovels,
    adminUpdateNovel,
    adminDeleteNovel,
    // Genres
    adminCreateGenre,
    adminUpdateGenre,
    adminDeleteGenre

};