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
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        vlm_title: {
            type: DataTypes.STRING(65),
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    volumes.findOne({
                            where: {
                                [Op.and]: [{ nvl_id: this.nvl_id }, { vlm_title: value }]
                            }
                        }).then(function(volumes) {
                            if (volumes && self.id !== volumes.id) {
                                return next({ message: 'error, nombre de novela coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                len: [4, 65]
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
        console.log('Inicia asociaciones');
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