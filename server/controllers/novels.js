/*jshint esversion: 6 */
const novels = require('../models').novels;
const capitulos = require('../models').capitulos;
const genres = require('../models').genres;
const fs = require('fs');
const thumb = require('node-thumbnail').thumb;
const path = require('path');


// home functions

function getAllChaptersByDate(req, res) {
    capitulos.sequelize.query("SELECT capitulos.id, DATE_FORMAT(capitulos.createdAt, '%d %M, %Y') AS chp_created_date, capitulos.chp_title, novelas.nvl_title FROM capitulos, novelas WHERE capitulos.nvl_id = novelas.id ORDER BY capitulos.createdAt DESC", { type: novelas.sequelize.QueryTypes.SELECT }).then(capitulos => {
        res.status(200).send({ capitulos });
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
    var id = req.params.id;
    var body = req.body;

    novels.findByPk(id).then(novel => {
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
    if (req.body.old_novel_image) {
        var old_img = req.body.old_novel_image;
        old_file_path = './server/uploads/novels/' + old_img;
        old_file_thumb_path = './server/uploads/novels/thumbs/' + old_img;
        fs.unlink(old_file_path, (err) => {
            if (err) {
                res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen antigua.' });
            } else {
                fs.unlink(old_file_thumb_path, (err) => {
                    if (err) {
                        res.status(500).send({ message: 'Ocurrio un error al eliminar la imagen thumb antigua.' });
                    } else {

                    }
                });
            }
        });
    } else {
        console.log('creating a new image in db');
    }
    if (req.files) {
        var file_path = req.files.novel_image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[3];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        if (file_ext == 'jpg') {
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
    novels.sequelize.query('SELECT (SELECT users.user_login from users WHERE users.id = novels.nvl_author) AS user_author_login, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ", " ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres ,novels.id , novels.nvl_content, novels.nvl_author, novels.nvl_status, novels.nvl_writer, novels.nvl_name, novels.nvl_img, novels.nvl_comment_count, novels.nvl_title, (SELECT COUNT(capitulos.nvl_id) FROM capitulos WHERE capitulos.chp_author = novels.nvl_author LIMIT 1) AS chp_count FROM novels WHERE novels.id = ?', { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(novel => {
        res.status(200).send({ novel });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela ' + err });
    });
}

function getUserNovels(req, res) {
    var id = req.body.user_id;
    novels.sequelize.query('SELECT novels.id, novels.nvl_author, novels.nvl_status, novels.nvl_title, novels.nvl_content, IFNULL(COUNT(capitulos.nvl_id), 0) AS chp_count, novels.nvl_img FROM novels LEFT JOIN capitulos ON capitulos.nvl_id = novels.id WHERE novels.nvl_author = ? GROUP BY novels.id', { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar las novelas' });
    });
}

function getAll(req, res) {

    novels.sequelize.query("SELECT novels.id, nvl_status, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ', ' ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres , novels.nvl_title, novels.nvl_content, COUNT(capitulos.nvl_id) AS chp_count FROM novels JOIN capitulos ON capitulos.nvl_id = novels.id group by novels.id;", { type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function searchNovels(req, res) {
    var term = req.params.term;
    novels.sequelize.query('SELECT (SELECT users.user_login from users WHERE users.id = novels.nvl_author) AS user_author_login, (SELECT GROUP_CONCAT( ( SELECT genres.genre_name FROM genres WHERE genres.id = genres_novels.genre_id) SEPARATOR ", " ) AS CONCAT FROM genres, genres_novels, novels n WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = n.id) as novel_genres ,novels.id , novels.nvl_content, novels.nvl_author, novels.nvl_status, novels.nvl_writer, novels.nvl_name, novels.nvl_img, novels.nvl_comment_count, novels.nvl_title, (SELECT COUNT(capitulos.nvl_id) FROM capitulos WHERE capitulos.chp_author = novels.nvl_author LIMIT 1) AS chp_count FROM novels WHERE novels.nvl_status = "Activa" AND novels.nvl_title LIKE "%"?"%"', { replacements: [term], type: novels.sequelize.QueryTypes.SELECT }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' });
    });
}

function getCapitulos(req, res) {
    var id = req.params.id;
    capitulos.sequelize.query("SELECT * FROM capitulos WHERE nvl_id = ? ORDER BY capitulos.createdAt ASC", { replacements: [id], type: novels.sequelize.QueryTypes.SELECT }).then(capitulos => {
        res.status(200).send({ capitulos });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar los capitulos de la novela' + err });
    });
}

function getNovelGenres(req, res) {
    var id = req.params.id;
    genres.sequelize.query("SELECT genres.genre_name FROM genres, genres_novels, novels WHERE genres_novels.novel_id = novels.id AND genres.id = genres_novels.genre_id AND genres_novels.novel_id = ?", { replacements: [id], type: genres.sequelize.QueryTypes.SELECT }).then(genres => {
        res.status(200).send({ genres });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}



function getUserChapter(req, res) {
    var id = req.params.id;
    capitulos.sequelize.query('SELECT * FROM capitulos WHERE capitulos.id = ? ORDER BY capitulos.createdAt ASC', { replacements: [id], type: capitulos.sequelize.QueryTypes.SELECT }).then(capitulos => {
        res.status(200).send({ capitulos });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar el capitulo' + err });
    });
}

function createChapter(req, res) {
    var body = req.body;
    capitulos.create(body).then(capitulos => {
        res.status(200).send({ capitulos });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar el capitulo' });
    });
}

function updateChapter(req, res) {
    var id = req.params.id;
    var body = req.body;
    console.log(id);
    console.log(body);

    capitulos.findByPk(id).then(capitulos => {
        capitulos.update(body).then(() => {
            res.status(200).send({ capitulos });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la capitulos' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la capitulos' + err });
    });
}

function getAllAdmin(req, res) {
    novels.all({
        order: [
            ['id', 'ASC']
        ]
    }).then(novels => {
        res.status(200).send({ novels });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' });
    });
}

function getNovelImage(req, res) {
    var image = req.params.novel_img;
    var thumb = req.params.thumb;

    if (thumb == "false") {
        var img_path = './server/uploads/novels/' + image;
    } else if (thumb == "true") {
        var img_path = './server/uploads/novels/thumbs/' + image;
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

module.exports = {
    create,
    update,
    uploadNovelImage,
    getNovel,
    getCapitulos,
    getUserNovels,
    getAll,
    getAllAdmin,
    createChapter,
    updateChapter,
    getUserChapter,
    getNovelImage,
    deleteNovel,
    getAllChaptersByDate,
    getAllByDate,
    getNovelGenres,
    searchNovels
};