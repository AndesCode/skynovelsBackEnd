/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    const novels_ratings = sequelize.define('novels_ratings', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true,
                isUniqueUserRating: function(value, next) {
                    const self = this;
                    novels_ratings.findOne({
                            where: {
                                [Op.and]: [{ user_id: value }, { novel_id: this.novel_id }]
                            }
                        }).then(function(novel_rating) {
                            if (novel_rating && self.id !== novel_rating.id) {
                                return next({ message: 'error, el usuario ya ha dejado una clasificacion para la novela' });
                            } else {
                                return next();
                            }
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
            }
        },
        novel_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        rate_value: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true,
                max: 5,
                min: 1
            }
        },
        rate_comment: {
            type: DataTypes.CHAR,
            allowNull: false,
            validate: {
                len: [5, 1500]
            }

        },
    });

    novels_ratings.associate = function(models) {
        console.log('Inicia asociaciones');
        novels_ratings.belongsTo(models.novels, {
            foreignKey: 'novel_id',
            as: 'novel'
        });
        novels_ratings.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        novels_ratings.hasMany(models.novels_ratings_likes, {
            foreignKey: 'novel_rating_id',
            as: 'likes',
        });
        novels_ratings.hasMany(models.novels_ratings_comments, {
            foreignKey: 'novel_rating_id',
            as: 'comments',
        });
    };



    return novels_ratings;
};