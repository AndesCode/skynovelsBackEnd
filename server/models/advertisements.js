/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const advertisements = sequelize.define('advertisements', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        adv_title: {
            type: DataTypes.STRING(125),
            allowNull: false,
            validate: {
                len: {
                    args: [5, 125],
                    msg: 'El titulo del anuncio debe tener entre 5 y 125 caracteres'
                },
            }
        },
        adv_name: {
            type: DataTypes.STRING(250)
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        adv_content: {
            type: DataTypes.STRING(10000),
            allowNull: false,
            validate: {
                len: {
                    args: [15, 10000],
                    msg: 'El contenido del anuncio debe tener entre 15 y 10.000 caracteres'
                },
            }
        },
        image: {
            type: DataTypes.STRING(250),
            validate: {
                len: [0, 250],
            }
        },
        adv_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isUniqueOrder: function(value, next) {
                    const self = this;
                    advertisements.findOne({
                            where: {
                                adv_order: value
                            }
                        }).then(function(advertisement) {
                            if (advertisement && self.id !== advertisement.id) {
                                return next({ message: 'Error, ya tienes un anuncio con este numero de orden' });
                            } else {
                                return next();
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                isNumeric: {
                    msg: 'El orden de anuncio debe ser numerico'
                }
            }
        }
    });

    advertisements.associate = function(models) {
        advertisements.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        advertisements.hasMany(models.comments, {
            foreignKey: 'adv_id',
            as: 'comments'
        });
        advertisements.hasMany(models.likes, {
            foreignKey: 'adv_id',
            as: 'likes'
        });
    };

    advertisements.beforeCreate((advertisement, options) => {
        advertisement.adv_title = advertisement.adv_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        advertisement.adv_name = advertisement.adv_title.replace(/[\s-]+/g, ' ');
        advertisement.adv_name = advertisement.adv_name.split(' ').join('-');
        advertisement.adv_name = advertisement.adv_name.toLowerCase();
    });
    advertisements.beforeUpdate((advertisement, options) => {
        advertisement.adv_title = advertisement.adv_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        advertisement.adv_name = advertisement.adv_title.replace(/[\s-]+/g, ' ');
        advertisement.adv_name = advertisement.adv_name.split(' ').join('-');
        advertisement.adv_name = advertisement.adv_name.toLowerCase();
    });

    return advertisements;
};