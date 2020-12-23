/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novels = sequelize.define('novels', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        nvl_author: DataTypes.INTEGER,
        nvl_translator: {
            type: DataTypes.STRING(25),
            defaultValue: null,
            validate: {
                len: {
                    args: [0, 25],
                    msg: 'El nombre del traductor de la novela debe tener entre 0 y 25 caracteres'
                }
            }
        },
        nvl_translator_eng: {
            type: DataTypes.STRING(25),
            defaultValue: null,
            validate: {
                len: {
                    args: [0, 25],
                    msg: 'El nombre del traductor a ingles de la novela debe tener entre 0 y 25 caracteres'
                }
            }
        },
        nvl_content: {
            type: DataTypes.STRING(2500),
            allowNull: false,
            validate: {
                len: {
                    args: [15, 2500],
                    msg: 'La sinopsis de la novela debe tener entre 15 y 2500 caracteres'
                }
            }
        },
        nvl_title: {
            type: DataTypes.STRING(60),
            allowNull: false,
            validate: {
                isUnique: function(value, next) {
                    const self = this;
                    novels.findOne({ where: { nvl_title: value } })
                        .then(function(novel) {
                            if (novel && self.id !== novel.id) {
                                return next({ message: 'error, nombre de novela coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                len: {
                    args: [4, 60],
                    msg: 'El titulo de la novela debe tener entre 4 y 60 caracteres'
                },
                notNull: {
                    msg: 'Falta Indicar un titulo para la novela'
                }
            }
        },
        nvl_acronym: DataTypes.STRING(8),
        nvl_status: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: {
                    args: [
                        ['Active', 'Disabled', 'Finished']
                    ],
                    msg: 'El estado que se intenta asignar no esta permitido'
                }
            }
        },
        nvl_publication_date: DataTypes.DATE,
        nvl_name: {
            type: DataTypes.STRING(75),
            validate: {
                isUnique: function(value, next) {
                    const self = this;
                    novels.findOne({ where: { nvl_name: value } })
                        .then(function(novel) {
                            if (novel && self.id !== novel.id) {
                                return next({ message: 'error, nombre de novela coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                len: [0, 75],
            }
        },
        nvl_writer: {
            type: DataTypes.STRING(25),
            allowNull: false,
            validate: {
                len: {
                    args: [0, 25],
                    msg: 'El escritor de la novela debe tener entre 0 y 25 caracteres'
                },
                notNull: {
                    msg: 'Falta Indicar el autor de la novela'
                }
            }
        },
        image: {
            type: DataTypes.STRING(250),
            validate: {
                len: [0, 250],
            }
        },
        nvl_recommended: DataTypes.BOOLEAN,
    });

    novels.associate = function(models) {
        novels.belongsToMany(models.genres, {
            through: 'genres_novels',
            as: 'genres',
            foreignKey: 'novel_id'
        });
        novels.hasMany(models.volumes, {
            foreignKey: 'nvl_id',
            as: 'volumes',
        });
        novels.hasMany(models.chapters, {
            foreignKey: 'nvl_id',
            as: 'chapters',
        });
        novels.belongsToMany(models.users, {
            through: 'novels_collaborators',
            as: 'collaborators',
            foreignKey: 'novel_id'
        });
        novels.hasMany(models.novels_ratings, {
            foreignKey: 'novel_id',
            as: 'novel_ratings'
        });
        novels.belongsTo(models.users, {
            foreignKey: 'nvl_author',
            as: 'author'
        });
        novels.hasMany(models.bookmarks, {
            foreignKey: 'nvl_id',
            as: 'bookmarks',
        });
    };

    novels.beforeCreate((novel, options) => {
        novel.nvl_title = novel.nvl_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        novel.nvl_name = novel.nvl_title.replace(/[\s-]+/g, ' ');
        novel.nvl_name = novel.nvl_name.split(' ').join('-');
        novel.nvl_name = novel.nvl_name.toLowerCase();
        novel.nvl_recommended = false;
    });
    novels.beforeUpdate((novel, options) => {
        novel.nvl_title = novel.nvl_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        novel.nvl_name = novel.nvl_title.replace(/[\s-]+/g, ' ');
        novel.nvl_name = novel.nvl_name.split(' ').join('-');
        novel.nvl_name = novel.nvl_name.toLowerCase();
    });

    return novels;
};