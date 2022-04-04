import * as anchor from '@project-serum/anchor';

// Mutable
export const CANDY_MACHINE_ID = "BkkBR96FdKPWSahwB335qGLY51v2fQn4yC1655iJRw4d";
export const RPC_HOST_URL = "https://dark-shy-waterfall.solana-mainnet.quiknode.pro/6513ec4172ac666ed25c1e3a169bf320a05fdd95/";
export const CONNECTION = new anchor.web3.Connection(RPC_HOST_URL);
export const PROGRAM_ID = new anchor.web3.PublicKey('2Y6UPSeRJa9UzYMNATgsQL3zFhYRue8ohxefzvtHnF9g');
export const POOL_ID = new anchor.web3.PublicKey('5c9wuMMseJsRoxdtPshyAheV1gD7Xw5TgDN444aXiygE');
export const AIRDROP_TOKEN_MINT = new anchor.web3.PublicKey('2S3hhwCnDkFN2zHYc7SBzhLuHUevMwmgUCzq3ShDsUb5');
export const KEYPAIR_PATH = "./program.json";

// Immutable
export const MAX_NAME_LENGTH = 32;
export const MAX_URI_LENGTH = 200;
export const MAX_SYMBOL_LENGTH = 10;
export const MAX_CREATOR_LEN = 32 + 1 + 1;
export const TOKEN_PUBKEY = new anchor.web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const MAX_CREATOR_LIMIT = 5;
export const MAX_DATA_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_SYMBOL_LENGTH + 4 + MAX_URI_LENGTH + 2 + 1 + 4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
export const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
export const CREATOR_ARRAY_START = 1 + 32 + 32 + 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH + 4 + MAX_SYMBOL_LENGTH + 2 + 1 + 4;
export const TOKEN_METADATA_PROGRAM = new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const CANDY_MACHINE_V2_PROGRAM = new anchor.web3.PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ');
export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');