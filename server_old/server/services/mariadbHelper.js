/*jshint esversion: 6 */
function verifyJSON(objects, corrections) {
    for (const object of objects) {
        for (const correction of corrections) {
            if (object[correction] && typeof(object[correction]) !== 'object') {
                try {
                    const parsedValue = JSON.parse(object[correction]);
                    object[correction] = parsedValue;
                } catch (e) {
                    continue;
                }
            } else {
                continue;
            }
        }
    }
    return objects;
}

module.exports = {
    verifyJSON
};