const { Setting } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const routeHandler = require("../../lib/routeHandler");
const crypto = require("node:crypto");

function verifySignature(req) {
    const payload = JSON.stringify(req.body);
    const sigHeader = req.headers['x-hub-signature'];
    const hmac = crypto.createHmac('sha1', process.env.CHAT_API_SECRET);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(digest));
}

const repositoryHook = routeHandler(async (req, res, extras) => {
    if (!verifySignature(req)) {
        return sendAppError(extras, "Unauthorized", STATUS_CODE.UNAUTHORIZED)
    }

    const fs = require('fs');

    fs.writeFileSync('./request.json', JSON.stringify(req.body, null, 2));

    return res.sendRes(null, { message: 'Ok', status: STATUS_CODE.OK });
}, false);

module.exports = {
    repositoryHook,
}