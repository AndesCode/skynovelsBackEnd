/*jshint esversion: 6 */
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const chapters_comments = sequelize.define('chapters_comments', {
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
        chapter_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        chapter_comment: DataTypes.STRING(2000),
    });

    chapters_comments.associate = function(models) {
        console.log('Inicia asociaciones');
        chapters_comments.belongsTo(models.chapters, {
            foreignKey: 'chapter_id',
            as: 'chapter'
        });
        chapters_comments.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        chapters_comments.hasMany(models.chapters_comments_likes, {
            foreignKey: 'chapter_comment_id',
            as: 'likes',
        });
    };

    return chapters_comments;
};