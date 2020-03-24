/*jshint esversion: 6 */
//Models
const novels_ratings_model = require('../models').novels_ratings;
const novels_model = require('../models').novels;
const chapters_model = require('../models').chapters;
const volumes_model = require('../models').volumes;
const users_model = require('../models').users;
const genres_model = require('../models').genres;
const user_reading_lists_model = require('../models').user_reading_lists;
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
    let attributes = [];
    let nvl_status = '';
    let chp_status = '';
    if (req.params.action === 'reading' || req.params.action === 'edition') {
        if (req.params.action === 'reading') {
            attributes = ['id', 'chp_title', 'chp_number', 'chp_status'];
            nvl_status = 'Publicada';
            chp_status = 'Publicado';
        } else {
            attributes = ['id', 'chp_title', 'chp_number', 'chp_content', 'chp_review', 'chp_author', 'chp_status'];
            nvl_status = {
                [Op.ne]: null
            };
            chp_status = {
                [Op.ne]: null
            };
        }
    } else {
        return res.status(500).send({ message: 'petición invalida' });
    }
    novels_model.findByPk(id, {
        include: [{
            model: genres_model,
            as: 'genres',
            through: { attributes: [] }
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
            model: user_reading_lists_model,
            as: 'user_reading_lists',
            attributes: ['id', 'user_id', 'nvl_chapter'],
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }],
        where: {
            nvl_status: nvl_status
        }
    }).then(novel => {
        if (novel) {
            volumes_model.findAll({
                where: {
                    nvl_id: novel.id,
                    vlm_title: {
                        [Op.ne]: null
                    }
                },
                include: [{
                    model: chapters_model,
                    as: 'chapters',
                    attributes: attributes,
                    where: {
                        chp_status: chp_status
                    },
                }]
            }).then(volumes => {
                if (req.params.action === 'edition') {
                    const collaborators = novel.collaborators.map(collaborator => collaborator.id);
                    if (req.user && (req.user.id === novel.nvl_author || collaborators.includes(req.user.id))) {
                        const authorized_user = req.user.id;
                        return res.status(200).send({ novel, volumes, authorized_user });
                    } else {
                        return res.status(401).send({ message: 'No autorizado ' });
                    }
                } else {
                    if (volumes.length > 0) {
                        return res.status(200).send({ novel, volumes });
                    } else {
                        return res.status(404).send({ message: 'No se encontro ninguna novela' });
                    }
                }
            });
        } else {
            return res.status(404).send({ message: 'No se encontro ninguna novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
    });
}

function getNovelVolumes(req, res) {
    volumes_model.findAll({
        include: [{
            model: chapters_model,
            as: 'chapters',
            attributes: ['id', 'chp_number', 'createdAt', 'chp_title'],
            where: {
                chp_status: 'Publicado'
            },
        }],
        where: {
            nvl_id: req.params.id
        }
    }).then(volumes => {
        return res.status(200).send({ volumes });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getnovelsTest(req, res) {
    novels_model.sequelize.query('SELECT n.*, CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", g.id, "genre_name", g.genre_name)), "]"), JSON) as genres, (SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("vlm_title", v.vlm_title, "chapters", (SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("id", c.id, "chp_title", c.chp_title, "chp_number", c.chp_number, "chp_status", c.chp_status)), "]"), JSON) as chapter FROM chapters c where c.vlm_id = v.id))), "]"), JSON) FROM volumes v where v.nvl_id = n.id) as volumes, (SELECT CONVERT(CONCAT("[", GROUP_CONCAT(JSON_OBJECT("user_id", nr.user_id, "rate_value", nr.rate_value, "rate_comment", nr.rate_comment, "createdAt", nr.createdAt, "updatedAt", nr.updatedAt, "id", nr.id, "user_login", (SELECT user_login FROM users u where u.id = nr.user_id))), "]"), JSON) FROM novels_ratings nr where nr.novel_id = n.id) as novel_ratings FROM novels n INNER JOIN genres_novels gn ON n.id = gn.novel_id INNER JOIN genres g ON g.id = gn.genre_id WHERE n.id = 23', { type: novels_model.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' });
    });
}

function getNovels(req, res) {
    novels_model.findAll({
        include: [{
            model: genres_model,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: volumes_model,
            as: 'volumes',
            attributes: ['id', 'vlm_title'],
            where: {
                vlm_title: {
                    [Op.ne]: null
                }
            }
        }, {
            model: novels_ratings_model,
            as: 'novel_ratings',
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }, {
            model: user_reading_lists_model,
            as: 'user_reading_lists',
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }],
        where: {
            nvl_status: {
                [Op.or]: ['Publicada', 'Finalizada']
            }
        }
    }).then(novels => {
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
    chapters_model.findByPk(id
        /*, {
                include: [{
                    model: novels_model,
                    as: 'novel',
                    include: {
                        model: users_model,
                        as: 'author',
                        attributes: ['id', 'user_login']
                    }
                }, {
                    model: users_model,
                    as: 'author',
                    attributes: ['id', 'user_login']
                }, {
                    model: user_reading_lists_model,
                    as: 'users_reading',
                    include: [{
                        model: users_model,
                        as: 'user',
                        attributes: ['user_login']
                    }]
                }]
            }*/
    ).then(chapter => {
        return res.status(200).send({ chapter });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getChapters(req, res) {
    console.log(req.query);
    /*let searchMethod = {};
    if (req.query.user) {
        searchMethod.chp_author = req.query.user;
    }*/
    chapters_model.findAll({
        attributes: ['id', 'chp_author', 'nvl_id', 'chp_number', 'chp_title', 'createdAt', 'updatedAt'],
        include: [{
            model: novels_model,
            as: 'novel',
            attributes: ['nvl_title'],
        }, {
            model: users_model,
            as: 'author',
            attributes: ['user_login']
        }, {
            model: user_reading_lists_model,
            as: 'users_reading',
            include: [{
                model: users_model,
                as: 'user',
                attributes: ['user_login']
            }]
        }]
    }).then(chapters => {
        return res.status(200).send({ chapters });
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
        if (req.user.id === novel_rating.user_id || req.user.user_rol === 'admin') {
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
        if (req.user.id === novel_rating.user_id || req.user.user_rol === 'admin') {
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
    // getChapters,
    getNovelVolumes,
    createChapter,
    updateChapter,
    deleteChapter,
    // Genres
    getGenres,
    // Novel ratings
    createNovelRating,
    updateNovelRating,
    deleteNovelRating,
    // test
    getnovelsTest
};