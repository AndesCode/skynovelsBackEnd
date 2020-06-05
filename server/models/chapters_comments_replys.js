/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const chapters_comments_replys = sequelize.define('chapters_comments_replys', {
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
        chapter_comment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        chapter_comment_reply: {
            type: DataTypes.STRING(2000),
            allowNull: false,
            validate: {
                len: [1, 2000]
            }

        },
    });

    chapters_comments_replys.associate = function(models) {
        chapters_comments_replys.belongsTo(models.chapters_comments, {
            foreignKey: 'chapter_comment_id',
            as: 'chapter_comment'
        });
        chapters_comments_replys.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        chapters_comments_replys.hasMany(models.likes, {
            foreignKey: 'chapter_comment_reply_id',
            as: 'likes',
        });
    };

    return chapters_comments_replys;
};