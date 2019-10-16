/*jshint esversion: 6 */
const novels = require('../models').novels;
const chapters = require('../models').chapters;
const genres_novels = require('../models').genres_novels;
const genres = require('../models').genres;
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');
const novels_collaborators = require('../models').novels_collaborators;
const novels_ratings = require('../models').novels_ratings;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


// home functions

function getAllChaptersByDate(req, res) {
    chapters.sequelize.query("SELECT chapters.id, DATE_FORMAT(chapters.createdAt, '%d %M, %Y') AS chp_created_date, chapters.chp_title, chp_number, novels.nvl_title FROM chapters, novels WHERE chapters.nvl_id = novels.id ORDER BY chapters.createdAt DESC", { type: novels.sequelize.QueryTypes.SELECT }).then(chapters => {
        res.status(200).send({ chapters });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar el capitulo' + err });
    });
}

function getAllByDate(req, res) {
    novels.findAll({
        order: [
            ['createdAt', 'DESC']
        ]
    }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function create(req, res) {
    var body = req.body;
    novels.create(body).then(novel => {
        res.status(200).send({ novel });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar la novela' + err });
    });
}

function update(req, res) {
    var body = req.body;
    console.log(body);
    novels.findByPk(body.id).then(novel => {
        novel.update(body).then(() => {
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

function getNovel(req, res) {
    var id = req.params.id;
    novels.sequelize.query('SELECT (SELECT users.user_login from users WHERE users.id = novels.nvl_author) AS user_author_login, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ", " ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres ,novels.id, novels.nvl_name, novels.nvl_content, novels.nvl_author, novels.nvl_status, novels.nvl_writer, novels.nvl_name, novels.nvl_img, novels.nvl_comment_count, novels.nvl_title, (SELECT COUNT(chapters.nvl_id) FROM chapters WHERE chapters.nvl_id = novels.id LIMIT 1) AS chp_count, novels.updatedAt, novels.nvl_rating FROM novels WHERE novels.nvl_name = ?', { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(novel => {
        res.status(200).send({ novel });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
    });
}

function getUserNovels(req, res) {
    var id = req.body.user_id;
    novels.sequelize.query('SELECT novels.id, novels.nvl_author, novels.nvl_status, novels.nvl_name, novels.nvl_title, novels.nvl_content, IFNULL(COUNT(chapters.nvl_id), 0) AS chp_count, novels.nvl_img, novels.updatedAt, novels.createdAt FROM novels LEFT JOIN chapters ON chapters.nvl_id = novels.id WHERE novels.nvl_author = ? GROUP BY novels.id', { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar las novelas' });
    });
}

function getUserCollaborationsNovels(req, res) {
    var id = req.body.user_id;
    novels.sequelize.query('SELECT novels.updatedAt, novels.id, novels.nvl_author, novels.nvl_status, novels.nvl_name, novels.nvl_title, novels.nvl_content, IFNULL(COUNT(chapters.nvl_id), 0) AS chp_count, novels.nvl_img FROM novels_collaborators, novels LEFT JOIN chapters ON chapters.nvl_id = novels.id WHERE novels.id = novels_collaborators.novel_id AND novels_collaborators.user_id = ? GROUP BY novels.id', { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar las novelas' });
    });
}

function getCollaboratorsFromNovel(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_collaborators.sequelize.query('SELECT *, (SELECT users.user_login FROM users WHERE users.id = novels_collaborators.user_id) AS user_collaborator_login FROM novels_collaborators WHERE novels_collaborators.novel_id = ?', { replacements: [id], type: novels_collaborators.sequelize.QueryTypes.SELECT }).then(collaborators => {
        res.status(200).send({ collaborators });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar los colaboradores de novela ' });
    });
}

function getActiveNovels(req, res) {

    novels.sequelize.query("SELECT novels.nvl_writer, novels.createdAt, novels.updatedAt, novels.id, novels.nvl_status, novels.nvl_name, novels.nvl_img, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ', ' ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres , novels.nvl_title, novels.nvl_content, COUNT(chapters.nvl_id) AS chp_count, nvl_rating FROM novels JOIN chapters ON chapters.nvl_id = novels.id AND (novels.nvl_status = 'Finalizada' OR novels.nvl_status = 'Publicada') group by novels.id;", { type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function getAllNovels(req, res) {

    novels.sequelize.query('SELECT novels.nvl_writer, novels.createdAt, novels.updatedAt, novels.id, novels.nvl_author author, (SELECT users.user_login from users where users.id = author) as author_login, novels.nvl_status, novels.nvl_name, novels.nvl_title, novels.nvl_content, IFNULL(COUNT(chapters.nvl_id), 0) AS chp_count, novels.nvl_img FROM novels LEFT JOIN chapters ON chapters.nvl_id = novels.id GROUP BY novels.id', { type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function searchNovels(req, res) {
    var term = req.params.term;
    novels.sequelize.query('SELECT novels.id, novels.nvl_status, novels.nvl_name, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ", " ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres , novels.nvl_title, novels.nvl_content, COUNT(chapters.nvl_id) AS chp_count FROM novels JOIN chapters ON chapters.nvl_id = novels.id AND (novels.nvl_status = "Finalizada" OR novels.nvl_status = "Publicada") AND novels.nvl_title LIKE "%"?"%" group by novels.id', { replacements: [term], type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' });
    });
}

function getChapters(req, res) {
    var id = req.params.id;
    chapters.sequelize.query("SELECT * FROM chapters WHERE nvl_id = ? ORDER BY chapters.createdAt ASC", { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(chapters => {
        res.status(200).send({ chapters });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar los capitulos de la novela' + err });
    });
}

function getNovelGenres(req, res) {
    var id = req.params.id;
    genres_novels.sequelize.query("SELECT genres.id, genres.genre_name FROM genres, genres_novels, novels WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = ?", { replacements: [id], type: genres_novels.sequelize.QueryTypes.SELECT }).then(genres => {
        res.status(200).send({ genres });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function addGenreToNovel(req, res) {
    var body = req.body;
    console.log(body);
    genres_novels.create(body).then(genre => {
        res.status(200).send({ genre });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al agregar el genero a la novela' + err });
    });
}

function deleteNovelGenres(req, res) {
    var id = req.params.id;
    console.log(id);
    genres_novels.findAll({
        where: {
            novel_id: id
        }
    }).then(genres => {
        genres_novels.destroy({
            where: {
                novel_id: id
            }
        }).then(genres => {
            res.status(200).send({ genres });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar los generos antiguos de la novela ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar los generos antiguos de la novela ' + err });
    });
}



function getUserChapter(req, res) {
    var id = req.params.id;
    chapters.sequelize.query('SELECT * FROM chapters WHERE chapters.id = ? ORDER BY chapters.createdAt ASC', { replacements: [id], type: chapters.sequelize.QueryTypes.SELECT }).then(chapters => {
        res.status(200).send({ chapters });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar el capitulo' + err });
    });
}

function createChapter(req, res) {
    var body = req.body;
    chapters.findOne({
        where: {
            [Op.or]: [{ chp_number: body.chp_number }, { chp_title: body.chp_title }],
            [Op.and]: [{ nvl_id: body.nvl_id }]
        }
    }).then(chapter => {
        if (chapter == null) {
            chapters.create(body).then(chapter => {
                res.status(200).send({ chapter });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al guardar el capitulo ' + err });
            });
        } else {
            res.status(500).send({ message: 'Ya existe un capitulo con ese nombre o numero de capitulo' });
        }
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error de verificación de capitulo ' + err });
    });
}

function updateChapter(req, res) {
    var id = req.params.id;
    var body = req.body;
    console.log(id);
    console.log(body);

    chapters.findByPk(id).then(chapter => {
        chapter.update(body).then(() => {
            res.status(200).send({ chapter });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la capitulos' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function deleteChapter(req, res) {
    var id = req.params.id;
    chapters.findByPk(id).then(chapter => {
        chapters.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ chapter });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el capitulo' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encotnrar el capitulo' });
    });
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
    novels.findByPk(id).then((novels) => {
        if (novels.dataValues.nvl_img != '') {
            var old_img = novels.dataValues.nvl_img;
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
        } else {
            console.log('No hay imagenes en la base de datos para esta novela ');
        }
        novels.destroy({
            where: {
                id: id
            }
        }).then(novels => {
            res.status(200).send({ novels });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la novelas ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la novela a eliminar ' });
    });
}

function getGenres(req, res) {
    novels.sequelize.query('SELECT * FROM genres', { type: novels.sequelize.QueryTypes.SELECT }).then(genres => {
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
    genres.findAll({
        where: {
            id: id
        }
    }).then(genre => {
        genres.destroy({
            where: {
                id: id
            }
        }).then(genre => {
            res.status(200).send({ genre });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el genero indicado' });
        });
    });
}

function getNovelsRatings(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings.findAll({
        where: {
            novel_id: id
        }
    }).then(rates => {
        res.status(200).send({ rates });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar las clasificaciones de la novela ' + err });
    });
}

function getNovelComments(req, res) {
    var id = req.params.id;
    console.log(id);
    novels_ratings.sequelize.query("SELECT novels_ratings.rate_comment, novels_ratings.updatedAt, novels_ratings.createdAt, novels_ratings.user_id, novels_ratings.rate_value, (SELECT users.user_login FROM users WHERE users.id = novels_ratings.user_id) AS user_comment_login from novels_ratings where novels_ratings.novel_id = ?", { replacements: [id], type: novels_ratings.sequelize.QueryTypes.SELECT }).then(novelComments => {
        res.status(200).send({ novelComments });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' });
    });
}

function postNovelRating(req, res) {
    var body = req.body;
    novels_ratings.findOne({
        where: {
            novel_id: body.novel_id,
            user_id: body.user_id
        }
    }).then(novel_rating => {
        if (novel_rating == null) {
            novels_ratings.create(body).then(rate => {
                res.status(200).send({ rate });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al guardar ' + err });
            });
        } else {
            novel_rating.update(body).then(rate => {
                res.status(200).send({ rate });
            }).catch(err => {
                res.status(500).send({ message: 'Ocurrio un error al guardar ' + err });
            });
        }
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la invitación' + err });
    });
}



module.exports = {
    create,
    update,
    uploadNovelImage,
    getNovel,
    getChapters,
    getUserNovels,
    getActiveNovels,
    getAllNovels,
    createChapter,
    updateChapter,
    getUserChapter,
    getNovelImage,
    deleteNovel,
    getAllChaptersByDate,
    getAllByDate,
    getNovelGenres,
    searchNovels,
    getGenres,
    addGenreToNovel,
    deleteNovelGenres,
    createGenre,
    updateGenre,
    deleteGenre,
    getUserCollaborationsNovels,
    getCollaboratorsFromNovel,
    deleteChapter,
    getNovelsRatings,
    getNovelComments,
    postNovelRating
};