/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const capitulos = sequelize.define('capitulos', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        chp_author: DataTypes.INTEGER,
        nvl_id: DataTypes.INTEGER,
        chp_content: DataTypes.TEXT,
        chp_title: DataTypes.TEXT,
        chp_comment_status: DataTypes.CHAR,
        chp_post_name: DataTypes.CHAR,
        chp_comment_count: DataTypes.INTEGER



    });

    return capitulos;
};