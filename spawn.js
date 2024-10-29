const { spawn } = require('child_process');

// Run a command and stream output
// const process = spawn('ping', ['google.com']);

// process.stdout.on('data', (data) => {
//     console.log(`Output: ${data}`);
// });

// process.stderr.on('data', (data) => {
//     console.error(`Error: ${data}`);
// });

// process.on('close', (code) => {
//     console.log(`Process exited with code: ${code}`);
// });

const { exec } = require('child_process');

const commands = [
    `cd /var/www/html`,
    `pwd`,
];

exec(commands.join(' && '), [], (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});


// function runCommand(index = 0) {
//     if (index >= commands.length) return; // Stop if all commands have run

//     const command = commands[index];
//     // Using 'cmd.exe' for Windows or 'bash' for Linux/Mac
//     const shell = process.platform === "win32" ? "cmd.exe" : "bash";
//     const shellArgs = process.platform === "win32" ? ["/c", command] : ["-c", command];

//     const processX = spawn(shell, shellArgs, { shell: true });

//     processX.stdout.on("data", (data) => {
//         console.log(`stdout (command ${index + 1}): ${data}`);
//     });

//     processX.stderr.on("data", (data) => {
//         console.error(`stderr (command ${index + 1}): ${data}`);
//     });

//     processX.on("close", (code) => {
//         if (code === 0) {
//             console.log(`Command ${index + 1} completed successfully.`);
//             runCommand(index + 1); // Run the next command
//         } else {
//             console.error(`Command ${index + 1} failed with code ${code}`);
//         }
//     });
// }

// Start the sequence
// runCommand();