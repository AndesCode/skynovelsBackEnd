/*jshint esversion: 6 */
module.exports = (sequelized, DataTypes) => {
    const forum_categories = sequelized.define('forum_categories', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        category_name: {
            type: DataTypes.STRING(15),
            validate: {
                isUniqueCategory: function(value, next) {
                    var self = this;
                    forum_categories.findOne({ where: { category_name: value } })
                        .then(function(forum_category) {
                            if (forum_category && self.id !== forum_category.id) {
                                return next({ message: 'error, ya existe una categoria con nombre ' + value });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                }
            }
        },
        category_title: DataTypes.STRING(35),
        category_description: DataTypes.TEXT('tiny'),
        category_order: DataTypes.INTEGER
    }, {
        timestamps: false,
    });

    forum_categories.associate = function(models) {
        forum_categories.hasMany(models.forum_posts, {
            foreignKey: 'forum_category_id',
            as: 'forum_posts'
        });
    };


    return forum_categories;
};