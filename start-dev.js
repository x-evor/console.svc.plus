const { exec } = require("child_process");
const process = exec("npx next dev --turbo -p 3000");

process.stdout.on("data", (data) => console.log(data));
process.stderr.on("data", (data) => console.error(data));
