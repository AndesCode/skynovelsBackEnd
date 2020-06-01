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
const advertisements_model = require('../models').advertisements;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// files mannager
const fs = require('fs');

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
    users_model.findAll({
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
    }).then(users => {
        return res.status(200).send({ users });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar los usuarios' + err });
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
            return res.status(404).send({ message: 'No se encuentra ningún usuario' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el usuario' + err });
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
                    return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua. ' });
                } else {
                    fs.unlink(delete_file_thumb_path, (err) => {
                        if (err) {
                            console.log('error eliminando la imagen de perfil de ' + user.dataValues.user_login + err);
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
                nvl_status: 'Active'
            }
        }).then(novel => {
            if (novel) {
                novel.update({ nvl_recommended: 1 }).then(() => {
                    return res.status(200).send({ novel });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar la novela a recomendada' + err });
                });
            } else {
                return res.status(404).send({ message: 'No se encuentra la novela indicada' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al encontrar la novela indicada' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al limpiar la lista de novelas recomendadas' + err });
    });
}

function adminGetNovel(req, res) {
    const id = req.params.id;
    novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id) AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "bkm_chapter", rl.bkm_chapter)), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status IS NOT NULL ), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM volumes v where v.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as volumes,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", nrl.id, "user_id", nrl.user_id, "user_login", (SELECT user_login FROM users u where u.id = nrl.user_id))), "]"), JSON) as likes FROM novels_ratings_likes nrl where nrl.novel_rating_id = nr.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as novel_ratings,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))), "]"), JSON) FROM novels_collaborators nc where nc.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as collaborators,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.id = ?', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novel => {
            if (novel.length > 0) {
                return res.status(200).send({ novel });
            } else {
                return res.status(404).send({ message: 'No se encontro ninguna novela' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' });
        });
}

function adminGetNovels(req, res) {
    novels_model.sequelize.query('SELECT id, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) as user_login, nvl_title, nvl_status FROM novels n', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            return res.status(200).send({ novels });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function adminUpdateNovel(req, res) {
    const body = req.body;
    novels_model.findByPk(body.id).then(novel => {
        if (novel) {
            if (body.nvl_status === 'Disabled') {
                body.nvl_recommended = 0;
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
                nvl_name: body.nvl_name,
                nvl_publication_date: body.nvl_publication_date,
                nvl_recommended: body.nvl_recommended,
                nvl_writer: body.nvl_writer,
                nvl_translator: body.nvl_translator,
                nvl_translator_eng: body.nvl_translator_eng
            }).then((novel) => {
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
        } else {
            return res.status(404).send({ message: 'No se encuentra la novela indicada' });
        }
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

function adminUpdateNovelVolume(req, res) {
    const body = req.body;
    volumes_model.findByPk(body.id).then(volume => {
        volume.update(body).then(() => {
            return res.status(200).send({ volume });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al actualizar el volumen ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el volumen' + err });
    });
}

function adminDeleteNovelVolume(req, res) {
    const id = req.params.id;
    volumes_model.findByPk(id).then(volume => {
        volume.destroy({
            where: {
                id: id
            }
        }).then(volume => {
            return res.status(200).send({ volume });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el volumen indicado ' + err });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el volumen indicado ' + err });
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
        return res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function adminUpdateChapter(req, res) {
    const body = req.body;
    novels_model.findByPk(body.nvl_id, {
        include: [{
            model: volumes_model,
            as: 'volumes',
            attributes: ['id']
        }],
        attributes: ['nvl_author']
    }).then(novel => {
        const volumes = novel.volumes.map(volume => volume.id);
        if (novel && volumes.includes(Number(body.vlm_id))) {
            chapters_model.findByPk(body.id).then(chapter => {
                if (chapter) {
                    chapter.update(body).then(() => {
                        return res.status(200).send({ chapter });
                    }).catch(err => {
                        return res.status(500).send({ message: 'Ocurrio un error al actualizar el capitulos ' + err });
                    });
                } else {
                    return res.status(404).send({ message: 'Capitulo no encontrado' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al buscar el capitulo' + err });
            });
        } else {
            return res.status(404).send({ message: 'Novela o volumen inexistentes para la actualización del capitulo' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function adminDeleteChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id).then(chapter => {
        if (chapter) {
            chapter.destroy({
                where: {
                    id: id
                }
            }).then(chapter => {
                return res.status(200).send({ chapter });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el capitulo indicado ' + err });
            });
        } else {
            return res.status(404).send({ message: 'Capitulo no encontrado' });
        }
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

function adminGetAdvertisements(req, res) {
    advertisements_model.sequelize.query('SELECT a.*, (SELECT user_login FROM users u WHERE u.id = a.user_id) AS user_login FROM advertisements a', { type: advertisements_model.sequelize.QueryTypes.SELECT })
        .then(advertisements => {
            return res.status(200).send({ advertisements });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error cargar los anuncios' + err });
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
            return res.status(500).send({ message: 'Ocurrio un error cargar el anuncio' + err });
        });
}

function adminCreateAdvertisement(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    advertisements_model.create(body).then(advertisement => {
        return res.status(200).send({ advertisement });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear el anuncio ' + err });
    });
}

function adminUpdateAdvertisement(req, res) {
    const body = req.body;
    advertisements_model.findByPk(body.id).then(advertisement => {
        if (advertisement) {
            advertisement.update(body).then((advertisement) => {
                return res.status(200).send({ advertisement });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el anuncio ' + err });
            });
        } else {
            return res.status(404).send({ message: 'No se encuentra el anuncio indicado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error cargar el anuncio ' + err });
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
                    console.log('error eliminando la imagen de anuncio ' + err);
                } else {
                    console.log('Imagen de anuncio eliminada');
                }
            });
        }
        advertisement.destroy({
            where: {
                id: id
            }
        }).then(advertisement => {
            return res.status(200).send({ advertisement });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al eliminar el anuncio' });
        });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el anuncio a eliminar ' + err });
    });
}

function adminUploadAdvertisementImage(req, res) {
    const id = req.params.id;
    if (req.files) {
        const file_path = req.files.advertisement_image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[3];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];
        if (file_ext == 'jpg') {
            if (req.body.old_advertisement_image) {
                const old_img = req.body.old_advertisement_image;
                old_file_path = './server/uploads/advertisements/' + old_img;
                fs.exists(old_file_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua.' + err });
                            } else {
                                console.log('imagen de anuncio eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de anuncio inexistente.');
                    }
                });
            } else {
                console.log('creating a new image in db');
            }
            const advertisement_image = {};
            advertisement_image.adv_img = file_name;
            advertisements_model.findByPk(id).then(advertisement => {
                advertisement.update(advertisement_image).then(() => {
                    return res.status(200).send({ advertisement });
                }).catch(err => {
                    fs.unlink(file_path, (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                        }
                    });
                    return res.status(500).send({ message: 'Ocurrio un error al actualziar el anuncio.' });
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