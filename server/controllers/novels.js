/*jshint esversion: 6 */
//Models
const novels_ratings = require('../models').novels_ratings;
const novels = require('../models').novels;
const chapters = require('../models').chapters;
const users = require('../models').users;
const genres = require('../models').genres;
const user_reading_lists = require('../models').user_reading_lists;
// More requires
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');
//Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Novels

function getNovel(req, res) {
    const name = req.params.name;
    let attributes = [];
    let nvl_status = '';
    if (req.params.action === 'reading' || req.params.action === 'edition') {
        if (req.params.action === 'reading') {
            attributes = ['id', 'chp_title', 'chp_number', 'chp_status'];
            nvl_status = 'Publicada';
        } else {
            attributes = ['id', 'chp_title', 'chp_number', 'chp_content', 'chp_review', 'chp_author', 'chp_status'];
            nvl_status = {
                [Op.ne]: null
            };
        }
    } else {
        return res.status(500).send({ message: 'petición invalida' });
    }
    novels.findOne({
        include: [{
            model: genres,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: chapters,
            as: 'chapters',
            attributes: attributes
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
            attributes: ['id', 'user_id', 'nvl_chapter'],
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }]
        }],
        where: {
            nvl_name: name,
            nvl_status: nvl_status
        }
    }).then(novel => {
        if (novel) {
            const collaborators = novel.collaborators.map(collaborator => collaborator.id);
            if (req.params.action === 'edition') {
                if (req.user && (req.user.id === novel.nvl_author || collaborators.includes(req.user.id))) {
                    const authorized_user = req.user.id;
                    return res.status(200).send({ novel, authorized_user });
                } else {
                    return res.status(401).send({ message: 'No autorizado ' });
                }
            } else {
                const chapters = novel.chapters.map(chapter => chapter.chp_status);
                if (chapters.includes('Publicado')) {
                    if (req.user) {
                        const user = {
                            id: req.user.id,
                            rol: req.user.user_rol
                        };
                        return res.status(200).send({ novel, user });
                    } else {
                        return res.status(200).send({ novel });
                    }
                } else {
                    return res.status(500).send({ message: 'No se encontro ninguna novela' });
                }
            }
        } else {
            return res.status(500).send({ message: 'No se encontro ninguna novela' });
        }
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
    });
}

function getNovels(req, res) {
    novels.findAll({
        include: [{
            model: genres,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: chapters,
            as: 'chapters',
            attributes: ['chp_number', 'createdAt', 'chp_title'],
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
    novels.create(body).then(novel => {
        if (body.genres && body.genres.length > 0) {
            novel.setGenres(body.genres);
        }
        return res.status(200).send({ novel });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al guardar la novela ' + err });
    });
}

function updateNovel(req, res) {
    const body = req.body;
    novels.findByPk(body.id).then(novel => {
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

            novels.findByPk(id).then(novel => {
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
    novels.findByPk(id).then((novel) => {
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
    var id = req.params.id;
    chapters.findByPk(id, {
        include: [{
            model: novels,
            as: 'novel',
            include: {
                model: users,
                as: 'author',
                attributes: ['id', 'user_login']
            }
        }, {
            model: users,
            as: 'author',
            attributes: ['id', 'user_login']
        }, {
            model: user_reading_lists,
            as: 'users_reading',
            include: [{
                model: users,
                as: 'user',
                attributes: ['user_login']
            }]
        }]
    }).then(chapter => {
        return res.status(200).send({ chapter });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getChapters(req, res) {
    chapters.findAll({
        attributes: ['id', 'chp_author', 'nvl_id', 'chp_number', 'chp_title', 'createdAt', 'updatedAt'],
        include: [{
            model: novels,
            as: 'novel',
            attributes: ['id', 'nvl_author', 'nvl_title', 'nvl_rating'],
            include: [{
                model: genres,
                as: 'genres',
                through: { attributes: [] }
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
                attributes: ['id', 'user_login']
            }, {
                model: user_reading_lists,
                as: 'user_reading_lists',
                include: [{
                    model: users,
                    as: 'user',
                    attributes: ['user_login']
                }]
            }]
        }, {
            model: users,
            as: 'author',
            attributes: ['id', 'user_login']
        }, {
            model: user_reading_lists,
            as: 'users_reading',
            include: [{
                model: users,
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
    novels.findByPk(body.nvl_id, {
        include: [{
            model: users,
            as: 'collaborators',
            attributes: ['id', 'user_login'],
            through: { attributes: [] },
        }],
        attributes: ['nvl_author']
    }).then(novel => {
        const collaborators = novel.collaborators.map(collaborator => collaborator.id);
        if (req.user.id === novel.nvl_author || collaborators.includes(req.user.id)) {
            chapters.create(body).then(chapter => {
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
    chapters.findByPk(body.id, {
        include: [{
            model: novels,
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
    chapters.findByPk(id, {
        include: [{
            model: novels,
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
    genres.findAll().then(genres => {
        return res.status(200).send({ genres });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al buscar los generos' + err });
    });
}

function createNovelRating(req, res) {
    const body = req.body;
    body.user_id = req.user.id;
    novels_ratings.create(body).then(novel_rating => {
        return res.status(200).send({ novel_rating });
    }).catch(err => {
        return res.status(500).send({ message: 'Ocurrio un error al crear clasificacion de la novela ' + err });
    });
}

function updateNovelRating(req, res) {
    var body = req.body;
    novels_ratings.findByPk(body.id).then(novel_rating => {
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
    novels_ratings.findByPk(id).then(novel_rating => {
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
    getChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    // Genres
    getGenres,
    // Novel ratings
    createNovelRating,
    updateNovelRating,
    deleteNovelRating
};