/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const user_reading_lists = sequelize.define('user_reading_lists', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id: DataTypes.INTEGER,
        nvl_id: DataTypes.INTEGER,
        nvl_chapter: DataTypes.INTEGER,
    });

    return user_reading_lists;
};