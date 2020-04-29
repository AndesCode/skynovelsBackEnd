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
        chp_translator: DataTypes.STRING(45),
        chp_translator_eng: DataTypes.STRING(45),
        nvl_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isValidNovel: function(value, next) {
                    novels.findOne({ where: { id: value } })
                        .then(function(novel) {
                            if (novel) {
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
        chp_review: DataTypes.STRING(500),
        chp_title: {
            type: DataTypes.STRING(90),
            allowNull: false,
            validate: { len: [2, 90] }
        },
        chp_index_title: {
            type: DataTypes.STRING(90),
            allowNull: false,
            validate: { len: [2, 90] }
        },
        chp_status: DataTypes.STRING(25),
        chp_comment_status: DataTypes.STRING(25),
        chp_name: DataTypes.TEXT,
        chp_comment_count: DataTypes.INTEGER



    });

    chapters.associate = function(models) {
        console.log('Inicia asociaciones');
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
        chapters.hasMany(models.chapters_comments, {
            foreignKey: 'chapter_id',
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