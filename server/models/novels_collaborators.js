/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novels_collaborators = sequelize.define('novels_collaborators', {
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
        user_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
    });

    return novels_collaborators;
};