/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const invitations = sequelize.define('invitations', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        invitation_from_id: DataTypes.INTEGER,
        invitation_to_id: DataTypes.INTEGER,
        invitation_novel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        invitation_status: {
            type: DataTypes.STRING(9),
            validate: {
                isIn: [
                    ['Active', 'Confirmed', 'Rejected']
                ],
            }
        }
    });

    invitations.associate = function(models) {
        console.log('Inicia asociaciones');
        invitations.belongsTo(models.users, {
            foreignKey: 'invitation_to_id',
            as: 'users'
        });
    };

    return invitations;
};