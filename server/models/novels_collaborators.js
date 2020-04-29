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
        novel_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER
    });

    return novels_collaborators;
};