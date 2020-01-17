/*jshint esversion: 6 */
// Models
const forum_categories = require('../models').forum_categories;
const users = require('../models').users;
const novels = require('../models').novels;
// Sequelize
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

function adminPanelAccess(req, res) {
    res.status(200).send({ message: 'Acceso otorgado' });
}

function createCategory(req, res) {
    const body = req.body;
    forum_categories.create(body).then(forum_category => {
        res.status(200).send({ forum_category });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al crear la nueva categoria para el foro ' + err });
    });
}

function updateCategory(req, res) {
    const body = req.body;
    forum_categories.findByPk(body.id).then(forum_category => {
        forum_category.update(body).then((forum_category) => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al actualizar el post ' + err });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar el post ' + err });
    });
}

function deleteCategory(req, res) {
    const id = req.params.id;
    forum_categories.findByPk(id).then(forum_category => {
        forum_category.destroy({
            where: {
                id: id
            }
        }).then(() => {
            res.status(200).send({ forum_category });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar la categoria del foro ' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar la categoria del foro ' });
    });
}

// Users

function getUsers(req, res) {
    let status = req.params.status;
    if (status === 'All') {
        status = {
            [Op.ne]: null
        };
    }
    users.findAll({
        include: [{
            model: novels,
            as: 'collaborations',
            attributes: ['id'],
            through: { attributes: [] }
        }, {
            model: novels,
            as: 'novels',
            attributes: ['id', 'nvl_title', 'nvl_status', 'nvl_name', 'createdAt', 'updatedAt']
        }, {
            model: invitations,
            as: 'invitations',
            attributes: ['id', 'invitation_status']
        }, {
            model: novels_ratings,
            as: 'novels_ratings',
            attributes: ['id', 'novel_id', 'rate_value']
        }],
        attributes: ['id', 'user_login', 'user_email', 'user_rol', 'user_status', 'user_forum_auth', 'user_description', 'createdAt', 'updatedAt'],
        where: {
            user_status: status
        }
    }).then(users => {
        res.status(200).send({ users });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al buscar la novela' + err });
    });
}

function deleteUser(req, res) {
    var id = req.params.id;
    users.findByPk(id).then(user => {
        user.destroy({
            where: {
                id: id
            }
        }).then(user => {
            res.status(200).send({ user });
        }).catch(err => {
            res.status(500).send({ message: 'Ocurrio un error al eliminar el usuario' });
        });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error al encontrar el usuario' });
    });
}



module.exports = {
    adminPanelAccess,
    createCategory,
    updateCategory,
    deleteCategory,
    getUsers,
    deleteUser
};