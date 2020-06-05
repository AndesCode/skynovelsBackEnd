/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const forum_posts = sequelize.define('forum_posts', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        post_author_id: DataTypes.INTEGER,
        post_title: DataTypes.TEXT('tiny'),
        post_content: DataTypes.TEXT,
        forum_category_id: DataTypes.INTEGER,
        post_pinned: DataTypes.BOOLEAN,
    }, {
        freezeTableName: true
    });

    forum_posts.associate = function(models) {
        forum_posts.belongsTo(models.forum_categories, {
            foreignKey: 'forum_category_id',
            as: 'forum_category'
        });
        forum_posts.hasMany(models.posts_comments, {
            foreignKey: 'forum_post_id',
            as: 'post_comments'
        });
        forum_posts.belongsTo(models.users, {
            foreignKey: 'post_author_id',
            as: 'user'
        });
    };



    return forum_posts;
};