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
        chp_number: DataTypes.INTEGER,
        chp_content: DataTypes.TEXT,
        chp_review: DataTypes.TEXT,
        chp_title: DataTypes.TEXT,
        chp_status: DataTypes.TEXT,
        chp_comment_status: DataTypes.CHAR,
        chp_post_name: DataTypes.CHAR,
        chp_comment_count: DataTypes.INTEGER



    });

    return chapters;
};