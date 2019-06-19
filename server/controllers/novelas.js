/*jshint esversion: 6 */
const novelas = require('../models').novelas;
const capitulos = require('../models').capitulos;
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
    novelas.findAll({
        order: [
            ['createdAt', 'DESC']
        ]
    }).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function create(req, res) {
    var body = req.body;


    novelas.create(body).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al guardar la novela' + err });
    });
}

function update(req, res) {
    var id = req.params.id;
    var body = req.body;

    novelas.findByPk(id).then(novela => {
        novela.update(body).then(() => {
            res.status(200).send({ novela });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar la novela' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function uploadnovelaimg(req, res) {
    var id = req.params.id;
    if (req.body.old_novel_image) {
        var old_img = req.body.old_novel_image;
        old_file_path = './server/uploads/novelas/' + old_img;
        old_file_thumb_path = './server/uploads/novelas/thumbs/' + old_img;
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

            novelas.findByPk(id).then(novela => {
                novela.update(novel_image).then(() => {

                    var newPath = './server/uploads/novelas/' + file_name;
                    var thumbPath = './server/uploads/novelas/thumbs';

                    thumb({
                        source: path.resolve(newPath),
                        destination: path.resolve(thumbPath),
                        width: 210,
                        height: 280,
                        suffix: ''
                    }).then(() => {
                        res.status(200).send({ novela });
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

function getnovela(req, res) {
    var id = req.params.id;
    novelas.sequelize.query('SELECT (SELECT usuarios.user_login from usuarios WHERE usuarios.id = novelas.nvl_author) AS user_author_login, novelas.id , novelas.nvl_content, novelas.nvl_author, novelas.nvl_status, novelas.nvl_writer, novelas.nvl_name, novelas.nvl_img, novelas.nvl_comment_count, novelas.nvl_title, (SELECT COUNT(capitulos.nvl_id) FROM capitulos WHERE capitulos.chp_author = novelas.nvl_author LIMIT 1) AS chp_count FROM novelas WHERE novelas.id = ?', { replacements: [id], type: novelas.sequelize.QueryTypes.SELECT }).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' });
    });
}

function getUserNovels(req, res) {
    var id = req.body.user_id;
    novelas.sequelize.query('SELECT novelas.id, novelas.nvl_author, novelas.nvl_status, novelas.nvl_title, novelas.nvl_content, IFNULL(COUNT(capitulos.nvl_id), 0) AS chp_count, novelas.nvl_img FROM novelas LEFT JOIN capitulos ON capitulos.nvl_id = novelas.id WHERE novelas.nvl_author = ? GROUP BY novelas.id', { replacements: [id], type: novelas.sequelize.QueryTypes.SELECT }).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un erro al buscar la novela' });
    });
}

function getAll(req, res) {

    novelas.sequelize.query("SELECT novelas.id, nvl_status, novelas.nvl_title, novelas.nvl_content, COUNT(capitulos.nvl_id) AS chp_count FROM novelas JOIN capitulos ON capitulos.nvl_id = novelas.id group by novelas.id;", { type: novelas.sequelize.QueryTypes.SELECT }).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' + err });
    });
}

function getCapitulos(req, res) {
    var id = req.params.id;
    capitulos.sequelize.query("SELECT * FROM capitulos WHERE nvl_id = ? ORDER BY capitulos.createdAt ASC", { replacements: [id], type: novelas.sequelize.QueryTypes.SELECT }).then(capitulos => {
        res.status(200).send({ capitulos });
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
    novelas.all({
        order: [
            ['id', 'ASC']
        ]
    }).then(novelas => {
        res.status(200).send({ novelas });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar las novelas' });
    });
}

function getNovelImage(req, res) {
    var image = req.params.novel_img;
    var thumb = req.params.thumb;

    if (thumb == "false") {
        var img_path = './server/uploads/novelas/' + image;
    } else if (thumb == "true") {
        var img_path = './server/uploads/novelas/thumbs/' + image;
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
    novelas.findByPk(id).then((novelas) => {
        if (novelas.dataValues.nvl_img != '') {
            var old_img = novelas.dataValues.nvl_img;
            delete_file_path = './server/uploads/novelas/' + old_img;
            delete_file_thumb_path = './server/uploads/novelas/thumbs/' + old_img;
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
        novelas.destroy({
            where: {
                id: id
            }
        }).then(novelas => {
            res.status(200).send({ novelas });
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
    uploadnovelaimg,
    getnovela,
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
    getAllByDate
};