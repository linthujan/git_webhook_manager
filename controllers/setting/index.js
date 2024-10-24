const { Setting } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const routeHandler = require("../../lib/routeHandler");

const getAll = routeHandler(async (req, res, extras) => {
    const settings = await Setting.findAll();

    return res.sendRes(settings, { message: 'Settings loaded successfully', status: STATUS_CODE.OK });
}, false);

const update = routeHandler(async (req, res, extras) => {
    const { name, value } = req.body;

    if (isNull([name])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST);
    }

    const [setting, x] = await Setting.upsert({
        name: name,
        value: value,
    }, { where: { name: name }, transaction: extras.transaction, });

    await extras.transaction.commit();
    await setting.reload();

    return res.sendRes(setting, { message: 'Setting updated successfully!', status: STATUS_CODE.OK });
});

module.exports = {
    getAll,
    update,
}