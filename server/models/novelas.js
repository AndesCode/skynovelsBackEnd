/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novelas = sequelize.define('novelas', {
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
        nvl_name: DataTypes.CHAR,
        nvl_comment_count: DataTypes.INTEGER,
        nvl_writer: DataTypes.CHAR,
        nvl_img: DataTypes.CHAR



    });

    return novelas;
};