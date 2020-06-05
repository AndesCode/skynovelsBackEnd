/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    const novels_ratings_comments = sequelize.define('novels_ratings_comments', {
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
        novel_rating_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        novel_rating_comment: {
            type: DataTypes.STRING(2000),
            allowNull: false,
            validate: {
                len: [1, 2000]
            }

        },
    });

    novels_ratings_comments.associate = function(models) {
        novels_ratings_comments.belongsTo(models.novels_ratings, {
            foreignKey: 'novel_rating_id',
            as: 'novel_rating'
        });
        novels_ratings_comments.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        novels_ratings_comments.hasMany(models.likes, {
            foreignKey: 'novel_rating_comment_id',
            as: 'likes',
        });
    };



    return novels_ratings_comments;
};