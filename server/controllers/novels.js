/*jshint esversion: 6 */
//Models
require('dotenv').config();
const novels_ratings_model = require('../models').novels_ratings;
const novels_model = require('../models').novels;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const users_model = require('../models').users;
const genres_model = require('../models').genres;
//Sequelize
const Sequelize = require('sequelize');
const mariadbHelper = require('../services/mariadbHelper');
const imageService = require('../services/imageService');
const notificationsService = require('../services/notificationsService');

// Novels.

function getHomeNovels(req, res) {
    novels_model.sequelize.query('SELECT n.*, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, (SELECT COUNT(id) FROM novels_ratings WHERE novel_id = n.id) as nvl_ratings_count FROM novels n WHERE n.nvl_status IN ("Active", "Finished") ORDER BY nvl_rating desc LIMIT 10;', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(topNovels => {
            for (const topNovel of topNovels) {
                const plusPointsByVotes = 0.2 * topNovel.nvl_ratings_count;
                topNovel.nvl_rating = Number(topNovel.nvl_rating) + plusPointsByVotes;
            }
            topNovels.sort(function(a, b) {
                return (b.nvl_rating) - (a.nvl_rating);
            });
            novels_model.sequelize.query('SELECT n.*, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating FROM  novels n  WHERE  n.nvl_status IN ("Active", "Finished") ORDER BY n.createdAt desc LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
                .then(recentNovels => {
                    novels_model.sequelize.query('SELECT n.*, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating FROM  novels n  WHERE  n.nvl_status = "Finished" ORDER BY n.createdAt desc LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
                        .then(finishedNovels => {
                            novels_model.sequelize.query('SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) as genres FROM  novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.nvl_status IN ("Active", "Finished") AND n.nvl_recommended = true GROUP BY n.id LIMIT 1', { type: novels_model.sequelize.QueryTypes.SELECT })
                                .then(recommendedNovel => {
                                    recommendedNovel = mariadbHelper.verifyJSON(recommendedNovel, ['genres']);
                                    novels_model.sequelize.query('SELECT n.*, MAX(c.createdAt) AS nvl_last_update FROM novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE  n.nvl_status IN ("Active", "Finished") GROUP BY n.id ORDER BY nvl_last_update DESC LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
                                        .then(updatedNovels => {
                                            return res.status(200).send({ topNovels, recentNovels, recommendedNovel, updatedNovels, finishedNovels });
                                        }).catch(err => {
                                            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas actualizadas' });
                                        });
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error al cargar la novela recomendada' });
                                });
                        }).catch(err => {
                            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas completadas' });
                        });
                }).catch(err => {
                    return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas recientes' });
                });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las top novelas' });
        });
}

function getUpdatedNovelsChapters(req, res) {
    const id = req.params.id;
    chapters_model.sequelize.query('SELECT ch.id, ch.chp_index_title, ch.createdAt, ch.chp_name, ch.nvl_id FROM chapters ch WHERE ch.nvl_id = ? AND ch.chp_status = "Active" ORDER BY createdAt DESC LIMIT 4', { replacements: [id], type: chapters_model.sequelize.QueryTypes.SELECT })
        .then(updatedChapters => {
            return res.status(200).send({ updatedChapters });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar los capitulos de las novelas actualizadas' });
        });
}

function getNovel(req, res) {
    const id = req.params.id;
    let query = '';
    if (req.params.action === 'reading' || req.params.action === 'edition') {
        if (req.params.action === 'reading') {
            query = 'SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))) FROM bookmarks rl WHERE rl.nvl_id = n.id), JSON_ARRAY()) AS bookmarks, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC) AS chapters FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" AND c.vlm_id IS NOT NULL), JSON_ARRAY()))) FROM volumes v WHERE v.nvl_id = n.id), JSON_ARRAY()) as volumes,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "replys_count", (SELECT COUNT(nrr.id) FROM replys nrr WHERE nrr.novel_rating_id = nr.id), "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "image", (SELECT image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) as likes FROM likes l where l.novel_rating_id = nr.id), JSON_ARRAY()))) FROM novels_ratings nr WHERE nr.novel_id = n.id), JSON_ARRAY()) as novel_ratings,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))) FROM novels_collaborators nc where nc.novel_id = n.id), JSON_ARRAY()) as collaborators, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.id = ? AND n.nvl_status IN ("Active", "Finished") GROUP BY n.id';
        } else {
            query = 'SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))) FROM bookmarks rl where rl.nvl_id = n.id), JSON_ARRAY()) as bookmarks, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_translator", c.chp_translator, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status IS NOT NULL ), JSON_ARRAY()))) FROM volumes v where v.nvl_id = n.id), JSON_ARRAY()) as volumes,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "replys_count", (SELECT COUNT(nrr.id) FROM replys nrr WHERE nrr.novel_rating_id = nr.id), "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "image", (SELECT image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) as likes FROM likes l where l.novel_rating_id = nr.id), JSON_ARRAY()))) FROM novels_ratings nr where nr.novel_id = n.id), JSON_ARRAY()) as novel_ratings,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))) FROM novels_collaborators nc where nc.novel_id = n.id), JSON_ARRAY()) as collaborators,IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n LEFT JOIN chapters c ON c.nvl_id = n.id WHERE n.id = ? GROUP BY n.id';
        }
    } else {
        return res.status(500).send({ message: 'petición invalida' });
    }
    novels_model.sequelize.query(query, { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT }).then(novel => {
        if (novel.length > 0) {
            novel = mariadbHelper.verifyJSON(novel, ['bookmarks', 'volumes', 'novel_ratings', 'collaborators', 'genres']);
            novel[0].volumes = mariadbHelper.verifyJSON(novel[0].volumes, ['chapters']);
            novel[0].novel_ratings = mariadbHelper.verifyJSON(novel[0].novel_ratings, ['likes']);
            if (req.params.action === 'edition') {
                const collaborators = novel[0].collaborators.map(collaborator => collaborator.user_id);
                if (req.user && (req.user.id === novel[0].nvl_author || collaborators.includes(req.user.id)) && (req.user.user_rol === 'Editor' || req.user.user_rol === 'Admin')) {
                    const authorized_user = req.user.id;
                    return res.status(200).send({ novel, authorized_user });
                } else {
                    return res.status(401).send({ message: 'No autorizado ' });
                }
            } else {
                if (novel[0].volumes && novel[0].volumes.length > 0) {
                    const activeVolumes = [];
                    for (const volume of novel[0].volumes) {
                        if (volume.chapters.length > 0) {
                            activeVolumes.push(volume);
                        }
                    }
                    novel[0].volumes = activeVolumes;
                    if (activeVolumes.length > 0) {
                        return res.status(200).send({ novel });
                    } else {
                        return res.status(404).send({ message: 'No se encontro ninguna novela' });
                    }
                } else {
                    return res.status(404).send({ message: 'No se encontro ninguna novela' });
                }
            }
        } else {
            return res.status(404).send({ message: 'No se encontro ninguna novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function getNovels(req, res) {
    novels_model.sequelize.query('SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((select AVG(nr.rate_value) from novels_ratings nr where nr.novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.nvl_status IN ("Active", "Finished") GROUP BY n.id', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(ActiveNovels => {
            ActiveNovels = mariadbHelper.verifyJSON(ActiveNovels, ['genres']);
            const novels = [];
            for (const novel of ActiveNovels) {
                if (novel.nvl_chapters > 0 && novel.genres.length > 0) {
                    novels.push(novel);
                }
            }
            if (novels.length > 0) {
                return res.status(200).send({ novels });
            } else {
                return res.status(404).send({ message: 'No se encontraron novelas activas' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas' });
        });
}

function createNovel(req, res) {
    const body = req.body;
    body.nvl_author = req.user.id;
    novels_model.create(body).then(novel => {
        if (body.genres && body.genres.length > 0) {
            novel.setGenres(body.genres);
        }
        return res.status(201).send({ novel });
    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error al crear la novela ' });
        }
    });
}

function updateNovel(req, res) {
    const body = req.body;
    novels_model.findByPk(body.id).then(novel => {
        novels_model.sequelize.query('SELECT user_id FROM novels_collaborators WHERE novel_id = ' + novel.id, { type: novels_model.sequelize.QueryTypes.SELECT })
            .then(collaboratorsNovel => {
                chapters_model.sequelize.query('SELECT id, chp_status FROM chapters WHERE nvl_id = ?', { replacements: [novel.id], type: chapters_model.sequelize.QueryTypes.SELECT })
                    .then(novelsChapters => {
                        const chapterNovels = novelsChapters.map(chapter => chapter.chp_status);
                        if (novelsChapters.length <= 0 || chapterNovels.includes('Active') === false) {
                            body.nvl_status = 'Disabled';
                        }
                        const novelCollaborators = collaboratorsNovel.map(collaborator => collaborator.user_id);
                        if (req.user && (req.user.id === novel.nvl_author || novelCollaborators.includes(req.user.id))) {
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
                        } else {
                            return res.status(401).send({ message: 'No autorizado' });
                        }
                    }).catch(err => {
                        return res.status(500).send({ message: 'Ocurrio un error al cargar los capítulos de la novela' });
                    });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar los colaboradores de la novela' });
            });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function uploadNovelImage(req, res) {
    const id = req.params.id;
    novels_model.findByPk(id, {
        include: [{
            model: users_model,
            as: 'collaborators',
            attributes: ['id'],
            through: { attributes: [] },
        }]
    }).then(novel => {
        const collaborators = novel.collaborators.map(collaborator => collaborator.id);
        if ((novel.nvl_author === req.user.id || collaborators.includes(req.user.id)) && req.files) {
            imageService.uploadImage(novel, 'novels', req.files).then((image) => {
                return res.status(200).send({ image: image });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al subir la imagen' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'No existe la novela.' });
    });
}

function deleteNovel(req, res) {
    const id = req.params.id;
    novels_model.findByPk(id).then((novel) => {
        if (novel.nvl_author === req.user.id) {
            if (novel.dataValues.image !== '' && novel.dataValues.image !== null) {
                imageService.deleteImage(novel.dataValues.image, './server/uploads/novels', true);
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
        } else {
            return res.status(401).send({ message: 'No autorizado a eliminar la novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela a eliminar' + err });
    });
}


// Novels chapters
function getChapter(req, res) {
    const id = req.params.id;
    chapters_model.sequelize.query('SELECT *, (SELECT user_login FROM users u WHERE u.id = c.chp_author) AS user_login, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", cms.id, "comment_content", cms.comment_content, "replys_count", (SELECT COUNT(cr.id) FROM replys cr WHERE cr.comment_id = cms.id), "user_id", cms.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = cms.user_id), "image", (SELECT image FROM users u WHERE u.id = cms.user_id), "createdAt", cms.createdAt, "updatedAt", cms.updatedAt, "likes_count", (SELECT COUNT(id) FROM likes l WHERE l.comment_id = cms.id), "likes", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "comment_id", l.comment_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = l.user_id))) FROM likes l WHERE l.comment_id = cms.id), JSON_ARRAY()))) FROM comments cms WHERE cms.chp_id = c.id), JSON_ARRAY()) AS comments FROM chapters c WHERE c.id = ? AND c.chp_status="Active"', { replacements: [id], type: chapters_model.sequelize.QueryTypes.SELECT })
        .then(chapter => {
            if (chapter.length > 0) {
                chapter = mariadbHelper.verifyJSON(chapter, ['comments']);
                chapter[0].comments = mariadbHelper.verifyJSON(chapter[0].comments, ['likes']);
                return res.status(200).send({ chapter });
            } else {
                return res.status(404).send({ message: 'No se encuentra ningún capitulo' });
            }
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
        });
}

function getChapterEdition(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['nvl_author'],
            include: [{
                model: users_model,
                as: 'collaborators',
                attributes: ['id', 'user_login']
            }]
        }]
    }).then(chapter => {
        if (chapter) {
            const collaborators = chapter.novel.collaborators.map(collaborator => collaborator.id);
            if (req.user && (req.user.id === chapter.novel.nvl_author || collaborators.includes(req.user.id))) {
                return res.status(200).send({ chapter });
            } else {
                return res.status(401).send({ message: 'No autorizado' });
            }
        } else {
            return res.status(404).send({ message: 'Capitulo no encontrado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo' });
    });
}

function getNovelChapters(req, res) {
    const id = req.params.id;
    const query = 'SELECT n.id, n.nvl_author, n.nvl_title, n.nvl_name, n.nvl_writer, n.nvl_acronym, n.nvl_translator, n.image, n.createdAt, n.updatedAt, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) AS user_login, IFNULL(JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), JSON_ARRAY()) AS chapters, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id)) FROM bookmarks rl WHERE rl.nvl_id = n.id), JSON_ARRAY()) AS bookmarks, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nr.user_id, "id", nr.id)) FROM novels_ratings nr WHERE nr.novel_id = n.id), JSON_ARRAY()) AS novel_ratings FROM novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.id = ? AND n.nvl_status IN ("Active", "Finished")';
    novels_model.sequelize.query(query, { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novel => {
            novel = mariadbHelper.verifyJSON(novel, ['chapters', 'bookmarks', 'novel_ratings']);
            if (novel.length > 0 && novel[0].chapters.length > 0) {
                novel[0].chapters.sort(function(a, b) {
                    return (a.chp_number) - (b.chp_number);
                });
                return res.status(200).send({ novel });
            } else {
                return res.status(404).send({ message: 'No se encuentra la novela indicada' });
            }

        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error al cargar los capitulos de la novela' });
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
            },
            {
                model: volumes_model,
                as: 'volumes',
                attributes: ['id']
            }
        ],
        attributes: ['nvl_author']
    }).then(novel => {
        const collaborators = novel.collaborators.map(collaborator => collaborator.id);
        const volumes = novel.volumes.map(volume => volume.id);
        if (novel && volumes.includes(Number(body.vlm_id))) {
            if (req.user.id === novel.nvl_author || collaborators.includes(req.user.id)) {
                chapters_model.create(body).then(chapter => {
                    return res.status(201).send({ chapter });
                }).catch(err => {
                    if (err && err.errors && err.errors[0].message) {
                        return res.status(400).send({ message: err.errors[0].message });
                    } else {
                        return res.status(500).send({ message: 'Ocurrio un error al crear el capitulo' });
                    }
                });
            } else {
                return res.status(401).send({ message: 'No autorizado a crear capitulos para esta novela' });
            }
        } else {
            return res.status(404).send({ message: 'Novela o volumen inexistentes para la creación del capitulo' });
        }

    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}



function updateChapter(req, res) {
    const body = req.body;
    chapters_model.findByPk(body.id).then(chapter => {
        if (chapter) {
            novels_model.findByPk(chapter.nvl_id, {
                include: [{
                        model: users_model,
                        as: 'collaborators',
                        attributes: ['id', 'user_login'],
                        through: { attributes: [] },
                    },
                    {
                        model: volumes_model,
                        as: 'volumes',
                        attributes: ['id']
                    }
                ]
            }).then(novel => {
                const collaborators = novel.collaborators.map(collaborator => collaborator.id);
                const volumes = novel.volumes.map(volume => volume.id);
                if (novel && (!body.vlm_id || volumes.includes(Number(body.vlm_id)))) {
                    if (req.user.id === novel.nvl_author || collaborators.includes(req.user.id)) {
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
                        return res.status(401).send({ message: 'No autorizado' });
                    }
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

function deleteChapter(req, res) {
    const id = req.params.id;
    chapters_model.findByPk(id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['id', 'nvl_author', 'nvl_status']
        }]
    }).then(chapter => {
        const novel_id = chapter.novel.id;
        if (req.user.id === chapter.novel.nvl_author || req.user.id === chapter.chp_author) {
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
        } else {
            return res.status(401).send({ message: 'No autorizado a eliminar el capitulo' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar el capitulo a eliminar' });
    });
}

// Genres

function getGenres(req, res) {
    genres_model.findAll({
        order: [
            ['genre_name', 'ASC']
        ]
    }).then(genres => {
        for (const genre of genres) {
            if (genre.genre_name === 'Sin genero indicado') {
                genres.push(genres.splice(genres.indexOf(genre), 1)[0]);
                break;
            } else {
                continue;
            }
        }
        return res.status(200).send({ genres });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar los generos de novelas' });
    });
}

// Novels ratings

function createNovelRating(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings_model.create(body).then(novel_rating => {
        novels_model.sequelize.query(`SELECT user_id FROM novels_collaborators WHERE novel_id = ${novel_rating.novel_id} UNION (SELECT nvl_author FROM novels WHERE id = ${novel_rating.novel_id})`, { type: novels_model.sequelize.QueryTypes.SELECT })
            .then((novel_editors) => {
                for (let editor of novel_editors) {
                    if (req.user.id !== editor.user_id) {
                        notificationsService.createNotification(editor.user_id, novel_rating.id, 'novel_rating_id');
                    }
                }
            });
        return res.status(200).send({ novel_rating });
    }).catch(err => {
        if (err && err.errors && err.errors[0].message) {
            return res.status(400).send({ message: err.errors[0].message });
        } else {
            return res.status(500).send({ message: 'Ocurrio un error al crear la puntuación para la novela' });
        }
    });
}

function updateNovelRating(req, res) {
    const body = req.body;
    novels_ratings_model.findByPk(body.id).then(novel_rating => {
        if (req.user.id === novel_rating.user_id) {
            novel_rating.update({
                rate_comment: body.rate_comment
            }).then(() => {
                return res.status(200).send({ novel_rating });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar la puntuación de la novela' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la puntuación de la novela' });
    });
}

function deleteNovelRating(req, res) {
    const id = req.params.id;
    novels_ratings_model.findByPk(id).then(novel_rating => {
        if (req.user.id === novel_rating.user_id) {
            novel_rating.destroy({
                where: {
                    id: id
                }
            }).then(novel_rating => {
                return res.status(200).send({ novel_rating });
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la puntuación de la novela' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la puntuación de la novela' });
    });
}

// Volumes

function createNovelVolume(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
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
            volumes_model.create(body).then(volume => {
                return res.status(200).send({ volume });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al crear el volumen' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a crear volumenes para esta novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' });
    });
}

function updateNovelVolume(req, res) {
    const body = req.body;
    volumes_model.findByPk(body.id, {
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['nvl_author'],
            include: [{
                model: users_model,
                as: 'collaborators',
                attributes: ['id'],
                through: { attributes: [] },
            }],
        }],
    }).then(volume => {
        const collaborators = volume.novel.collaborators.map(collaborator => collaborator.id);
        if (req.user.id === volume.novel.nvl_author || collaborators.includes(req.user.id)) {
            volume.update({
                vlm_title: body.vlm_title
            }).then(() => {
                return res.status(200).send({ volume });
            }).catch(err => {
                if (err && err.errors && err.errors[0].message) {
                    return res.status(400).send({ message: err.errors[0].message });
                } else {
                    return res.status(500).send({ message: 'Ocurrio un error al actualizar el volumen' });
                }
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a actualizar el volumen para esta novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el volumen' });
    });
}

function deleteNovelVolume(req, res) {
    const id = req.params.id;
    chapters_model.findAll({
        where: {
            vlm_id: id
        }
    }).then(chapters => {
        if (chapters.length > 0) {
            return res.status(405).send({ message: 'No se puede eliminar un volumen con capitulos asociados' });
        } else {
            volumes_model.findByPk(id, {
                include: [{
                    model: novels_model,
                    as: 'novel',
                    attributes: ['nvl_author']
                }]
            }).then(volume => {
                if (req.user.id === volume.novel.nvl_author || req.user.id === volume.user_id) {
                    volume.destroy({
                        where: {
                            id: id
                        }
                    }).then(volume => {
                        return res.status(200).send({ volume });
                    }).catch(err => {
                        return res.status(500).send({ message: 'Ocurrio un error al eliminar el volumen indicado' });
                    });
                } else {
                    return res.status(401).send({ message: 'No autorizado' });
                }
            }).catch(err => {
                return res.status(500).send({ message: 'Ocurrio un error al cargar el volumen indicado' });
            });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar los capítulos del volumen' });
    });
}

function getTest(req, res) {
    novels_model.sequelize.query('SELECT n.*, COUNT(c.id) AS nvl_chapters, MAX(c.createdAt) AS nvl_last_update, ROUND((SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id), 1) as nvl_rating, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))) FROM bookmarks rl WHERE rl.nvl_id = n.id), JSON_ARRAY()) AS bookmarks, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC) AS chapters FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" AND c.vlm_id IS NOT NULL), JSON_ARRAY()))) FROM volumes v WHERE v.nvl_id = n.id), JSON_ARRAY()) as volumes,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "replys_count", (SELECT COUNT(nrr.id) FROM replys nrr WHERE nrr.novel_rating_id = nr.id), "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "image", (SELECT image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))) as likes FROM likes l where l.novel_rating_id = nr.id), JSON_ARRAY()))) FROM novels_ratings nr WHERE nr.novel_id = n.id), JSON_ARRAY()) as novel_ratings,  IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))) FROM novels_collaborators nc where nc.novel_id = n.id), JSON_ARRAY()) as collaborators, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))) FROM genres_novels gn where gn.novel_id = n.id), JSON_ARRAY()) AS genres FROM novels n left JOIN chapters c ON c.nvl_id = n.id AND c.chp_status = "Active" WHERE n.id = 2 AND n.nvl_status IN ("Active", "Finished")', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(test => {
            return res.status(200).send({ test });
        }).catch(err => {
            return res.status(500).send({ message: 'Ocurrio un error en el test ' + err });
        });
}



module.exports = {
    // Home
    getHomeNovels,
    getUpdatedNovelsChapters,
    // Novels
    getNovel,
    getNovels,
    createNovel,
    updateNovel,
    uploadNovelImage,
    deleteNovel,
    // Volumes
    createNovelVolume,
    updateNovelVolume,
    deleteNovelVolume,
    // Chapters
    getChapter,
    getChapterEdition,
    getNovelChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    // Genres
    getGenres,
    // Novel ratings
    createNovelRating,
    updateNovelRating,
    deleteNovelRating,
    // tests
    getTest
};