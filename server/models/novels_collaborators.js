/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const novels_collaborators = sequelize.define('novels_collaborators', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        novel_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        novels_collaborators.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { novel_id: value }]
                                }
                            }).then(function(novel_collaborator) {
                                if (novel_collaborator) {
                                    return next({ message: 'Error, el usuario ya es colaborador de la novela indicada' });
                                } else {
                                    return next();
                                }
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    } else {
                        return next();
                    }
                },
                isNumeric: true,
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
    });

    return novels_collaborators;
};