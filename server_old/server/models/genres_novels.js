/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const genres_novels = sequelize.define('genres_novels', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        novel_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        genre_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
    }, {
        timestamps: false,
    });

    return genres_novels;
};