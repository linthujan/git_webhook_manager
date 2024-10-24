module.exports.isNull = (parameters = []) => {
    if (parameters.length == 0) {
        return true;
    }

    const notValids = parameters.filter((parameter) => {
        if (parameter == null || parameter == undefined || (typeof parameter == 'string' &&
            (parameter == "" || parameter.trim() == "" ||
                parameter == "undefined" ||
                parameter == "null")
        )) {
            return true;
        }
        else {
            return false;
        }
    });
    return notValids.length != 0;
}