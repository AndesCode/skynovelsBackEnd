/*jshint esversion: 6 */
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const replys = sequelize.define('replys', {
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
        comment_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        novel_rating_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        reply_content: {
            type: DataTypes.STRING(2000),
            allowNull: false,
            validate: {
                len: [2, 2000]
            }
        },
    });

    replys.associate = function(models) {
        replys.belongsTo(models.comments, {
            foreignKey: 'comment_id',
            as: 'comment'
        });
        replys.belongsTo(models.novels_ratings, {
            foreignKey: 'novel_rating_id',
            as: 'novel_rating'
        });
        replys.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        replys.hasMany(models.likes, {
            foreignKey: 'reply_id',
            as: 'likes',
        });
    };

    return replys;
};