function verifyJSON(object) {
    if (typeof(object) !== 'object') {
        console.log('parseando');
        parsedObeject = JSON.parse(object);
        return parsedObeject;
    } else {
        console.log('no parsea');
        return object;
    }
}

module.exports = {
    verifyJSON
};