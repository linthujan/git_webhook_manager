const { Setting } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const routeHandler = require("../../lib/routeHandler");
const { verifySignature } = require("../../services/webhook");

function sign(data) {
    return `sha1=${crypto.createHmac('sha1', options.secret).update(data).digest('hex')}`
}

function verify(signature, data) {
    const sig = Buffer.from(signature)
    const signed = Buffer.from(sign(data))
    if (sig.length !== signed.length) {
        return false
    }
    return crypto.timingSafeEqual(sig, signed)
}

const repositoryHook = routeHandler(async (req, res, extras) => {
    console.log(req.headers);

    const sig = req.headers['x-hub-signature']

    console.log(req.body);

    if (!await verifySignature(process.env.CHAT_API_SECRET, signature, req.body)) {
        return sendAppError(extras, "Unauthorized", STATUS_CODE.UNAUTHORIZED)
    }

    return res.sendRes(version.value, { message: 'Ok', status: STATUS_CODE.OK });
}, false);

module.exports = {
    repositoryHook,
}