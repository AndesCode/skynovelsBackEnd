/*jshint esversion: 6 */
//Models
const novels_ratings_model = require('../models').novels_ratings;
const novels_model = require('../models').novels;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const users_model = require('../models').users;
const genres_model = require('../models').genres;
const bookmarks_model = require('../models').bookmarks;
const novels_ratings_likes_model = require('../models').novels_ratings_likes;
const novels_ratings_comments_likes_model = require('../models').novels_ratings_comments_likes;
const novels_ratings_comments_model = require('../models').novels_ratings_comments;
const chapters_comments_likes_model = require('../models').chapters_comments_likes;
const chapters_comments_model = require('../models').chapters_comments;
// More requires
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');
//Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Novels

function getNovel(req, res) {
    const id = req.params.id;
    let novel_activity = '';
    let private_query = '';
    if (req.params.action === 'reading' || req.params.action === 'edition') {
        if (req.params.action === 'reading') {
            novel_activity = ' = "Active"';
            private_query = 'AND n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL) IS NOT NULL';

        } else {
            //novel_activity = ' = "Active"';
            novel_activity = ' IS NOT NULL ';
        }
    } else {
        return res.status(500).send({ message: 'petición invalida' });
    }
    novels_model.sequelize.query('SELECT n.*, (SELECT (SELECT COUNT(c.id) FROM chapters c WHERE c.vlm_id = v.id LIMIT 1) FROM volumes v WHERE v.nvl_id = n.id) AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id ORDER BY c.createdAt DESC LIMIT 1) FROM volumes v WHERE v.nvl_id = n.id) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "bkm_chapter", rl.bkm_chapter)), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "chapters", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) as chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status' + novel_activity + '), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM volumes v where v.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as volumes,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", nrl.id, "user_id", nrl.user_id, "user_login", (SELECT user_login FROM users u where u.id = nrl.user_id))), "]"), JSON) as likes FROM novels_ratings_likes nrl where nrl.novel_rating_id = nr.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as novel_ratings,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))), "]"), JSON) FROM novels_collaborators nc where nc.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as collaborators,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.id = ?' + private_query, { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novel => {
            if (novel.length > 0) {
                if (req.params.action === 'edition') {
                    const collaborators = novel[0].collaborators.map(collaborator => collaborator.user_id);
                    if (req.user && (req.user.id === novel[0].nvl_author || collaborators.includes(req.user.id))) {
                        const authorized_user = req.user.id;
                        return res.status(200).send({ novel, authorized_user });
                    } else {
                        return res.status(401).send({ message: 'No autorizado ' });
                    }
                } else {
                    if (novel[0].volumes && novel[0].volumes.length > 0) {
                        return res.status(200).send({ novel });
                    } else {
                        return res.status(404).send({ message: 'No se encontro ninguna novela' });
                    }
                }
            } else {
                return res.status(404).send({ message: 'No se encontro ninguna novela' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
        });
}

// Función de prueba, borrar posteriormente
function getnovelsTest(req, res) {
    const id = 23;
    novels_model.sequelize.query('SELECT id, nvl_author, nvl_title, nvl_writer, nvl_translator, nvl_img, createdAt, updatedAt, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) AS user_login, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_number", c.chp_number, "chp_index_title", c.chp_index_title) ORDER BY c.chp_number ASC), "]"), JSON) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), CONVERT(CONCAT("[]"), JSON)) AS chapters FROM novels n where n.id = 23', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            res.status(200).send({ novels });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al buscar la novela' });
        });
}

function getNovels(req, res) {
    novels_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id ORDER BY c.createdAt DESC LIMIT 1) FROM volumes v WHERE v.nvl_id = n.id) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.nvl_status = "Active" AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL) IS NOT NULL', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            return res.status(200).send({ novels });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function createNovel(req, res) {
    const body = req.body;
    body.nvl_author = req.user.id;
    novels_model.create(body).then(novel => {
        if (body.genres && body.genres.length > 0) {
            novel.setGenres(body.genres);
        }
        return res.status(200).send({ novel });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al guardar la novela ' + err });
    });
}

function updateNovel(req, res) {
    let body = req.body;
    novels_model.findByPk(body.id).then(novel => {
        if (novel.nvl_publication_date === null && body.nvl_status === 'Publicada') {
            body.nvl_publication_date = Sequelize.fn('NOW');
        }
        if (novel.nvl_author === req.user.id) {
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
        } else {
            return res.status(500).send({ message: 'No autorizado' });
        }

    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function uploadNovelImage(req, res) {
    var id = req.params.id;
    if (req.files) {
        var file_path = req.files.novel_image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[3];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        if (file_ext == 'jpg') {
            if (req.body.old_novel_image) {
                console.log('deleting old image from the novel');
                var old_img = req.body.old_novel_image;
                old_file_path = './server/uploads/novels/' + old_img;
                old_file_thumb_path = './server/uploads/novels/thumbs/' + old_img;
                console.log(old_file_path);
                console.log(old_file_thumb_path);
                fs.exists(old_file_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua.' + err });
                            } else {
                                console.log('imagen de novela eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de novela inexistente.');
                    }
                });
                fs.exists(old_file_thumb_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_thumb_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al eliminar el thumb antiguo.' + err });
                            } else {
                                console.log('thumb de novela eliminada');
                            }
                        });
                    } else {
                        console.log('archivo con el nombre de imagen de novela inexistente.');
                    }
                });
            } else {
                console.log('creating a new image in db');
            }
            var novel_image = {};
            novel_image.nvl_img = file_name;

            novels_model.findByPk(id).then(novel => {
                if (novel.nvl_author === req.user.id) {
                    novel.update(novel_image).then(() => {

                        var newPath = './server/uploads/novels/' + file_name;
                        var thumbPath = './server/uploads/novels/thumbs';

                        thumb({
                            source: path.resolve(newPath),
                            destination: path.resolve(thumbPath),
                            width: 210,
                            height: 280,
                            suffix: ''
                        }).then(() => {
                            return res.status(200).send({ novel });
                        }).catch(err => {
                            fs.unlink(file_path, (err) => {
                                if (err) {
                                    return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                                }
                            });
                            return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail.' });
                        });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                            }
                        });
                        return res.status(500).send({ message: 'Ocurrio un error al actualziar la novela.' });
                    });
                } else {
                    return res.status(401).send({ message: 'No autorizado a cambiar la imagen de la novela' });
                }
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                    }
                });
                return res.status(500).send({ message: 'No existe la novela.' });
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
        return res.status(400).send({ message: 'Debe Seleccionar una novela.' });
    }
}

function getNovelImage(req, res) {
    var image = req.params.novel_img;
    var thumb = req.params.thumb;
    var img_path = null;

    if (thumb == "false") {
        img_path = './server/uploads/novels/' + image;
    } else if (thumb == "true") {
        img_path = './server/uploads/novels/thumbs/' + image;
    }

    fs.exists(img_path, (exists) => {
        if (exists) {
            return res.status(200).sendFile(path.resolve(img_path));
        } else {
            return res.status(404).send({ message: "No se encuentra la imagen de novela" });
        }
    });
}

function deleteNovel(req, res) {
    var id = req.params.id;
    novels_model.findByPk(id).then((novel) => {
        if (novel.nvl_author === req.user.id) {
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
        } else {
            return res.status(401).send({ message: 'No autorizado a eliminar la novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al encontrar la novela a eliminar ' });
    });
}


// Novels chapters

function getChapter(req, res) {
    const id = req.params.id;
    chapters_model.sequelize.query('SELECT *,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", cc.id, "chapter_comment", cc.chapter_comment, "user_id", cc.user_id, "user_login", (SELECT user_login FROM users u where u.id = cc.user_id), "createdAt", cc.createdAt, "updatedAt", cc.updatedAt, "likes_count", (SELECT COUNT(id) FROM chapters_comments_likes ccl where ccl.chapter_comment_id = cc.id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", ccl.id, "chapter_comment_id", ccl.chapter_comment_id, "user_id", ccl.user_id, "user_login", (SELECT user_login FROM users u where u.id = ccl.user_id))), "]"), JSON) FROM chapters_comments_likes ccl where ccl.chapter_comment_id = cc.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM chapters_comments cc where cc.chapter_id = c.id), CONVERT(CONCAT("[]"), JSON)) as comments FROM chapters c where c.id = ?', { replacements: [id], type: chapters_model.sequelize.QueryTypes.SELECT })
        .then(chapter => {
            return res.status(200).send({ chapter });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function getNovelChapters(req, res) {
    const id = req.params.id;
    novels_model.sequelize.query('SELECT id, nvl_author, nvl_title, nvl_name, nvl_writer, nvl_acronym, nvl_translator, nvl_img, createdAt, updatedAt, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) AS user_login, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), CONVERT(CONCAT("[]"), JSON)) AS chapters, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "bkm_chapter", rl.bkm_chapter)), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "id", nr.id)), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as novel_ratings FROM novels n where n.id = ? AND n.nvl_status IN ("Active", "Finished")', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novel => {
            if (novel.length > 0) {
                return res.status(200).send({ novel });
            } else {
                return res.status(404).send({ message: 'No se encuentra la novela que buscas' });
            }

        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function createChapter(req, res) {
    const body = req.body;
    body.chp_author = req.user.id;
    novels_model.findByPk(body.nvl_id, {
        include: [{
            model: users_model,
            as: 'collaborators',
            attributes: ['id', 'user_login'],
            through: { attributes: [] },
        }],
        attributes: ['nvl_author']
    }).then(novel => {
        const collaborators = novel.collaborators.map(collaborator => collaborator.id);
        if (req.user.id === novel.nvl_author || collaborators.includes(req.user.id)) {
            chapters_model.create(body).then(chapter => {
                return res.status(200).send({ chapter });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al guardar la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a crear capitulos para esta novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function updateChapter(req, res) {
    const body = req.body;
    chapters_model.findByPk(body.id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['nvl_author']
        }]
    }).then(chapter => {
        if (req.user.id === chapter.novel.nvl_author || req.user.id === chapter.chp_author) {
            chapter.update(body).then(() => {
                return res.status(200).send({ chapter });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el capitulos ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a actualizar el capitulo para esta novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function deleteChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['nvl_author']
        }]
    }).then(chapter => {
        if (req.user.id === chapter.novel.nvl_author || req.user.id === chapter.chp_author) {
            chapter.destroy({
                where: {
                    id: id
                }
            }).then(chapter => {
                return res.status(200).send({ chapter });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a eliminar el capitulo' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function createChapterComment(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    chapters_comments_model.create(body).then(chapter_comment => {
        return res.status(200).send({ chapter_comment });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear el comentario para el capitulo ' + err });
    });
}

function getChapterComments(req, res) {
    const id = req.params.id;
    chapters_comments_model.sequelize.query('SELECT *, (SELECT user_login FROM users u where u.id = cc.user_id) as user_login, (SELECT COUNT(id) FROM chapters_comments_likes ccl where ccl.chapter_comment_id = cc.id) as likes_count, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", ccl.id, "chapter_comment_id", ccl.chapter_comment_id, "user_id", ccl.user_id, "user_login", (SELECT user_login FROM users u where u.id = ccl.user_id))), "]"), JSON) FROM chapters_comments_likes ccl where ccl.chapter_comment_id = cc.id), CONVERT(CONCAT("[]"), JSON)) as likes FROM chapters_comments cc WHERE cc.chapter_id = ? ORDER BY likes_count DESC', { replacements: [id], type: chapters_comments_model.sequelize.QueryTypes.SELECT })
        .then(chapters_comments => {
            return res.status(200).send({ chapters_comments });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function updateChapterComment(req, res) {
    var body = req.body;
    chapters_comments_model.findByPk(body.id).then(chapter_comment => {
        if (req.user.id === chapter_comment.user_id) {
            chapter_comment.update(body).then(() => {
                return res.status(200).send({ chapter_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario de la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario de la clasificacion de la novela ' + err });
    });
}

function deleteChapterComment(req, res) {
    var id = req.params.id;
    console.log(id);
    chapters_comments_model.findByPk(id).then(chapter_comment => {
        if (req.user.id === chapter_comment.user_id) {
            chapter_comment.destroy({
                where: {
                    id: id
                }
            }).then(chapter_comment => {
                return res.status(200).send({ chapter_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el comentario de la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el comentario de la clasificacion de la novela ' + err });
    });
}

// Genres

function getGenres(req, res) {
    genres_model.findAll().then(genres => {
        return res.status(200).send({ genres });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar los generos' + err });
    });
}

function createNovelRating(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings_model.create(body).then(novel_rating => {
        return res.status(200).send({ novel_rating });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear clasificacion de la novela ' + err });
    });
}

function updateNovelRating(req, res) {
    var body = req.body;
    novels_ratings_model.findByPk(body.id).then(novel_rating => {
        if (req.user.id === novel_rating.user_id) {
            novel_rating.update(body).then(() => {
                return res.status(200).send({ novel_rating });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

function deleteNovelRating(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings_model.findByPk(id).then(novel_rating => {
        if (req.user.id === novel_rating.user_id) {
            novel_rating.destroy({
                where: {
                    id: id
                }
            }).then(novel_rating => {
                return res.status(200).send({ novel_rating });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

function createNovelRatingComment(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings_comments_model.create(body).then(novel_rating_comment => {
        return res.status(200).send({ novel_rating_comment });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear el comentario para la calificación ' + err });
    });
}

function getNovelRatingComments(req, res) {
    const id = req.params.id;
    novels_ratings_comments_model.sequelize.query('SELECT *, (SELECT user_login FROM users u where u.id = nrc.user_id) as user_login, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", nrcl.id, "novel_rating_comment_id", nrcl.novel_rating_comment_id, "user_id", nrcl.user_id, "user_login", (SELECT user_login FROM users u where u.id = nrcl.user_id))), "]"), JSON) FROM novels_ratings_comments_likes nrcl where nrcl.novel_rating_comment_id = nrc.id), CONVERT(CONCAT("[]"), JSON)) as likes FROM novels_ratings_comments nrc WHERE nrc.novel_rating_id = ?', { replacements: [id], type: novels_ratings_comments_model.sequelize.QueryTypes.SELECT })
        .then(novel_rating_comments => {
            return res.status(200).send({ novel_rating_comments });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
        });
}

function updateNovelRatingComment(req, res) {
    var body = req.body;
    novels_ratings_comments_model.findByPk(body.id).then(novel_rating_comment => {
        if (req.user.id === novel_rating_comment.user_id) {
            novel_rating_comment.update(body).then(() => {
                return res.status(200).send({ novel_rating_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario de la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al actualizar el comentario de la clasificacion de la novela ' + err });
    });
}

function deleteNovelRatingComment(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings_comments_model.findByPk(id).then(novel_rating_comment => {
        if (req.user.id === novel_rating_comment.user_id) {
            novel_rating_comment.destroy({
                where: {
                    id: id
                }
            }).then(novel_rating_comment => {
                return res.status(200).send({ novel_rating_comment });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el comentario de la clasificacion de la novela ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el comentario de la clasificacion de la novela ' + err });
    });
}

function createNovelRatingCommentLike(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings_comments_likes_model.create(body).then(novel_rating_comment_like => {
        return res.status(200).send({ novel_rating_comment_like });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al asignar el "Me gusta" ' + err });
    });
}

function deleteNovelCommentRatingLike(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings_comments_likes_model.findByPk(id).then(novel_rating_comment_like => {
        if (req.user.id === novel_rating_comment_like.user_id) {
            novel_rating_comment_like.destroy({
                where: {
                    id: id
                }
            }).then(novel_rating_comment_like => {
                return res.status(200).send({ novel_rating_comment_like });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el "Me gusta" ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

function createNovelRatingLike(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings_likes_model.create(body).then(novel_rating_like => {
        return res.status(200).send({ novel_rating_like });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al asignar el "Me gusta" ' + err });
    });
}

function deleteNovelRatingLike(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings_likes_model.findByPk(id).then(novel_rating_like => {
        if (req.user.id === novel_rating_like.user_id) {
            novel_rating_like.destroy({
                where: {
                    id: id
                }
            }).then(novel_rating_like => {
                return res.status(200).send({ novel_rating_like });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el "Me gusta" ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

function createChapterCommentLike(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    chapters_comments_likes_model.create(body).then(chapter_comment_like => {
        return res.status(200).send({ chapter_comment_like });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al asignar el "Me gusta" ' + err });
    });
}

function deleteChapterCommentLike(req, res) {
    var id = req.params.id;
    console.log(id);
    chapters_comments_likes_model.findByPk(id).then(chapter_comment_like => {
        if (req.user.id === chapter_comment_like.user_id) {
            chapter_comment_like.destroy({
                where: {
                    id: id
                }
            }).then(chapter_comment_like => {
                return res.status(200).send({ chapter_comment_like });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar el "Me gusta" ' + err });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

module.exports = {
    // Novels
    getNovel,
    getNovels,
    createNovel,
    updateNovel,
    uploadNovelImage,
    getNovelImage,
    deleteNovel,
    // Chapters
    getChapter,
    getNovelChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    // Chapters comments
    createChapterComment,
    getChapterComments,
    updateChapterComment,
    deleteChapterComment,
    // Genres
    getGenres,
    // Novel ratings
    createNovelRating,
    updateNovelRating,
    deleteNovelRating,
    // Novel ratings comments
    createNovelRatingComment,
    getNovelRatingComments,
    updateNovelRatingComment,
    deleteNovelRatingComment,
    // Likes
    createNovelRatingLike,
    deleteNovelRatingLike,
    createNovelRatingCommentLike,
    deleteNovelCommentRatingLike,
    createChapterCommentLike,
    deleteChapterCommentLike,
    // test
    getnovelsTest
};