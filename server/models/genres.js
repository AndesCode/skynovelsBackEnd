/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const genres = sequelize.define('genres', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        genre_name: DataTypes.TEXT,
        novel_id: DataTypes.INTEGER,
        genre_id: DataTypes.INTEGER
    });

    return genres;
};