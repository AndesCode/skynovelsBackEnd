/*jshint esversion: 6 */
require('dotenv').config();
// Models
const forum_categories_model = require('../models').forum_categories;
const users_model = require('../models').users;
const novels_model = require('../models').novels;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const genres_model = require('../models').genres;
const forum_posts_model = require('../models').forum_posts;
const posts_comments_model = require('../models').posts_comments;
const advertisements_model = require('../models').advertisements;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// files mannager
const fs = require('fs');
const mariadbHelper = require('../services/mariadbHelper');

function adminPanelAccess(req, res) {
    return res.status(200).send({ message: 'Acceso otorgado', status: 200 });
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
        return res.status(200).send({ forum_categories });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar las categorias' });
    });
}

function adminCreateCategory(req, res) {
    const body = req.body;
    forum_categories_model.create(body).then(forum_category => {
        return res.status(201).send({ forum_category });
    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria' });
        }
    });
}

function adminUpdateCategory(req, res) {
    const body = req.body;
    forum_categories_model.findByPk(body.id).then(forum_category => {
        forum_category.update({
            category_title: body.category_title,
            category_name: body.category_name,
            category_description: body.category_description,
            category_order: body.category_order
        }).then((forum_category) => {
            return res.status(200).send({ forum_category });
        }).catch(err => {
            if (err && err.errors && err.errors[0].message) {
                return res.status(400).send({ message: err.errors[0].message });
            } else {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la categoria' });
            }
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la categoria' });
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
            return res.status(200).send({ forum_category });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro' });
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
        return res.status(200).send({ forum_posts });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar las publicaciones' });
    });
}


function adminUpdatePost(req, res) {
    const body = req.body;
    forum_posts_model.findByPk(body.id).then(post => {
        post.update(body).then((post) => {
            return res.status(200).send({ post });
        }).catch(err => {
            if (err && err.errors && err.errors[0].message) {
                return res.status(400).send({ message: err.errors[0].message });
            } else {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la publicación' });
            }
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la publicación' });
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
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la categoria del foro' });
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
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la categoria del foro' });
    });
}

function adminUpdateComment(req, res) {
    const body = req.body;
    posts_comments_model.findByPk(body.id).then(post_comment => {
        post_comment.update(body).then((post_comment) => {
            return res.status(200).send({ post_comment });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar la publicación ' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la publicación ' });
    });
}

// Users

function adminGetUsers(req, res) {
    users_model.findAll({
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
    }).then(users => {
        return res.status(200).send({ users });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar los usuarios' });
    });
}

function adminGetUser(req, res) {
    const id = req.params.id;
    users_model.findByPk(id, {
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
    }).then(user => {
        if (user) {
            return res.status(200).send({ user });
        } else {
            return res.status(404).send({ message: 'No se encuentra ningún usuario por el id indicado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el usuario' });
    });
}

function adminDeleteUser(req, res) {
    const id = req.params.id;
    users_model.findByPk(id).then(user => {
        if (user.dataValues.user_profile_image !== '' && user.dataValues.user_profile_image !== null) {
            const old_img = user.dataValues.user_profile_image;
            delete_file_path = './server/uploads/users/' + old_img;
            delete_file_thumb_path = './server/uploads/users/thumbs/' + old_img;
            fs.unlink(delete_file_path, (err) => {
                if (err) {
                    return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua.' });
                } else {
                    fs.unlink(delete_file_thumb_path, (err) => {
                        if (err) {
                            console.log('error eliminando la imagen de perfil de ' + user.dataValues.user_login);
                        } else {
                            console.log('imagen de perfil de ' + user.dataValues.user_login + ' eliminada');
                        }
                    });
                }
            });
        }
        user.destroy({
            where: {
                id: id
            }
        }).then(() => {
            return res.status(200).send({ message: 'Usuario eliminado' });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el usuario' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el usuario' });
    });
}

function adminUpdateUser(req, res) {
    const body = req.body;
    users_model.findByPk(body.id, {
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt']
    }).then(user => {
        user.update({
            user_login: body.user_login,
            user_email: body.user_email,
            user_rol: body.user_rol,
            user_status: body.user_status,
            user_forum_auth: body.user_forum_auth,
            user_description: body.user_description
        }).then((user) => {
            return res.status(200).send({ user });
        }).catch(err => {
            if (err && err.errors && err.errors[0].message) {
                return res.status(400).send({ message: err.errors[0].message });
            } else {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el usuario' });
            }
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar el usuario' });
    });
}

// Novels

function adminCreateRecommendedNovel(req, res) {
    const id = req.params.id;
    novels_model.update({ nvl_recommended: 0 }, {
        where: {
            nvl_recommended: {
                [Op.not]: 0
            }
        }
    }).then(() => {
        novels_model.findOne({
            where: {
                id: id,
                [Op.or]: [
                    { nvl_status: 'Active' },
                    { nvl_status: 'Finished' }
                ]
            }
        }).then(novel => {
            if (novel) {
                novel.update({ nvl_recommended: 1 }).then(() => {
                    return res.status(200).send({ novel });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar al asignar la novela como recomendada' });
                });
            } else {
                return res.status(404).send({ message: 'No se encuentra la novela indicada' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar la novela indicada' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al limpiar la lista de novelas recomendadas' });
    });
}

function adminGetNovel(req, res) {
    const id = req.params.id;
    let query;
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        query = 'SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), JSON_ARRAY()) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status IS NOT NULL ), JSON_ARRAY()))), "]"), JSON) FROM volumes v where v.nvl_id = n.id), JSON_ARRAY()) as volumes,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))), "]"), JSON) as likes FROM likes l where l.novel_rating_id = nr.id), JSON_ARRAY()))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), JSON_ARRAY()) as novel_ratings,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))), "]"), JSON) FROM novels_collaborators nc where nc.novel_id = n.id), JSON_ARRAY()) as collaborators,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id WHERE n.id = ?';
    } else {
        query = 'SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))) FROM bookmarks rl where rl.nvl_id = n.id), JSON_ARRAY()) as bookmarks, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status IS NOT NULL ), JSON_ARRAY()))) FROM volumes v where v.nvl_id = n.id), JSON_ARRAY()) as volumes,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) as likes FROM likes l where l.novel_rating_id = nr.id), JSON_ARRAY()))) FROM novels_ratings nr where nr.novel_id = n.id), JSON_ARRAY()) as novel_ratings,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))) FROM novels_collaborators nc where nc.novel_id = n.id), JSON_ARRAY()) as collaborators,IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id WHERE n.id = ?';
    }
    novels_model.sequelize.query(query, { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT }).then(novel => {
        if (novel.length > 0) {
            novel = mariadbHelper.verifyJSON(novel, ['bookmarks', 'volumes', 'novel_ratings', 'collaborators', 'genres']);
            novel[0].volumes = mariadbHelper.verifyJSON(novel[0].volumes, ['chapters']);
            novel[0].novel_ratings = mariadbHelper.verifyJSON(novel[0].novel_ratings, ['likes']);
            return res.status(200).send({ novel });
        } else {
            return res.status(404).send({ message: 'No se encontro ninguna novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function adminGetNovels(req, res) {
    novels_model.sequelize.query('SELECT id, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) as user_login, nvl_title, nvl_status FROM novels n', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            if (novels.length > 0) {
                return res.status(200).send({ novels });
            } else {
                return res.status(404).send({ message: 'No se encontro ninguna novela' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
        });
}

function adminUpdateNovel(req, res) {
    const body = req.body;
    novels_model.findByPk(body.id).then(novel => {
        chapters_model.sequelize.query('SELECT id, chp_status FROM chapters WHERE nvl_id = ?', { replacements: [novel.id], type: chapters_model.sequelize.QueryTypes.SELECT })
            .then(novelsChapters => {
                const chapterNovels = novelsChapters.map(chapter => chapter.chp_status);
                if (novelsChapters.length <= 0 || chapterNovels.includes('Active') === false) {
                    body.nvl_status = 'Disabled';
                }
                if (body.genres && body.genres.length <= 0) {
                    body.nvl_status = 'Disabled';
                }
                if (body.nvl_status === 'Disabled') {
                    body.nvl_recommended = 0;
                } else {
                    body.nvl_recommended = novel.nvl_recommended;
                }
                if (novel.nvl_publication_date === null && body.nvl_status === 'Active') {
                    body.nvl_publication_date = Sequelize.fn('NOW');
                } else {
                    if (body.nvl_publication_date) {
                        body.nvl_publication_date = novel.nvl_publication_date;
                    }
                }
                novel.update({
                    nvl_content: body.nvl_content,
                    nvl_title: body.nvl_title,
                    nvl_acronym: body.nvl_acronym,
                    nvl_status: body.nvl_status,
                    nvl_publication_date: body.nvl_publication_date,
                    nvl_recommended: body.nvl_recommended,
                    nvl_writer: body.nvl_writer,
                    nvl_translator: body.nvl_translator,
                    nvl_translator_eng: body.nvl_translator_eng
                }).then((novel) => {
                    if (body.genres && body.genres.length > 0) {
                        novel.setGenres(body.genres);
                    }
                    if (body.collaborators && novel.nvl_author === req.user.id) {
                        novel.setCollaborators(body.collaborators);
                    }
                    return res.status(200).send({ novel });
                }).catch(err => {
                    if (err && err.errors && err.errors[0].message) {
                        return res.status(400).send({ message: err.errors[0].message });
                    } else {
                        return res.status(500).send({ message: 'Ocurrio un error al actualizar la novela' });
                    }
                });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar los capítulos de la novela' });
            });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function adminDeleteNovel(req, res) {
    const id = req.params.id;
    novels_model.findByPk(id).then((novel) => {
        // Deleting Novel image
        if (novel.dataValues.nvl_img !== '') {
            const old_img = novel.dataValues.nvl_img;
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
            return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function adminUpdateNovelVolume(req, res) {
    const body = req.body;
    volumes_model.findByPk(body.id).then(volume => {
        volume.update(body).then(() => {
            return res.status(200).send({ volume });
        }).catch(err => {
            if (err && err.errors && err.errors[0].message) {
                return res.status(400).send({ message: err.errors[0].message });
            } else {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el volumen ' });
            }
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el volumen' });
    });
}

function adminDeleteNovelVolume(req, res) {
    const id = req.params.id;
    chapters_model.findAll({
        where: {
            vlm_id: id
        }
    }).then(chapters => {
        if (chapters.length > 0) {
            return res.status(405).send({ message: 'No se puede eliminar un volumen con capitulos asociados' });
        } else {
            volumes_model.findByPk(id).then(volume => {
                volume.destroy({
                    where: {
                        id: id
                    }
                }).then(volume => {
                    return res.status(200).send({ volume });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al eliminar el volumen indicado' });
                });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar el volumen indicado' });
            });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar los capítulos del volumen' });
    });
}

// Chapters

function adminGetChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id).then(chapter => {
        if (chapter) {
            return res.status(200).send({ chapter });
        } else {
            return res.status(404).send({ message: 'Capitulo no encontrado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
    });
}

function adminUpdateChapter(req, res) {
    const body = req.body;
    chapters_model.findByPk(body.id).then(chapter => {
        if (chapter) {
            novels_model.findByPk(chapter.nvl_id, {
                include: [{
                    model: volumes_model,
                    as: 'volumes',
                    attributes: ['id']
                }]
            }).then(novel => {
                const volumes = novel.volumes.map(volume => volume.id);
                if (novel && (!body.vlm_id || volumes.includes(Number(body.vlm_id)))) {
                    chapter.update({
                        chp_translator: body.chp_translator,
                        chp_translator_eng: body.chp_translator_eng,
                        vlm_id: body.vlm_id,
                        chp_number: body.chp_number,
                        chp_content: body.chp_content,
                        chp_review: body.chp_review,
                        chp_title: body.chp_title,
                        chp_index_title: body.chp_index_title,
                        chp_status: body.chp_status
                    }).then(() => {
                        if (novel.nvl_status === 'Active' || novel.nvl_status === 'Finished') {
                            chapters_model.sequelize.query('SELECT id, chp_status FROM chapters WHERE nvl_id = ?', { replacements: [novel.id], type: chapters_model.sequelize.QueryTypes.SELECT })
                                .then(novelsChapters => {
                                    const chapterNovels = novelsChapters.map(chapter => chapter.chp_status);
                                    if (novelsChapters.length <= 0 || chapterNovels.includes('Active') === false) {
                                        novel.update({
                                            nvl_status: "Disabled"
                                        }).then(() => {
                                            return res.status(200).send({ chapter });
                                        }).catch(err => {
                                            return res.status(500).send({ message: 'Ocurrio un error actualizando el estado de la novela' });
                                        });
                                    } else {
                                        return res.status(200).send({ chapter });
                                    }
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error cargando los capítulos de la novela' });
                                });
                        } else {
                            return res.status(200).send({ chapter });
                        }
                    }).catch(err => {
                        if (err && err.errors && err.errors[0].message) {
                            return res.status(400).send({ message: err.errors[0].message });
                        } else {
                            return res.status(500).send({ message: 'Ocurrio un error al actualizar el capitulo' });
                        }
                    });
                } else {
                    return res.status(404).send({ message: 'Novela o volumen inexistentes para la actualización del capitulo' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
            });
        } else {
            return res.status(404).send({ message: 'No se encuentra el capitulo indicado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
    });
}

function adminDeleteChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['id', 'nvl_author', 'nvl_status']
        }]
    }).then(chapter => {
        const novel_id = chapter.novel.id;
        chapter.destroy({
            where: {
                id: id
            }
        }).then(chapter => {
            if (chapter.novel.nvl_status === 'Disabled') {
                return res.status(200).send({ chapter });
            } else {
                chapters_model.sequelize.query('SELECT id, chp_status FROM chapters WHERE nvl_id = ?', { replacements: [novel_id], type: chapters_model.sequelize.QueryTypes.SELECT })
                    .then(novelsChapters => {
                        const chapterNovels = novelsChapters.map(chapter => chapter.chp_status);
                        if (novelsChapters.length <= 0 || chapterNovels.includes('Active') === false) {
                            novels_model.findByPk(novel_id)
                                .then(novel => {
                                    novel.update({
                                        nvl_status: "Disabled"
                                    }).then(() => {
                                        return res.status(200).send({ chapter });
                                    }).catch(err => {
                                        return res.status(500).send({ message: 'Ocurrio un error actualizando el estado de la novela' });
                                    });
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error actualizando el estado de la novela' });
                                });
                        } else {
                            return res.status(200).send({ chapter });
                        }
                    }).catch(err => {
                        return res.status(500).send({ message: 'Ocurrio un error al cargar los capítulos de la novela' });
                    });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el capitulo indicado' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo a eliminar' });
    });
}

// Genres

function adminCreateGenre(req, res) {
    const body = req.body;
    genres_model.create(body).then(genre => {
        return res.status(201).send({ genre });
    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error al crear el genero' });
        }
    });
}

function adminUpdateGenre(req, res) {
    const body = req.body;
    genres_model.findByPk(body.id).then(genre => {
        if (genre) {
            genre.update(body).then(() => {
                return res.status(200).send({ genre });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el genero' });
                }
            });
        } else {
            return res.status(404).send({ message: 'Genero no encontrado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el genero' });
    });
}

function adminDeleteGenre(req, res) {
    const id = req.params.id;
    genres_model.findByPk(id).then(genre => {
        genre.destroy({
            where: {
                id: id
            }
        }).then(genre => {
            return res.status(200).send({ genre });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el genero' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el genero a eliminar' });
    });
}

function adminGetAdvertisements(req, res) {
    advertisements_model.sequelize.query('SELECT a.*, (SELECT user_login FROM users u WHERE u.id = a.user_id) AS user_login FROM advertisements a', { type: advertisements_model.sequelize.QueryTypes.SELECT })
        .then(advertisements => {
            return res.status(200).send({ advertisements });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargar los anuncios' });
        });
}

function adminGetAdvertisement(req, res) {
    const id = req.params.id;
    advertisements_model.sequelize.query('SELECT a.*, (SELECT user_login FROM users u WHERE u.id = a.user_id) AS user_login FROM advertisements a WHERE a.id = ?', { replacements: [id], type: advertisements_model.sequelize.QueryTypes.SELECT })
        .then(advertisements => {
            if (advertisements.length > 0) {
                return res.status(200).send({ advertisement: advertisements[0] });
            } else {
                return res.status(500).send({ message: 'No se encuentra ningún anuncio por el id indicado' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargar el anuncio' });
        });
}

function adminCreateAdvertisement(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    advertisements_model.create(body).then(advertisement => {
        return res.status(200).send({ advertisement });
    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error al crear el anuncio' });
        }
    });
}

function adminUpdateAdvertisement(req, res) {
    const body = req.body;
    advertisements_model.findByPk(body.id).then(advertisement => {
        if (advertisement) {
            advertisement.update({
                adv_title: body.adv_title,
                adv_content: body.adv_content,
                adv_order: body.adv_order
            }).then((advertisement) => {
                return res.status(200).send({ advertisement });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el anuncio' });
                }
            });
        } else {
            return res.status(404).send({ message: 'No se encuentra el anuncio indicado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar el anuncio' });
    });
}

function adminDeleteAdvertisement(req, res) {
    const id = req.params.id;
    advertisements_model.findByPk(id).then((advertisement) => {
        // Deleting Novel image
        if (advertisement.dataValues.adv_img !== '' && advertisement.dataValues.adv_img !== null) {
            const old_img = advertisement.dataValues.adv_img;
            delete_file_path = './server/uploads/advertisements/' + old_img;
            fs.unlink(delete_file_path, (err) => {
                if (err) {
                    console.log('error eliminando la imagen de anuncio');
                } else {
                    console.log('Imagen de anuncio eliminada');
                }
            });
        }
        advertisement.destroy({
            where: {
                id: id
            }
        }).then(() => {
            return res.status(200).send({ message: 'Anuncio eliminado' });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el anuncio' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el anuncio a eliminar' });
    });
}

function adminUploadAdvertisementImage(req, res) {
    const id = req.params.id;
    const imageFileFormats = ['JPG', 'JPEG', 'PNG', 'JFIF', 'PJPEG', 'PJP'];
    if (req.files) {
        const file_path = req.files.advertisement_image.path;
        const file_split = file_path.split(process.env.pathSlash || '\\');
        const file_name = file_split[3];
        const ext_split = file_name.split(process.env.pathDot || '\.');
        const file_ext = ext_split[1];
        if (imageFileFormats.includes(file_ext.toUpperCase())) {
            const advertisement_image = {};
            advertisement_image.adv_img = file_name;
            advertisements_model.findByPk(id).then(advertisement => {
                if (advertisement.adv_img !== null) {
                    const old_img = advertisement.adv_img;
                    old_file_path = './server/uploads/advertisements/' + old_img;
                    fs.stat(old_file_path, function(err, stats) {
                        if (stats) {
                            fs.unlink(old_file_path, (err) => {
                                if (err) {
                                    return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua' });
                                }
                            });
                        }
                    });
                }
                advertisement.update(advertisement_image).then(() => {
                    return res.status(200).send({ advertisement });
                }).catch(err => {
                    fs.unlink(file_path, (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                        }
                    });
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el anuncio.' });
                });
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                    }
                });
                return res.status(500).send({ message: 'No existe el anuncio.' });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                }
            });
            return res.status(500).send({ message: 'La extensión del archivo no es valida.' });
        }
    } else {
        return res.status(400).send({ message: 'Debe Seleccionar anuncio.' });
    }
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
    adminGetUser,
    adminDeleteUser,
    adminUpdateUser,
    // Novels
    adminGetNovel,
    adminGetNovels,
    adminUpdateNovel,
    adminDeleteNovel,
    adminCreateRecommendedNovel,
    // Volumes
    adminUpdateNovelVolume,
    adminDeleteNovelVolume,
    // Chapters
    adminGetChapter,
    adminUpdateChapter,
    adminDeleteChapter,
    // Genres
    adminCreateGenre,
    adminUpdateGenre,
    adminDeleteGenre,
    // Advertisement
    adminGetAdvertisement,
    adminGetAdvertisements,
    adminCreateAdvertisement,
    adminUpdateAdvertisement,
    adminDeleteAdvertisement,
    adminUploadAdvertisementImage,

};