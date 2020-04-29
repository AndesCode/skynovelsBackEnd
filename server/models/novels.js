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
        nvl_translator: DataTypes.STRING(25),
        nvl_translator_eng: DataTypes.STRING(25),
        nvl_content: DataTypes.STRING(1500),
        nvl_title: DataTypes.STRING(65),
        nvl_acronym: DataTypes.STRING(8),
        nvl_status: DataTypes.STRING(8),
        nvl_publication_date: DataTypes.DATE,
        nvl_name: {
            type: DataTypes.STRING(75),
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    novels.findOne({ where: { nvl_name: value } })
                        .then(function(novels) {
                            if (novels && self.id !== novels.id) {
                                return next({ message: 'error, nombre de novela coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                }
            }
        },
        nvl_writer: DataTypes.STRING(25),
        nvl_img: DataTypes.STRING(65),
    });

    novels.associate = function(models) {
        console.log('Inicia asociaciones novelas-generos');
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
    });
    novels.beforeUpdate((novel, options) => {
        novel.nvl_title = novel.nvl_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        novel.nvl_name = novel.nvl_title.replace(/[\s-]+/g, ' ');
        novel.nvl_name = novel.nvl_name.split(' ').join('-');
        novel.nvl_name = novel.nvl_name.toLowerCase();
    });

    return novels;
};