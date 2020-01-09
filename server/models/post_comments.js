/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const posts_comments = sequelize.define('posts_comments', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        comment_content: DataTypes.TEXT,
        comment_author_id: DataTypes.INTEGER,
        forum_post_id: DataTypes.INTEGER
    });

    posts_comments.associate = function(models) {
        console.log('Inicia asociaciones');
        posts_comments.belongsTo(models.forum_posts, {
            foreignKey: 'forum_post_id',
            as: 'forum_post',
        });
    };

    return posts_comments;
};