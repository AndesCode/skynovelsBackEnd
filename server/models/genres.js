/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const genres = sequelize.define('genres', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        genre_name: DataTypes.TEXT
    }, {
        timestamps: false,
    });

    return genres;
};