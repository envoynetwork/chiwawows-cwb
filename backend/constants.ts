import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

// Mutable
export const CANDY_MACHINE_ID = "EZnaTuo58c1rP2fYKfSBFi3m6PwuW4bw8X7kRtyuEnov";
export const RPC_HOST_URL = "https://sparkling-dry-thunder.solana-devnet.quiknode.pro/08975c8cb3c5209785a819fc9a3b2b537d3ba604/";
export const CONNECTION = new anchor.web3.Connection(RPC_HOST_URL);
export const PROGRAM_ID = new PublicKey('7WJ2dcuz6iRSmsBcgG8HM5tHMtCddHhVXn9qxAew7tU9');
export const POOL_ID = new PublicKey('79RysV2dCP1FXj643RtnTGMhfCDTrtLyLB1xTSS7WvRD');
export const AIRDROP_TOKEN_MINT = new PublicKey('53W1csx5gsyjTL5VAM2jNaP5oDS3qbgLwikBeEDEVHZj');
export const KEYPAIR_PATH = "";

// Immutable
export const MAX_NAME_LENGTH = 32;
export const MAX_URI_LENGTH = 200;
export const MAX_SYMBOL_LENGTH = 10;
export const MAX_CREATOR_LEN = 32 + 1 + 1;
export const TOKEN_PUBKEY = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const MAX_CREATOR_LIMIT = 5;
export const MAX_DATA_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_SYMBOL_LENGTH + 4 + MAX_URI_LENGTH + 2 + 1 + 4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
export const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
export const CREATOR_ARRAY_START = 1 + 32 + 32 + 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH + 4 + MAX_SYMBOL_LENGTH + 2 + 1 + 4;
export const TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const CANDY_MACHINE_V2_PROGRAM = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ');