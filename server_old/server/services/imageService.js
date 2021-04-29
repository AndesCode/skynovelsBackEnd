/*jshint esversion: 6 */
const imageFileFormats = ['JPG', 'JPEG', 'PNG', 'JFIF', 'PJPEG', 'PJP'];
const novels_model = require('../models').novels;
const users_model = require('../models').users;
const advertisements_model = require('../models').advertisements;
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const path = require('path');

function uploadImage(object, objectType, req_files) {
    return new Promise((resolve, rejected) => {
        const file_path = req_files.image.path;
        const file_split = file_path.split(process.env.pathSlash || '\\');
        const file_name = file_split[3];
        const ext_split = file_name.split(process.env.pathDot || '\.');
        const file_ext = ext_split[1];
        if (imageFileFormats.includes(file_ext.toUpperCase())) {
            if (object.image !== null) {
                if (objectType === 'advertisements') {
                    deleteImage(object.image, './server/uploads/' + objectType, false);
                } else {
                    deleteImage(object.image, './server/uploads/' + objectType, true);
                }
            }
            object.update({
                image: file_name
            }).then(() => {
                if (objectType !== 'advertisements') {
                    const sourcePath = './server/uploads/' + objectType + '/' + file_name;
                    const thumbPath = './server/uploads/' + objectType + '/thumbs/' + file_name;
                    const options = { width: 210, height: 280 };
                    imageThumbnail(path.resolve(sourcePath), options)
                        .then(thumbnail => {
                            const buf = new Buffer.from(thumbnail, 'buffer');
                            fs.writeFile(thumbPath, buf, function(err) {
                                if (err) {
                                    fs.unlink(file_path, (error) => {
                                        if (error) {
                                            rejected({ error: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload' });
                                        }
                                    });
                                }
                            });
                            resolve(object.image);
                        }).catch(err => {
                            fs.unlink(file_path, (err) => {
                                if (err) {
                                    rejected({ error: 'Ocurrio un error al crear el thumbnail, se ha cancelado el upload' });
                                }
                            });
                            rejected({ error: 'Ocurrio un error al crear el thumbnail' });
                        });
                } else {
                    resolve(object.image);
                }
            }).catch(err => {
                fs.unlink(file_path, (err) => {
                    if (err) {
                        rejected({ error: 'Ocurrio un error al intentar eliminar el archivo' });
                    }
                });
                rejected({ error: 'Ocurrio un error al actualizar el objeto' });
            });
        } else {
            fs.unlink(file_path, (err) => {
                if (err) {
                    rejected({ error: 'Error al intentar eliminar el archivo subido' });
                }
            });
            rejected({ error: 'La extensión del archivo no es valida' });
        }
    });
}

function getImage(image, route, thumb) {
    return new Promise((resolve, rejected) => {
        let img_path = null;
        if (thumb == "false") {
            img_path = route + '/' + image;
        } else if (thumb == "true") {
            img_path = route + '/thumbs/' + image;
        }
        fs.stat(img_path, function(err, stats) {
            if (stats) {
                resolve(path.resolve(img_path));
            } else {
                return rejected({ status: 'error' });
            }
        });
    });
}

function deleteImage(image, route, hasThumbnail = false) {
    return new Promise((resolve, rejected) => {
        const delete_file_path = route + '/' + image;
        const delete_file_thumb_path = route + '/thumbs/' + image;
        fs.unlink(delete_file_path, (err) => {
            if (err) {
                rejected({ status: 'error', message: 'No se elimina la imagen ya que la imagen indicada no existe' });
            } else {
                if (hasThumbnail) {
                    fs.unlink(delete_file_thumb_path, (err) => {
                        if (err) {
                            rejected({ status: 'error', message: 'No se elimina el thumbnail ya que el thumbnail indicado no existe' });
                        } else {
                            resolve({ status: 'ok' });
                        }
                    });
                } else {
                    resolve({ status: 'ok' });
                }
            }
        });
    });
}

module.exports = {
    uploadImage,
    deleteImage,
    getImage
};