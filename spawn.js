const { execFile, spawn } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Create a single command string that executes all commands in one shell
const commands = "#!/bin/bash\n" + [
    "cd /var/www/html/chat_app_api",
    "ls",
    `git pull https://linthujan:${process.env.GITHUB_SECRET}@github.com/linthujan/chat_app_api`,
    "pm2 status",
].join("&&\n");

// Function to execute the command
const executeCommands = () => {

    console.log('Creating script file...');
    fs.writeFileSync('./script.sh', commands);

    console.log('Executing commands.....');
    // const process = execFile('./script.sh');

    // const process = spawn('bash', ['-c', commands]);
    const process = spawn('./script.sh');

    process.stdout.on('data', (data) => {
        console.log(`Output: ${data}`);
    });
    process.stdout.on('error', (data) => {
        console.log(`Output Error: ${data}`);
    });

    process.on('exit', (code) => {
        console.log(`Command exited with code: ${code}`);
        if (code === 0) {
            console.log('All commands executed successfully.');
        } else {
            console.error('Some commands failed.');
        }
    });
};

executeCommands();