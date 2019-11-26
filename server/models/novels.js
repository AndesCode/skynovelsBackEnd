/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novels = sequelize.define('novels', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        nvl_author: DataTypes.INTEGER,
        nvl_content: DataTypes.TEXT,
        nvl_title: DataTypes.TEXT,
        nvl_status: DataTypes.CHAR,
        nvl_comment_status: DataTypes.CHAR,
        nvl_name: {
            type: DataTypes.CHAR,
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    novels.findOne({ where: { nvl_name: value } })
                        .then(function(novels) {
                            if (novels && self.id !== novels.id) {
                                return next({ message: 'error, nombre de novela coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                }
            }
        },
        nvl_comment_count: DataTypes.INTEGER,
        nvl_writer: DataTypes.CHAR,
        nvl_img: DataTypes.CHAR,
        nvl_rating: DataTypes.INTEGER
    });

    return novels;
};