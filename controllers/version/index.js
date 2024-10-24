const { Setting } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const routeHandler = require("../../lib/routeHandler");

const getVersion = routeHandler(async (req, res, extras) => {
    const version = await Setting.findOne({ where: { name: 'app_version' }, });

    if (!version) {
        return sendAppError(extras, 'Version setting not found', STATUS_CODE.NOT_FOUND);
    }

    return res.sendRes(version.value, { message: 'Version loaded successfully', status: STATUS_CODE.OK });
}, false);

const updateVersion = routeHandler(async (req, res, extras) => {
    const { version_no, application_id, updated_at } = req.body;

    if (isNull([version_no, application_id, updated_at])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const [version, x] = await Setting.upsert({
        name: 'app_version',
        value: {
            version_no,
            application_id,
            updated_at,
        },
    }, { where: { name: 'app_version' }, transaction: extras.transaction, })
    await extras.transaction.commit();

    return res.sendRes(version.value, { message: 'Version updated successfully!', status: STATUS_CODE.OK });
});

module.exports = {
    getVersion,
    updateVersion,
}