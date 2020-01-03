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

    user_reading_lists.associate = function(models) {
        user_reading_lists.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        user_reading_lists.belongsTo(models.novels, {
            foreignKey: 'nvl_id',
            as: 'novels'
        });
    };

    return user_reading_lists;
};