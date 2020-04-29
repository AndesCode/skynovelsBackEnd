/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    const bookmarks = sequelize.define('bookmarks', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        nvl_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    const self = this;
                    bookmarks.findOne({
                            where: {
                                [Op.and]: [{ user_id: this.user_id }, { nvl_id: value }]
                            }
                        }).then(function(user_reading_list) {
                            if (user_reading_list && self.id !== user_reading_list.id) {
                                return next({ message: 'error, No puedes agregar dos veces una misma novela a una lista de lectura' });
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
        bkm_chapter: DataTypes.INTEGER
    });

    bookmarks.associate = function(models) {
        bookmarks.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        bookmarks.belongsTo(models.novels, {
            foreignKey: 'nvl_id',
            as: 'novel'
        });
        bookmarks.belongsTo(models.chapters, {
            foreignKey: 'bkm_chapter',
            as: 'bookmarks'
        });
    };

    bookmarks.beforeCreate((bookmark, options) => {
        bookmark.bkm_chapter = 1;
    });

    return bookmarks;
};