import {
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  ConfirmOptions,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Commitment,
  LAMPORTS_PER_SOL,
  SystemProgram,
  clusterApiUrl,
  SYSVAR_RENT_PUBKEY
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

const getTokenWallet = async (
  wallet: PublicKey,
  mint: PublicKey
    ) => {
  return (
    await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
}

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
    ) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

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

programCommand('vesting')
    .requiredOption(
      '-k, --keypair <path>',
      'Solana wallet location'
    )
    .requiredOption(
      '-i, --info <path>',
      'Vesting info location'
    )
    .action(async (directory, cmd) => {
      const {env, keypair, info} = cmd.opts()
      const conn = new Connection(clusterApiUrl(env))
      const owner = loadWalletKey(keypair)
      const infoJson = JSON.parse(fs.readFileSync(info).toString())
      const programId = new PublicKey(infoJson.program)
      const tokenMint = new PublicKey(infoJson.token)
      const destWallet = new PublicKey(infoJson.destWallet)
      const resp = await conn.getAccountInfo(tokenMint)
      const mintInfo = MintLayout.decode(Buffer.from(resp!.data))
      const decimals= Math.pow(10, mintInfo.decimals)
      // let schedule : tokenVesting.Schedule[] = []
      let schedule : any[] = [];
      (infoJson.schedule as any[]).map(item=>{
        let amount = Number(item.amount) * decimals
        let time = (new Date(item.time)).getTime()/1000
        schedule.push(new tokenVesting.Schedule(new tokenVesting.Numberu64(time), new tokenVesting.Numberu64(amount)))
      })
      const seedWord = Buffer.concat([Buffer.from(infoJson.seed),Buffer.alloc(31)],31)
      let instruction : TransactionInstruction[] = [];
      const destTokenAccount = await getTokenWallet(destWallet, tokenMint)
      if((await conn.getAccountInfo(new PublicKey(destTokenAccount))) == null){
        instruction.push(createAssociatedTokenAccountInstruction(
          new PublicKey(destTokenAccount), owner.publicKey,  new PublicKey(destWallet), new PublicKey(tokenMint) 
        ))
      }
      instruction = instruction.concat(await tokenVesting.create(
        conn, programId, seedWord, owner.publicKey, owner.publicKey, null, 
        new PublicKey(destTokenAccount), new PublicKey(tokenMint), schedule!
      ))
      let transaction = new Transaction()
      instruction.map(item => transaction.add(item))
      let hash = await sendAndConfirmTransaction(conn, transaction, [owner], confirmOption)
      console.log(hash)
      console.log("")
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