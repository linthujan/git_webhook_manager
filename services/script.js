const { spawn } = require('child_process');

const executeCommands = async (commands) => {
    console.log('Executing commands.....');

    if (!commands?.length) {
        throw new Error("No commands passed")
    }

    const script = "#!/bin/bash\n" + commands.join("&&\n");

    return new Promise((resolve, reject) => {
        const process = spawn('bash', ['-c', script]);
        process.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
        process.stdout.on('error', (data) => {
            console.warn(`${data}`);
        });
        process.stderr.on('data', (data) => {
            console.error(`${data}`);
            reject();
        });

        process.on('exit', (code) => {
            console.log(`Command exited with code: ${code}`);
            if (code === 0) {
                console.log('All commands executed successfully.');
                resolve();
            } else {
                reject(new Error('Script execution failed'));
            }
        });
    })
};

module.exports = {
    executeCommands,
}