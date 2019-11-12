/*jshint esversion: 6 */
module.exports = (sequelized, DataTypes) => {
    const forum = sequelized.define('forum', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        forum_type: DataTypes.TEXT,
        forum_category_description: DataTypes.TEXT
    }, {
        timestamps: false,
        freezeTableName: true
    });
    return forum;
};