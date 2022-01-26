import {
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionSignature,
  ConfirmOptions,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Commitment,
  LAMPORTS_PER_SOL,
  SystemProgram,
  clusterApiUrl
} from "@solana/web3.js"
import * as bs58 from 'bs58'
import fs from 'fs'
import {AccountLayout,MintLayout,TOKEN_PROGRAM_ID,Token,ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token";
import { program } from 'commander';
import log from 'loglevel';
import * as tokenVesting from './bonfida'

program.version('0.0.1');
log.setLevel('info');


const confirmOption : ConfirmOptions = {
    commitment : 'finalized',
    preflightCommitment : 'finalized',
    skipPreflight : false
}

const sleep = (ms : number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

function loadWalletKey(keypair : any): Keypair {
  if (!keypair || keypair == '') {
    throw new Error('Keypair is required!');
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
  );
  log.info(`wallet public key: ${loaded.publicKey}`);
  return loaded;
}

function getVestingAmount(schedule : any[]){
  let total = 0
  let vestingAmount = 0
  let current = (new Date()).getTime()/1000
  schedule.map((item)=>{
    total += item.amount
    if(item.releaseTime < current)
      vestingAmount += item.amount
  })
  return {total : total, vestingAmount : vestingAmount}
}

programCommand('vesting_bot')
    .requiredOption(
      '-k, --keypair <path>',
      'Solana wallet location'
    )
    .option(
      '-s, --seed <string>',
      'Bonfida vesting seed'
    )
    .option(
      '-p, --program-address <string>',
      'Bonfida vesting program address',
      '3rM22SbWBQJ4cb6ru2kSuZkZPvZ4yg4yu6Bv6HQy7vLe'
    )
    .action(async (directory, cmd) => {
      const {env, keypair, seed, programAddress} = cmd.opts()
      const conn = new Connection(clusterApiUrl(env))
      const owner = loadWalletKey(keypair)
      const seedWord = Buffer.concat([Buffer.from(seed),Buffer.alloc(31)],31)
      const programId = new PublicKey(programAddress)
      const [vestingAccountKey , bump] = await PublicKey.findProgramAddress([seedWord],programId)
      let end = true;
      let vestingInfo = await tokenVesting.getContractInfo(conn,vestingAccountKey)
      if(vestingInfo == null){
        console.error("Something went wrong!. Please try again.")
        return;
      }
      const resp = await conn.getAccountInfo(new PublicKey(vestingInfo.mintAddress))
      const decimals = MintLayout.decode(Buffer.from(resp!.data)).decimals
      console.log("       Vesting Information")
      console.log("Vesting Account         :    " + vestingAccountKey.toBase58())
      console.log("Vesting Destination     :    " + vestingInfo.destinationAddress.toBase58())
      console.log("Vesting Token Mint      :    " + vestingInfo.mintAddress.toBase58())
      console.log("")
      console.log("   *Vesting Schedule*")
      console.log("No          When           Amount")
      vestingInfo.schedules.map((item,idx) =>{
        console.log((idx+1) + "      " +  (new Date(item.releaseTime.toNumber()*1000)).toDateString() +  "     " + (item.amount.toNumber() / Math.pow(10,decimals)))
      })

      while(true){
        vestingInfo = await tokenVesting.getContractInfo(conn,vestingAccountKey)
        let schedule : any[] = []
        vestingInfo.schedules.map((item) =>{
          schedule.push({amount : item.amount.toNumber(), releaseTime : item.releaseTime.toNumber()})
        })
        let res = getVestingAmount(schedule)
        if(res.total == 0){
          console.log("Vesting End.")
          return
        }
        if(res.vestingAmount > 0){
          try{
            let instruction = await tokenVesting.unlock(conn,programId, seedWord)
            let transaction = new Transaction()
            instruction.map(item => transaction.add(item))
            let hash = await sendAndConfirmTransaction(conn, transaction, [owner], confirmOption)
            console.log("Vesting Success  :  " + (new Date()).toString() + "    :   "+hash)
          } catch(e) {
            console.log(e)
          }
        }else{
          await sleep(24 * 3600 * 1000)
        }
      }
    })


function programCommand(name: string) {
  return program
    .command(name)
    .option(
      '-e, --env <string>',
      'Solana cluster env name',
      'devnet',
    )
    .option('-l, --log-level <string>', 'log level', setLogLevel);
}

function setLogLevel(value : any, prev : any) {
  if (value === undefined || value === null) {
    return;
  }
  console.log('setting the log value to: ' + value);
  log.setLevel(value);
}

program.parse(process.argv)