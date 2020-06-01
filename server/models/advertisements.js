/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const advertisements = sequelize.define('advertisements', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        adv_title: {
            type: DataTypes.STRING(125),
            allowNull: false
        },
        adv_name: {
            type: DataTypes.STRING(250)
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        adv_content: {
            type: DataTypes.STRING(10000),
            allowNull: false
        },
        adv_img: {
            type: DataTypes.STRING(60)
        },
        adv_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        }
    });

    advertisements.associate = function(models) {
        advertisements.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    advertisements.beforeCreate((advertisement, options) => {
        advertisement.adv_title = advertisement.adv_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        advertisement.adv_name = advertisement.adv_title.replace(/[\s-]+/g, ' ');
        advertisement.adv_name = advertisement.adv_name.split(' ').join('-');
        advertisement.adv_name = advertisement.adv_name.toLowerCase();
    });
    advertisements.beforeUpdate((advertisement, options) => {
        advertisement.adv_title = advertisement.adv_title.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
        advertisement.adv_name = advertisement.adv_title.replace(/[\s-]+/g, ' ');
        advertisement.adv_name = advertisement.adv_name.split(' ').join('-');
        advertisement.adv_name = advertisement.adv_name.toLowerCase();
    });

    return advertisements;
};