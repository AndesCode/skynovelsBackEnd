/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novels = sequelize.define('novels', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        nvl_author: DataTypes.INTEGER,
        nvl_content: DataTypes.TEXT,
        nvl_title: DataTypes.TEXT,
        nvl_status: DataTypes.CHAR,
        nvl_comment_status: DataTypes.CHAR,
        nvl_name: {
            type: DataTypes.CHAR,
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
        nvl_comment_count: DataTypes.INTEGER,
        nvl_writer: DataTypes.CHAR,
        nvl_img: DataTypes.CHAR,
        nvl_rating: DataTypes.INTEGER
    });

    novels.associate = function(models) {
        console.log('Inicia asociaciones novelas-generos');
        novels.belongsToMany(models.genres, {
            through: 'genres_novels',
            as: 'genres',
            foreignKey: 'novel_id'
        });
        novels.hasMany(models.chapters, {
            foreignKey: 'nvl_id',
            as: 'chapters',
            onDelete: 'cascade',
            hooks: true,
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
        novels.hasMany(models.user_reading_lists, {
            foreignKey: 'nvl_id',
            as: 'user_reading_lists',
        });
    };

    novels.beforeCreate((novel, options) => {
        novel.nvl_title = novel.nvl_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        novel.nvl_name = novel.nvl_title.split(' ').join('-');
        novel.nvl_name = novel.nvl_name.toLowerCase();
    });
    novels.beforeUpdate((novel, options) => {
        novel.nvl_title = novel.nvl_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        novel.nvl_name = novel.nvl_title.split(' ').join('-');
        novel.nvl_name = novel.nvl_name.toLowerCase();
    });

    return novels;
};