const renderTextWithVariable = (text, data) => {
    return Object.keys(data).reduce((prev, key) => {
        return `${prev}`.replace(`%%${key}%%`, data[key]);
    }, text);
}

module.exports = {
    renderTextWithVariable,
}