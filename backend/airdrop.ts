import { Keypair, Transaction } from '@solana/web3.js';
import { programs } from '@metaplex/js';
import * as anchor from '@project-serum/anchor';
const { metadata: { Metadata, MetadataProgram } } = programs;
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from 'bs58';
import { 
  AIRDROP_TOKEN_MINT, 
  CANDY_MACHINE_ID, 
  CANDY_MACHINE_V2_PROGRAM, 
  CONNECTION, 
  CREATOR_ARRAY_START, 
  KEYPAIR_PATH, 
  MAX_CREATOR_LEN, 
  MAX_METADATA_LEN, 
  MAX_NAME_LENGTH, 
  MAX_SYMBOL_LENGTH, 
  MAX_URI_LENGTH, 
  POOL_ID, 
  TOKEN_METADATA_PROGRAM, 
  TOKEN_PUBKEY 
} from './constants';
import { 
  createAssociatedTokenAccountInstruction, 
  getTokenWallet, 
  loadAnchorProgram, 
  loadWalletKey, 
  sendTransaction 
} from './util';

async function fetchHashTableV1(hash: string) {
  const mintHashes: any = [];
  try {
    const metadataAccounts = await MetadataProgram.getProgramAccounts(
      CONNECTION,
      {
        filters: [
          {
            memcmp: {
              offset:
                1 +
                32 +
                32 +
                4 +
                MAX_NAME_LENGTH +
                4 +
                MAX_URI_LENGTH +
                4 +
                MAX_SYMBOL_LENGTH +
                2 +
                1 +
                4 +
                0 * MAX_CREATOR_LEN,
              bytes: hash,
            },
          },
        ],
      },
    );
    
    for (let index = 0; index < metadataAccounts.length; index++) {
      const account = metadataAccounts[index];
      const accountInfo: any = await CONNECTION.getParsedAccountInfo(account.pubkey);
      const metadata = new Metadata(hash.toString(), accountInfo.value);
      mintHashes.push(metadata.data.mint);
    }
  } catch (e) {}
  return mintHashes;
}

async function fetchHashTableV2(firstCreatorAddress: anchor.web3.PublicKey) {
  const metadataAccounts = await CONNECTION.getProgramAccounts(
      TOKEN_METADATA_PROGRAM,
      {
        // The mint address is located at byte 33 and lasts for 32 bytes.
        dataSlice: { offset: 33, length: 32 },

        filters: [
          // Only get Metadata accounts.
          { dataSize: MAX_METADATA_LEN },

          // Filter using the first creator.
          {
            memcmp: {
              offset: CREATOR_ARRAY_START,
              bytes: firstCreatorAddress.toBase58(),
            },
          },
        ],
      },
  );

  return metadataAccounts.map((metadataAccountInfo) => (
      bs58.encode(metadataAccountInfo.account.data)
  ));
};

async function getCandyMachineV2Creator(candyMachine: string) {
  let candyMachinePubkey = new anchor.web3.PublicKey(candyMachine);
  return anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from('candy_machine'), candyMachinePubkey.toBuffer()],
    CANDY_MACHINE_V2_PROGRAM,
  );
}

async function getNFTOwner(hash: string) {
  let res: string = "";
  try {
    let filter = {
      memcmp: {
        offset: 0,
        bytes: hash,
      },
    };
    let filter2 = {
      dataSize: 165,
    };
    let getFilter = [filter, filter2];
    let programAccountsConfig = { filters: getFilter, encoding: "jsonParsed" };
    let _listOfTokens = await CONNECTION.getParsedProgramAccounts(
      TOKEN_PUBKEY,
      programAccountsConfig
    );

    for (let token of _listOfTokens) {
      const accountData: any = token.account.data;
      if (accountData && accountData.parsed.info.tokenAmount.amount == 1) {
        res = accountData.parsed.info.owner;
      }
    }
  } catch (e) {}

  return res;
};

async function transferToken(holder: anchor.web3.PublicKey) {
  const walletKeyPair = loadWalletKey(KEYPAIR_PATH);
  const anchorProgram = await loadAnchorProgram(walletKeyPair);

  let sourceAccount = await getTokenWallet(POOL_ID, AIRDROP_TOKEN_MINT);
  let destAccount = await getTokenWallet(holder, AIRDROP_TOKEN_MINT);

  let transaction = new Transaction();
  let signers : Keypair[] = [];

  if((await CONNECTION.getAccountInfo(destAccount)) == null)
    transaction.add(createAssociatedTokenAccountInstruction(destAccount, walletKeyPair.publicKey, holder, AIRDROP_TOKEN_MINT))  ;

  transaction.add(
      await anchorProgram.instruction.airdropTransfer(
          {
              accounts:{
                  owner : walletKeyPair.publicKey,
                  pool : POOL_ID,
                  sourceAirdropAccount : sourceAccount,
                  destAirdropAccount : destAccount,
                  tokenProgram : TOKEN_PROGRAM_ID,
              }
          }
      )                               
  );
  await sendTransaction(new anchor.Wallet(walletKeyPair), transaction, signers);
}

async function mintToToken(holder: anchor.web3.PublicKey) {
  const walletKeyPair = loadWalletKey(KEYPAIR_PATH);
  const anchorProgram = await loadAnchorProgram(walletKeyPair);

  let destAccount = await getTokenWallet(holder, AIRDROP_TOKEN_MINT);

  let transaction = new Transaction();
  let signers : Keypair[] = [];

  if((await CONNECTION.getAccountInfo(destAccount)) == null)
    transaction.add(createAssociatedTokenAccountInstruction(destAccount, walletKeyPair.publicKey, holder, AIRDROP_TOKEN_MINT))  ;

  transaction.add(
      await anchorProgram.instruction.airdropMintTo(
          {
              accounts:{
                  owner : walletKeyPair.publicKey,
                  pool : POOL_ID,
                  airdrop_mint : AIRDROP_TOKEN_MINT,
                  destAirdropAccount : holder,
                  mintAuthority: walletKeyPair.publicKey,
                  tokenProgram : TOKEN_PROGRAM_ID,
              }
          }
      )                               
  );
  await sendTransaction(new anchor.Wallet(walletKeyPair), transaction, signers);
}

async function airdropTransferV1() {
  const mintHashes = await fetchHashTableV1(CANDY_MACHINE_ID);

  for (let i = 0; i <= mintHashes.length; i++) {
    const holder = await getNFTOwner(mintHashes[i]);
    if (!holder || holder === '') continue;
    await transferToken(new anchor.web3.PublicKey(holder));
  }
};

async function airdropTransferV2() {
  const candyMachineCreator = await getCandyMachineV2Creator(CANDY_MACHINE_ID);
  const mintHashes = await fetchHashTableV2(candyMachineCreator[0]);

  for (let i = 0; i <= mintHashes.length; i++) {
    const holder = await getNFTOwner(mintHashes[i]);
    if (!holder || holder === '') continue;
    console.log(holder);
    await transferToken(new anchor.web3.PublicKey(holder));
  }
};

// airdropTransferV1();
airdropTransferV2();