/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const invitations = sequelize.define('invitations', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        invitation_from_id: DataTypes.INTEGER,
        invitation_to_id: DataTypes.INTEGER,
        invitation_novel: DataTypes.INTEGER,
        invitation_status: DataTypes.TEXT
    });

    return invitations;
};