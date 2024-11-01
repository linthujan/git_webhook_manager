const { exec } = require('child_process');

// Create a single command string that executes all commands in one shell
const commands = `
    cd /var/www/html/ && 
    pwd && 
    ls && 
    git pull origin main && 
    pwd && 
    pm2 restart all && 
    pm2 status
`;

// Function to execute the command
const executeCommands = () => {
    console.log('Executing commands...');

    const process = exec(commands, { cwd: '/var/www/html' });

    // Capture real-time output
    process.stdout.on('data', (data) => {
        console.log(`Output: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
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

// Execute the commands
executeCommands();

