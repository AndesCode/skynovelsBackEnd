/*jshint esversion: 6 */
//Models
const novels_ratings_model = require('../models').novels_ratings;
const novels_model = require('../models').novels;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const users_model = require('../models').users;
const genres_model = require('../models').genres;
// files mannager
const fs = require('fs');
// const thumb = require('node-thumbnail').thumb; // quitar esto
const imageThumbnail = require('image-thumbnail');
const path = require('path');
//Sequelize
const Sequelize = require('sequelize');


// Novels

function getHomeNovels(req, res) {
    novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id) AS chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL ORDER BY nvl_rating desc LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(topNovels => {
            novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id) AS chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL ORDER BY n.createdAt desc LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
                .then(recentNovels => {
                    novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active") AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND n.nvl_recommended = true LIMIT 1', { type: novels_model.sequelize.QueryTypes.SELECT })
                        .then(recommendedNovel => {
                            novels_model.sequelize.query('SELECT n.*, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update FROM novels n  WHERE  n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL ORDER BY nvl_last_update DESC LIMIT 10', { type: novels_model.sequelize.QueryTypes.SELECT })
                                .then(updatedNovels => {
                                    return res.status(200).send({ topNovels, recentNovels, recommendedNovel, updatedNovels });
                                }).catch(err => {
                                    return res.status(500).send({ message: 'Ocurrio un error al cargar las novelas actualizadas' });
                                });
                        }).catch(err => {
                            return res.status(500).send({ message: 'Ocurrio un error al cargar la novela recomendada' });
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
            query = 'SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active") AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active"), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM volumes v WHERE v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1)), CONVERT(CONCAT("[]"), JSON)) as volumes,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))), "]"), JSON) as likes FROM likes l where l.novel_rating_id = nr.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as novel_ratings,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))), "]"), JSON) FROM novels_collaborators nc where nc.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as collaborators,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n WHERE  n.id = ? AND n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL';
        } else {
            query = 'SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id) AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id, "chp_name", (SELECT chp_name FROM chapters ch WHERE ch.id = rl.chp_id))), "]"), JSON) FROM bookmarks rl where rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "id", v.id, "nvl_id", v.nvl_id, "user_id", v.user_id,"chapters", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) AS chapters FROM chapters c where c.vlm_id = v.id AND c.chp_status IS NOT NULL ), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM volumes v where v.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) as volumes,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id), "user_profile_image", (SELECT user_profile_image FROM users u where u.id = nr.user_id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", l.id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u where u.id = l.user_id))), "]"), JSON) as likes FROM likes l where l.novel_rating_id = nr.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as novel_ratings,  IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nc.user_id, "user_login", (SELECT user_login FROM users u where u.id = nc.user_id))), "]"), JSON) FROM novels_collaborators nc where nc.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as collaborators,IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM  novels n  WHERE  n.id = ?';
        }
    } else {
        return res.status(500).send({ message: 'petición invalida' });
    }
    novels_model.sequelize.query(query, { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT }).then(novel => {
        if (novel.length > 0) {
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
                    return res.status(200).send({ novel });
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
    novels_model.sequelize.query('SELECT n.*, (SELECT COUNT(c.id) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active") AS nvl_chapters, (SELECT (SELECT createdAt FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" ORDER BY c.createdAt DESC LIMIT 1) AS recentChapter FROM volumes v WHERE v.nvl_id = n.id ORDER BY recentChapter DESC LIMIT 1) AS nvl_last_update, (SELECT AVG(rate_value) FROM novels_ratings where novel_id = n.id) as nvl_rating, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", gn.genre_id, "genre_name", (SELECT genre_name FROM genres g where g.id = gn.genre_id))), "]"), JSON) FROM genres_novels gn where gn.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) as genres FROM novels n WHERE n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v where v.nvl_id = n.id AND (SELECT id FROM chapters c where c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn where gn.novel_id = n.id AND (SELECT id FROM genres g where g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL', { type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novels => {
            return res.status(200).send({ novels });
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
                const novelCollaborators = collaboratorsNovel.map(collaborator => collaborator.user_id);
                if (req.user && (req.user.id === novel.nvl_author || novelCollaborators.includes(req.user.id))) {
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
                return res.status(500).send({ message: 'Ocurrio un error al cargar los colaboradores de la novela' });
            });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela' });
    });
}

function uploadNovelImage(req, res) {
    const id = req.params.id;
    if (req.files) {
        const file_path = req.files.novel_image.path;
        const file_split = file_path.split('\\');
        const file_name = file_split[3];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];
        if (file_ext == 'jpg') {
            if (req.body.old_novel_image) {
                console.log('deleting old image from the novel');
                const old_img = req.body.old_novel_image;
                old_file_path = './server/uploads/novels/' + old_img;
                old_file_thumb_path = './server/uploads/novels/thumbs/' + old_img;
                fs.exists(old_file_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua' });
                            }
                        });
                    }
                });
                fs.exists(old_file_thumb_path, (exists) => {
                    if (exists) {
                        fs.unlink(old_file_thumb_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al eliminar el thumb antiguo' });
                            }
                        });
                    }
                });
            }
            const novel_image = {};
            novel_image.nvl_img = file_name;
            novels_model.findByPk(id).then(novel => {
                if (novel.nvl_author === req.user.id) {
                    novel.update(novel_image).then(() => {
                        const newPath = './server/uploads/novels/' + file_name;
                        const thumbPath = './server/uploads/novels/thumbs/' + file_name;
                        const options = { width: 210, height: 280 };
                        imageThumbnail(path.resolve(newPath), options)
                            .then(thumbnail => {
                                const buf = new Buffer(thumbnail, 'buffer');
                                fs.writeFile(thumbPath, buf, function(err) {
                                    if (err) {
                                        fs.unlink(file_path, (error) => {
                                            if (error) {
                                                return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                                            }
                                        });
                                    }
                                });
                                return res.status(200).send({ message: 'Imagen de novela cargada con exito' });
                            }).catch(err => {
                                fs.unlink(file_path, (err) => {
                                    if (err) {
                                        return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                                    }
                                });
                                return res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail. ' });
                            });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                return res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                            }
                        });
                        return res.status(500).send({ message: 'Ocurrio un error al actualizar la novela.' + err });
                    });
                } else {
                    return res.status(401).send({ message: 'No autorizado' });
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
    const image = req.params.novel_img;
    const thumb = req.params.thumb;
    let img_path = null;
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
    const id = req.params.id;
    novels_model.findByPk(id).then((novel) => {
        if (novel.nvl_author === req.user.id) {
            // Deleting Novel image
            if (novel.dataValues.nvl_img !== '' && novel.dataValues.nvl_img !== null) {
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
                return res.status(500).send({ message: 'Ocurrio un error al eliminar la novela ' });
            });
        } else {
            return res.status(401).send({ message: 'No autorizado a eliminar la novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al cargar la novela a eliminar ' });
    });
}


// Novels chapters
function getChapter(req, res) {
    const id = req.params.id;
    chapters_model.sequelize.query('SELECT *, (SELECT user_login FROM users u WHERE u.id = c.chp_author) AS user_login, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", cms.id, "comment_content", cms.comment_content, "user_id", cms.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = cms.user_id), "user_profile_image", (SELECT user_profile_image FROM users u WHERE u.id = cms.user_id), "createdAt", cms.createdAt, "updatedAt", cms.updatedAt, "likes_count", (SELECT COUNT(id) FROM likes l WHERE l.comment_id = cms.id), "likes", IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", l.id, "comment_id", l.comment_id, "user_id", l.user_id, "user_login", (SELECT user_login FROM users u WHERE u.id = l.user_id))), "]"), JSON) FROM likes l WHERE l.comment_id = cms.id), CONVERT(CONCAT("[]"), JSON)))), "]"), JSON) FROM comments cms WHERE cms.chp_id = c.id), CONVERT(CONCAT("[]"), JSON)) AS comments FROM chapters c WHERE c.id = ? AND c.chp_status="Active"', { replacements: [id], type: chapters_model.sequelize.QueryTypes.SELECT })
        .then(chapter => {
            if (chapter.length > 0) {
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
                attributes: ['id', 'user_login'],
                through: { attributes: [] },
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
    novels_model.sequelize.query('SELECT id, nvl_author, nvl_title, nvl_name, nvl_writer, nvl_acronym, nvl_translator, nvl_img, createdAt, updatedAt, (SELECT user_login FROM users u WHERE u.id = n.nvl_author) AS user_login, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_index_title", c.chp_index_title, "chp_name", c.chp_name, "chp_number", c.chp_number, "chp_status", c.chp_status, "createdAt", c.createdAt) ORDER BY c.chp_number ASC), "]"), JSON) FROM chapters c WHERE c.nvl_id = n.id AND c.chp_status = "Active"), CONVERT(CONCAT("[]"), JSON)) AS chapters, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", rl.id, "user_id", rl.user_id, "chp_id", rl.chp_id)), "]"), JSON) FROM bookmarks rl WHERE rl.nvl_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS bookmarks, IFNULL((SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "id", nr.id)), "]"), JSON) FROM novels_ratings nr WHERE nr.novel_id = n.id), CONVERT(CONCAT("[]"), JSON)) AS novel_ratings FROM novels n WHERE n.id = ? AND n.nvl_status IN ("Active", "Finished") AND (SELECT id FROM volumes v WHERE v.nvl_id = n.id AND (SELECT id FROM chapters c WHERE c.vlm_id = v.id AND c.chp_status = "Active" LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL AND (SELECT id FROM genres_novels gn WHERE gn.novel_id = n.id AND (SELECT id FROM genres g WHERE g.id = gn.genre_id LIMIT 1) IS NOT NULL LIMIT 1) IS NOT NULL', { replacements: [id], type: novels_model.sequelize.QueryTypes.SELECT })
        .then(novel => {
            if (novel.length > 0) {
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
                ],
                attributes: ['nvl_author']
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
                            return res.status(200).send({ chapter });
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
    genres_model.findAll().then(genres => {
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
            return res.status(401).send({ message: 'No autorizado a eliminar el volumen de esta novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar el volumen indicado' });
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
    getNovelImage,
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
};