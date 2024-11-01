const { Project } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const routeHandler = require("../../lib/routeHandler");
const crypto = require("node:crypto");
const { executeCommands } = require("../../services/script");
const { renderTextWithVariable } = require("../../lib/helper");

function verifySignature(req, secret) {
    const payload = JSON.stringify(req.body);
    const sigHeader = req.headers['x-hub-signature'];
    const hmac = crypto.createHmac('sha1', secret);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(digest));
}

const repositoryHook = routeHandler(async (req, res, extras) => {
    const { ref, repository } = req.body;

    const project = await Project.findOne({
        where: {
            repository_id: repository.id,
        }
    });
    if (!project) {
        return sendAppError(extras, 'Project not found', STATUS_CODE.NOT_FOUND);
    }

    // if (!verifySignature(req, project.secret)) {
    //     return sendAppError(extras, "Unauthorized", STATUS_CODE.UNAUTHORIZED)
    // }

    console.log(ref);

    const branch = ref.split('/').pop();
    console.log(`Pushed to branch ${branch}`);

    const commands = project.command.map(x => renderTextWithVariable(x, { PROCESS_NAME: project.name, }));

    console.log(commands);

    await executeCommands(commands);

    return res.sendRes(null, { message: 'Ok', status: STATUS_CODE.OK });
}, false);

module.exports = {
    repositoryHook,
}