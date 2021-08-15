/*jshint esversion: 6 */
const notifications_model = require('../models').notifications;
const socketsService = require('./socketService');

function createNotification(notificationToUserId, objectId, objectName) {
    notifications_model.create({
        user_id: notificationToUserId,
        [objectName]: objectId
    }).then((notification) => {
        deleteOldNotifications();
        socketsService.notifyUser(notification.user_id);
    }).catch(err => {
        const message = 'Ocurrio un error al cargar el objeto';
        console.log('error ' + err);
        return message;
    });
}

function deleteOldNotifications() {
    notifications_model.sequelize.query('DELETE FROM notifications WHERE DATE(createdAt) < DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY)', { type: notifications_model.sequelize.QueryTypes.DELETE })
        .then(() => {
            return;
        }).catch(err => {
            console.log('error ' + err);
        });
}

module.exports = {
    createNotification
};