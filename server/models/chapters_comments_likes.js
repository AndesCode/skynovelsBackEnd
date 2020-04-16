/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    const chapters_comments_likes = sequelize.define('chapters_comments_likes', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        chapter_comment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    const self = this;
                    chapters_comments_likes.findOne({
                            where: {
                                [Op.and]: [{ user_id: this.user_id }, { chapter_comment_id: value }]
                            }
                        }).then(function(chapter_comment_like) {
                            if (chapter_comment_like && self.id !== chapter_comment_like.id) {
                                return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        user_id: DataTypes.INTEGER,
    }, {
        timestamps: false,
    });

    chapters_comments_likes.associate = function(models) {
        console.log('Inicia asociaciones');
        chapters_comments_likes.belongsTo(models.chapters_comments, {
            foreignKey: 'chapter_comment_id',
            as: 'chapter_comment'
        });
        chapters_comments_likes.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return chapters_comments_likes;
};