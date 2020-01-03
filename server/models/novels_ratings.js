/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const novels_ratings = sequelize.define('novels_ratings', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id: DataTypes.INTEGER,
        novel_id: DataTypes.TEXT,
        rate_value: DataTypes.TEXT,
        rate_comment: DataTypes.CHAR
    });

    novels_ratings.associate = function(models) {
        console.log('Inicia asociaciones');
        novels_ratings.belongsTo(models.novels, {
            foreignKey: 'novel_id',
            as: 'novels'
        });
        novels_ratings.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };



    return novels_ratings;
};