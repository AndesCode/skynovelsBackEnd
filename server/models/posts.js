/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const posts = sequelize.define('posts', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        post_author_id: DataTypes.INTEGER,
        post_title: DataTypes.TEXT,
        post_content: DataTypes.TEXT,
        forum_type_id: DataTypes.INTEGER,
    }, {
        freezeTableName: true
    });

    posts.associate = function(models) {
        posts.hasMany(models.posts_comments, { as: 'comments', foreignKey: 'forum_topic_id' });
    };

    return posts;
};