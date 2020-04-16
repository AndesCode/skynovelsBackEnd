/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    const novels_ratings_likes = sequelize.define('novels_ratings_likes', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        novel_rating_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    const self = this;
                    novels_ratings_likes.findOne({
                            where: {
                                [Op.and]: [{ user_id: this.user_id }, { novel_rating_id: value }]
                            }
                        }).then(function(novel_rating_like) {
                            if (novel_rating_like && self.id !== novel_rating_like.id) {
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

    novels_ratings_likes.associate = function(models) {
        console.log('Inicia asociaciones');
        novels_ratings_likes.belongsTo(models.novels_ratings, {
            foreignKey: 'novel_rating_id',
            as: 'novel_rating'
        });
        novels_ratings_likes.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return novels_ratings_likes;
};