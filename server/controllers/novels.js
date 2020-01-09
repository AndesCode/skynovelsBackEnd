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
    var id = req.params.id;
    novels.findByPk(id, {
        include: [{
            model: novels,
            as: 'genres',
            through: { attributes: [] }
        }, {
            model: chapters,
            as: 'chapters',
            attributes: ['id', 'chp_title', 'chp_number']
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
    }).then(novel => {
        res.status(200).send({ novel });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function getNovels(req, res) {
    let status = req.params.status;
    if (status === 'All') {
        status = {
            [Op.ne]: null
        };
    }
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
            attributes: ['id', 'user_login']
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
            nvl_status: status
        }
    }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function createNovel(req, res) {
    const body = req.body;
    console.log(body);
    // variables deberian borrarse y ser remplazadas por arrays enviados desde el front-end
    const genresTest = [2];
    //----------------------------- fin de variables de prueba
    console.log(genresTest[1]);
    novels.create(body).then(novel => {
        if (genresTest && genresTest.length > 0) {
            console.log(genresTest);
            novel.setGenres(genresTest);
        }
        res.status(200).send({ novel });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar la novela ' + err });
    });
}

function updateNovel(req, res) {
    const body = req.body;
    novels.findByPk(body.id).then(novel => {
        novel.update(body).then(() => {
            // variables deberian borrarse y ser remplazadas por arrays enviados desde el front-end
            novel.genresTest = [5, 3];
            novel.new_collaborator = [10];
            //----------------------------- fin de variables de prueba
            if (novel.genresTest) {
                console.log(novel.genresTest);
                novel.setGenres(novel.genresTest);
            }
            if (novel.new_collaborator && novel.new_collaborator.length > 0) {
                console.log(novel.new_collaborator);
                novel.addCollaborator(novel.new_collaborator);
            }
            res.status(200).send({ novel });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la novela' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
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
                        res.status(200).send({ novel });
                    }).catch(err => {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload.' });
                            }
                        });
                        res.status(500).send({ message: 'Ocurrio un error al crear el thumbnail.' });
                    });
                }).catch(err => {
                    fs.unlink(file_path, (err) => {
                        if (err) {
                            res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                        }
                    });
                    res.status(500).send({ message: 'Ocurrio un error al actualziar la novela.' });
                });
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                    }
                });
                res.status(500).send({ message: 'No existe la novela.' });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    res.status(500).send({ message: 'Ocurrio un error al intentar eliminar el archivo.' });
                }
            });
            res.status(500).send({ message: 'La extensión del archivo no es valida.' });
        }
    } else {
        res.status(400).send({ message: 'Debe Seleccionar una novela.' });
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
            res.sendFile(path.resolve(img_path));
        } else {
            res.status(404).send({ message: "No se encuentra la imagen de novela" });
        }
    });
}

function deleteNovel(req, res) {
    var id = req.params.id;
    novels.findByPk(id).then((novel) => {
        // Deleting Novel image
        if (novel.dataValues.nvl_img !== '') {
            var old_img = novel.dataValues.nvl_img;
            delete_file_path = './server/uploads/novels/' + old_img;
            delete_file_thumb_path = './server/uploads/novels/thumbs/' + old_img;
            fs.unlink(delete_file_path, (err) => {
                if (err) {
                    res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua. ' });
                } else {
                    fs.unlink(delete_file_thumb_path, (err) => {
                        if (err) {
                            res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen thumb antigua. ' });
                        } else {
                            res.status(200);
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
            res.status(200).send({ novel });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la novela ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la novela a eliminar ' });
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
        res.status(200).send({ chapter });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
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
        res.status(200).send({ chapters });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function createChapter(req, res) {
    const body = req.body;
    chapters.create(body).then(chapter => {
        res.status(200).send({ chapter });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar la novela ' + err });
    });
}

function updateChapter(req, res) {
    const body = req.body;
    console.log(body);
    chapters.findByPk(body.id).then(chapter => {
        chapter.update(body).then(() => {
            res.status(200).send({ chapter });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el capitulos ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function deleteChapter(req, res) {
    var id = req.params.id;
    chapters.findByPk(id).then(chapter => {
        chapter.destroy({
            where: {
                id: id
            }
        }).then(chapter => {
            res.status(200).send({ chapter });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el capitulo' });
    });
}

// Genres

function getGenres(req, res) {
    genres.findAll().then(genres => {
        res.status(200).send({ genres });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar los generos' + err });
    });
}

function createGenre(req, res) {
    var body = req.body;
    console.log(body);
    genres.create(body).then(genre => {
        res.status(200).send({ genre });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear el genero para las novelas ' + err });
    });
}

function updateGenre(req, res) {
    var body = req.body;
    console.log(body);
    genres.findByPk(body.id).then(genre => {
        genre.update(body).then(() => {
            res.status(200).send({ genre });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la novela' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function deleteGenre(req, res) {
    var id = req.params.id;
    console.log(id);
    genres.findByPk(id).then(genre => {
        genre.destroy({
            where: {
                id: id
            }
        }).then(genre => {
            res.status(200).send({ genre });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el genero indicado' });
    });
}

function createNovelRating(req, res) {
    const body = req.body;
    novels_ratings.create(body).then(novel_rating => {
        res.status(200).send({ novel_rating });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear clasificacion de la novela ' + err });
    });
}

function updateNovelRating(req, res) {
    var body = req.body;
    novels_ratings.findByPk(body.id).then(novel_rating => {
        novel_rating.update(body).then(() => {
            res.status(200).send({ novel_rating });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la clasificacion de la novela ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

function deleteNovelRating(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings.findByPk(id).then(novel_rating => {
        novel_rating.destroy({
            where: {
                id: id
            }
        }).then(novel_rating => {
            res.status(200).send({ novel_rating });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la clasificacion de la novela ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la clasificacion de la novela ' + err });
    });
}

module.exports = {
    getNovel,
    getNovels,
    createNovel,
    updateNovel,
    uploadNovelImage,
    getNovelImage,
    deleteNovel,
    getChapter,
    getChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    getGenres,
    createGenre,
    updateGenre,
    deleteGenre,
    createNovelRating,
    updateNovelRating,
    deleteNovelRating
};