/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const chapters = sequelize.define('chapters', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        chp_author: DataTypes.INTEGER,
        nvl_id: DataTypes.INTEGER,
        chp_number: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    var self = this;
                    chapters.findOne({ where: { chp_number: value } })
                        .then(function(chapter) {
                            // console.log(chapter);
                            if (chapter && self.nvl_id === chapter.nvl_id) {
                                // console.log(chapter.nvl_id);
                                // console.log(self.nvl_id);
                                return next({ message: 'error, ya tienes un capitulo con este numero de capitulo' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                }
            }
        },
        chp_content: DataTypes.TEXT,
        chp_review: DataTypes.TEXT,
        chp_title: DataTypes.TEXT,
        chp_status: DataTypes.TEXT,
        chp_comment_status: DataTypes.CHAR,
        chp_post_name: DataTypes.CHAR,
        chp_comment_count: DataTypes.INTEGER



    });

    chapters.beforeCreate((chapter, options) => {
        console.log('Ejecutando before create');
        console.log(chapter.nvl_id);
        // console.log(options);
    });

    return chapters;
};