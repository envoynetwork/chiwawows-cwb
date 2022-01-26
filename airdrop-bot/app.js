const cron = require('node-cron');
const shell = require('shelljs');

cron.schedule('50 23 * * *', async function() {
    console.log(`--------------- ${new Date().toLocaleString()} -----------------`);
    console.log('Starting Airdrop');
    
    if (shell.exec(`ts-node ${__dirname}/airdrop.ts`).code !== 0) {
        shell.exit(1);
    }
    else {
        shell.echo('Finished Airdrop');
    }
});