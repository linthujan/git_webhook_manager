const { Setting, Project } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const routeHandler = require("../../lib/routeHandler");
const crypto = require("node:crypto");
const { exec } = require("node:child_process");

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

    if (!verifySignature(req, project.secret)) {
        return sendAppError(extras, "Unauthorized", STATUS_CODE.UNAUTHORIZED)
    }

    console.log(ref);

    const branch = ref.split('/').pop();

    console.log(`Pushed to branch ${branch}`);
    const commands = [
        `cd F:/PlayGround/chat_app_api`,
        `git pull origin main`,
        `pm2 restart all`,
        `pm2 status`,
    ];

    const process = spawn(commands.join(" "));
    process.stdout.on('data', (data) => {
        console.log(`Output: ${data}`);
    });
    process.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });
    process.on('close', (code) => {
        console.log(`Process exited with code: ${code}`);
    });


    // exec(commands.join(' '), [], (error, stdout, stderr) => {
    //     if (error) {
    //         console.log(`error: ${error.message}`);
    //         return;
    //     }
    //     if (stderr) {
    //         console.log(`stderr: ${stderr}`);
    //         return;
    //     }

    //     console.log(`stdout: ${stdout}`);
    // });

    // for (let index = 0; index < commands.length; index++) {
    //     const command = commands[index];
    //     console.log(index, command);
    // }

    return res.sendRes(null, { message: 'Ok', status: STATUS_CODE.OK });
}, false);

module.exports = {
    repositoryHook,
}