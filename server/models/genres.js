/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const genres = sequelize.define('genres', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        genre_name: {
            type: DataTypes.STRING(25),
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    genres.findOne({ where: { genre_name: value } })
                        .then(function(genre) {
                            if (genre && self.id !== genre.id) {
                                return next({ message: 'error, nombre de genero coincidente' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                }
            },
            len: [2, 25],
        },
    }, {
        timestamps: false,
    });

    genres.associate = function(models) {
        genres.belongsToMany(models.novels, {
            through: 'genres_novels',
            as: 'novels',
            foreignKey: 'genre_id'
        });
    };

    return genres;
};