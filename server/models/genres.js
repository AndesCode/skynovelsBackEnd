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

    genres.associate = function(models) {
        console.log('Inicia asociaciones generos-novelas');
        genres.belongsToMany(models.novels, {
            through: 'genres_novels',
            as: 'novels',
            foreignKey: 'genre_id'
        });
    };

    return genres;
};