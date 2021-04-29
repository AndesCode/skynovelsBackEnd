/*jshint esversion: 6 */
const notifications_model = require('../models').notifications;
const socketsService = require('./socketService');

function createNotification(notificationToUserId, objectId, objectName) {
    notifications_model.create({
        user_id: notificationToUserId,
        [objectName]: objectId
    }).then((notification) => {
        socketsService.notifyUser(notification.user_id);
    }).catch(err => {
        const message = 'Ocurrio un error al cargar el objeto';
        console.log('error ' + err);
        return message;
    });
}

module.exports = {
    createNotification
};