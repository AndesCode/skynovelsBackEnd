/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const novels_model = require('../models').novels;

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
        chp_translator: DataTypes.STRING(45),
        chp_translator_eng: DataTypes.STRING(45),
        nvl_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isValidNovel: function(value, next) {
                    chapters.sequelize.query('SELECT n.id FROM novels n WHERE n.id = ' + value, { type: chapters.sequelize.QueryTypes.SELECT })
                        .then(function(novel) {
                            if (novel.length > 0) {
                                return next();
                            } else {
                                return next({ message: 'error, No existe una novela para asociar el capitulo' });
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                isNumeric: true
            }
        },
        vlm_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isValidNovel: function(value, next) {
                    chapters.sequelize.query('SELECT v.id FROM volumes v WHERE v.id = ' + value + ' AND v.nvl_id = ' + this.nvl_id, { type: chapters.sequelize.QueryTypes.SELECT })
                        .then(function(volume) {
                            if (volume.length > 0) {
                                return next();
                            } else {
                                return next({ message: 'error, No existe un volumen para asociar el capitulo' });
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
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
                                return next({ message: 'error, ya tienes un capitulo con este numero de capitulo' });
                            } else {
                                return next();
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                isNumeric: true,
            }
        },
        chp_content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        chp_review: {
            type: DataTypes.STRING(1500),
            validate: {
                len: [0, 1500]
            }
        },
        chp_title: {
            type: DataTypes.STRING(90),
            allowNull: false,
            validate: {
                len: [2, 90]
            }
        },
        chp_index_title: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: { len: [2, 30] }
        },
        chp_status: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: [
                    ['Active', 'Disabled']
                ],
            }
        },
        chp_name: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: { len: [2, 30] }
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
            foreignKey: 'bkm_chapter',
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