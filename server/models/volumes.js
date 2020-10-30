/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const volumes = sequelize.define('volumes', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        nvl_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        vlm_title: {
            type: DataTypes.STRING(125),
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    volumes.findOne({
                            where: {
                                [Op.and]: [{ nvl_id: this.nvl_id }, { vlm_title: value }]
                            }
                        }).then(function(volumes) {
                            if (volumes && self.id !== volumes.id) {
                                return next({ message: 'error, nombre coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                len: {
                    args: [4, 125],
                    msg: 'El titulo del volumen o libro debe tener entre 4 y 125 caracteres'
                },
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
    }, {
        timestamps: false,
    });

    volumes.associate = function(models) {
        volumes.belongsTo(models.novels, {
            foreignKey: 'nvl_id',
            as: 'novel',
        });
        volumes.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user',
        });
        volumes.hasMany(models.chapters, {
            foreignKey: 'vlm_id',
            as: 'chapters',
        });
    };

    return volumes;
};