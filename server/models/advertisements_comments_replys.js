/*jshint esversion: 6 */
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const advertisements_comments_replys = sequelize.define('advertisements_comments_replys', {
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
        adv_comment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        adv_comment_reply: {
            type: DataTypes.STRING(2000),
            allowNull: false,
            validate: {
                len: [2, 2000]
            }

        },
    });

    advertisements_comments_replys.associate = function(models) {
        advertisements_comments_replys.belongsTo(models.advertisements_comments, {
            foreignKey: 'adv_comment_id',
            as: 'advertisement_comment'
        });
        advertisements_comments_replys.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        advertisements_comments_replys.hasMany(models.likes, {
            foreignKey: 'adv_comment_reply_id',
            as: 'likes',
        });
    };

    return advertisements_comments_replys;
};