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
        invitation_from_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        invitation_to_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
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
        invitations.belongsTo(models.users, {
            foreignKey: 'invitation_to_id',
            as: 'user_to_invite'
        });
        invitations.belongsTo(models.users, {
            foreignKey: 'invitation_from_id',
            as: 'invitation_from_user'
        });
        invitations.belongsTo(models.novels, {
            foreignKey: 'invitation_novel',
            as: 'novel'
        });
    };

    return invitations;
};