/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const postsComments = sequelize.define('posts_comments', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        post_comment_content: DataTypes.CHAR,
        post_comment_author_id: DataTypes.INTEGER,
        forum_topic_id: DataTypes.INTEGER


        /*         nvl_author: DataTypes.INTEGER */

    }, {
        freezeTableName: true
    });

    postsComments.associate = function(models) {
        postsComments.belongsTo(models.posts, { as: 'posts', foreignKey: 'id' });
    };

    return postsComments;
};