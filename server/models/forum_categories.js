/*jshint esversion: 6 */
module.exports = (sequelized, DataTypes) => {
    const forum_categories = sequelized.define('forum_categories', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        category_name: DataTypes.STRING(15),
        category_description: DataTypes.TEXT('tiny')
    }, {
        timestamps: false,
    });

    forum_categories.associate = function(models) {
        forum_categories.hasMany(models.forum_posts, {
            foreignKey: 'forum_category_id',
            as: 'posts'
        });
    };


    return forum_categories;
};