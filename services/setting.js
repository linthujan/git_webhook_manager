const { Setting } = require("../models");

const getSetting = async (name) => {
    const setting = await Setting.findOne({ where: { name, } })
        .catch(console.log);
    if (!setting) {
        throw new Error(`Setting not found! '${name}'`);
    }
    return setting.value;
};

const setSetting = async (name, value, extras) => {
    const [setting, x] = await Setting.upsert({
        name: name,
        value: value,
    }, { where: { name: name }, transaction: extras.transaction, })

    await extras.transaction.commit();
};


module.exports = {
    getSetting,
    setSetting,
};