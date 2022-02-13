var child_process = require('child_process');

const bot_path = 'E:\\Solana\\work\\chiwawows-cwb\\vesting-bot\\src\\index.ts';
const keypair_path = 'E:\\program.json';
const bonfida_id = 'CChTq6PthWU82YZkbveA3WDf7s97BWhBK4Vx9bmsT743';
const seeds = ['private', 'project', 'team', 'incentives'];

for (let seed of seeds) {
    child_process.exec(`ts-node ${bot_path} vesting_bot -k ${keypair_path} -s ${seed} -p ${bonfida_id}`, function (error, stdout, stderr) {
        if (error !== null) {
            console.log(`${seed} error --------- \n ${error}`);
        }
    });
}