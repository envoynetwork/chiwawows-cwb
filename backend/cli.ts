import { program } from 'commander';
import * as anchor from '@project-serum/anchor';
import { Keypair, Transaction } from '@solana/web3.js';
import log from 'loglevel';
import { AIRDROP_TOKEN_MINT, CONNECTION, POOL_ID, PROGRAM_ID } from './constants';
import { createAssociatedTokenAccountInstruction, getTokenWallet, loadAnchorProgram, loadWalletKey, sendTransaction } from './util';

program.version('0.0.1');

log.setLevel(log.levels.INFO);

program.
  command('init_pool')
  .option(
    '-k, --keypair <path>',
    `Solana wallet location`,
    '--keypair not provided',
  )
  .option(
    '-a, --amount <path>',
    `Token airdrop amount`,
    '--amount not provided',
  )
  .action(async (directory, cmd) => {
    const { keypair, amount } = cmd.opts();

    const walletKeyPair = loadWalletKey(keypair);
    const anchorProgram = await loadAnchorProgram(walletKeyPair);

    let randomPubkey = Keypair.generate().publicKey;
    let [pool, bump] = await anchor.web3.PublicKey.findProgramAddress([randomPubkey.toBuffer()], PROGRAM_ID);
    let airdropAccount = await getTokenWallet(pool, AIRDROP_TOKEN_MINT);
    let transaction = new Transaction();
    let signers : Keypair[] = [];

    transaction.add(createAssociatedTokenAccountInstruction(airdropAccount, walletKeyPair.publicKey, pool, AIRDROP_TOKEN_MINT));
    transaction.add(
        await anchorProgram.instruction.initPool(
            new anchor.BN(bump),
            new anchor.BN(amount),
            {
                accounts:{
                    owner : walletKeyPair.publicKey,
                    pool : pool,
                    rand : randomPubkey,
                    airdropMint : AIRDROP_TOKEN_MINT,
                    airdropAccount : airdropAccount,
                    systemProgram : anchor.web3.SystemProgram.programId,
                }
            }
        )
    );
    await sendTransaction(new anchor.Wallet(walletKeyPair), transaction, signers);

    console.log(`Pool is initialized: ${pool.toBase58()}`);
});

program.
  command('update_pool')
  .option(
    '-k, --keypair <path>',
    `Solana wallet location`,
    '--keypair not provided',
  )
  .option(
    '-a, --amount <path>',
    `Token airdrop amount`,
    '--amount not provided',
  )
  .action(async (directory, cmd) => {
    const { keypair, amount } = cmd.opts();

    const walletKeyPair = loadWalletKey(keypair);
    const anchorProgram = await loadAnchorProgram(walletKeyPair);

    let airdropAccount = await getTokenWallet(POOL_ID, AIRDROP_TOKEN_MINT);
    let transaction = new Transaction();
    let signers : Keypair[] = [];

    if((await CONNECTION.getAccountInfo(airdropAccount)) == null)
        transaction.add(createAssociatedTokenAccountInstruction(airdropAccount, walletKeyPair.publicKey, POOL_ID, AIRDROP_TOKEN_MINT));
    transaction.add(
        await anchorProgram.instruction.updatePool(
            new anchor.BN(amount),
            {
                accounts:{
                    owner : walletKeyPair.publicKey,
                    pool : POOL_ID,
                    airdropMint : AIRDROP_TOKEN_MINT,
                    airdropAccount : airdropAccount,
                    systemProgram : anchor.web3.SystemProgram.programId,
                }
            }
        )                               
    );
    await sendTransaction(new anchor.Wallet(walletKeyPair), transaction, signers);
    
    console.log(`Pool is updated: ${POOL_ID.toBase58()}`);
});

program.parse(process.argv);
