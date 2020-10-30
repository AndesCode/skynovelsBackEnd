/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const chapters = sequelize.define('chapters', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        chp_author: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        chp_translator: {
            type: DataTypes.STRING(12),
            validate: {
                len: {
                    args: [0, 12],
                    msg: 'El traductor del capitulo debe tener entre 0 y 12 caracteres'
                },
            }
        },
        nvl_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        vlm_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        chp_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    const self = this;
                    chapters.findOne({
                            where: {
                                [Op.and]: [{ nvl_id: this.nvl_id }, { chp_number: value }]
                            }
                        }).then(function(chapter) {
                            if (chapter && self.id !== chapter.id) {
                                return next({ message: 'Error, ya tienes un capitulo con este numero de capitulo' });
                            } else {
                                return next();
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                isNumeric: {
                    msg: 'El numero de capitulo debe ser numerico'
                }
            }
        },
        chp_content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: {
                    args: [50, 65535],
                    msg: 'El contenido del capitulo debe tener entre 50 y 65.535 caracteres'
                },
            }
        },
        chp_review: {
            type: DataTypes.STRING(5500),
            validate: {
                len: {
                    args: [0, 5500],
                    msg: 'El comentario del escritor debe tener entre 0 y 5.500 caracteres'
                },
            }
        },
        chp_title: {
            type: DataTypes.STRING(250),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 250],
                    msg: 'El titulo del capitulo debe tener entre 2 y 250 caracteres'
                },
            }
        },
        chp_index_title: {
            type: DataTypes.STRING(60),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 60],
                    msg: 'El titulo indice del capitulo debe tener entre 2 y 60 caracteres'
                },
            }
        },
        chp_status: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: {
                    args: [
                        ['Active', 'Disabled']
                    ],
                    msg: 'El estado que se intenta asignar no esta permitido'
                }
            }
        },
        chp_name: {
            type: DataTypes.STRING(60),
            validate: { len: [2, 60] }
        },
    });

    chapters.associate = function(models) {
        chapters.belongsTo(models.volumes, {
            foreignKey: 'vlm_id',
            as: 'volume',
        });
        chapters.belongsTo(models.novels, {
            foreignKey: 'nvl_id',
            as: 'novel',
        });
        chapters.belongsTo(models.users, {
            foreignKey: 'chp_author',
            as: 'author'
        });
        chapters.hasMany(models.bookmarks, {
            foreignKey: 'chp_id',
            as: 'bookmarks',
        });
        chapters.hasMany(models.comments, {
            foreignKey: 'chp_id',
            as: 'comments',
        });
    };

    chapters.beforeCreate((chapter, options) => {
        chapter.chp_title = chapter.chp_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        chapter.chp_index_title = chapter.chp_index_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        chapter.chp_name = chapter.chp_index_title.replace(/[\s-]+/g, ' ');
        chapter.chp_name = chapter.chp_name.split(' ').join('-');
        chapter.chp_name = chapter.chp_name.toLowerCase();
    });
    chapters.beforeUpdate((chapter, options) => {
        chapter.chp_title = chapter.chp_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        chapter.chp_index_title = chapter.chp_index_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        chapter.chp_name = chapter.chp_index_title.replace(/[\s-]+/g, ' ');
        chapter.chp_name = chapter.chp_name.split(' ').join('-');
        chapter.chp_name = chapter.chp_name.toLowerCase();
    });

    return chapters;
};