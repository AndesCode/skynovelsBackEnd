function verifyJSON(object) {
    if (typeof(object) !== 'object') {
        try {
            parsedObeject = JSON.parse(object);
            return parsedObeject;
        } catch (e) {
            return object;
        }
    } else {
        return object;
    }
}

module.exports = {
    verifyJSON
};