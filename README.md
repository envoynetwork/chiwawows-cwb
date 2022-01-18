# Token Airdrop

- Candy Machine Version

This platform can airdrop token to NFT holders regardless of candy machine version.
In short word it can work on both of V1 and V2.

- Airdrop Method

This platform support two methods of airdrop.

1. Transfer token from Pool to NFT holders
2. Mint token to NFT holders

# Smart Contract Build & Deploy

- Build smart contract(Solana Sealevel - program) by Cargo
- Deploy smart contract to Solana chain(BPF - Berkle Packet Filter) by Solana cli

Smart Contract source is placed on `/program`.

## Install dependancies

### Cargo

Cargo is Rust’s build system and package manager. It is same as `NPM` in Node.js project.
In Rust project, you can see `Cargo.toml`. It is same as package.json in Node.js project.

```
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

### Anchor

Anchor is a framework for Solana's Sealevel (opens new window)runtime providing several convenient developer tools.

```
$ npm i -g @project-serum/anchor-cli
```

### Solana

Install in [`here`](https://docs.solana.com/cli/install-solana-cli-tools).

## Build Smart Contract

In program folder, you can run following commands.

```
$ cargo clean
$ cargo build-bpf
```
Then you can see `so` file in `target` sub folder.

## Deploy Smart Contract to devnet

Please check `solana` cli is connected to devnet.
To do this,

```
$ solana config get
```

Check the url is switched `devnet`.

Some SOLs are needed and you'd better `airdrop` some SOLs.

After that run this command.

```
$ solana deploy contract.so
```

After success deployment, you can see the address(pubkey) of contract newly deployed.

Please copy this address for further setting.

Then, please generate IDL json file.

```
$ anchor idl parse -f ./src/lib.rs -o ./target/deploy/contract.json
```

It generates IDL json file int `target` sub folder.
IDL is same as ABI in Ethereum Solidity.(Interface Description Language)

Finally, you successfuly deploy your contract to `devnet`.

You can change network type(Solana cli url) to any one, then deploy smart contract to `main-net`, or `testnet`.

# Prepare environment

Copy the candy machine id and paste on `/backend/constants.ts: 4ln`.

Copy the token mint key and paste on `/backend/constants.ts: 9ln`.

Copy the RPC custom node url and paste on `/backend/constants.ts: 5ln`.
It will determin the chain - mainnet-beta, devnet or testnet.
Current one is my devnet quicknode url.
So it works on devnet.

Copy keypair path and paste on `/backend/constants.ts: 10ln`.
This keypair will cover all gas fees of platform (airdrop, create accounts and so on)

# Smart Contract Initialize

Please copy the deployed smart contract ID and paste on `/backend/constants.ts: 7ln`.

```
$ ts-node cli.ts init_pool -k <YOUR WALLET KEYPAIR PATH> -a <AIRDROP TOKEN AMOUNT (15 for now)>
```

Then it will show `Pool` id as a result.

Copy this id and paste on `/backend/constants.ts: 8ln`.

# Smart Contract Updating

```
$ ts-node cli.ts update_pool -k <YOUR WALLET KEYPAIR PATH> -a <AIRDROP TOKEN AMOUNT (15 for now)>
```

This command will update the Pool.
It is neccessary when we need to change `token` or `airdrop amount`.

# Smart Contract Status

```
$ ts-node cli.ts get_pool -k <YOUR WALLET KEYPAIR PATH>
```

This command will show the Pool's status.

You can get the airdrop account of Pool.

`Airdrop Amount`, `Airdrop Account` and other infromations.

If you prefer to use transfer method for airdrop, please fund on Pool's airdrop account with your token.

If you want to use mintTo method for airdrop, please check your `keypair` has mint authority.

# Determine the version of Candy Machine

- If version is V1

Uncomment `/backend/airdrop.ts: 216ln` and comment `/backend/airdrop.ts: 217ln`.

- If version is V2

Uncomment `/backend/airdrop.ts: 217ln` and comment `/backend/airdrop.ts: 216ln`.

# Determine airdrop method

- If transfer method

Change function in `/backend/airdrop.ts: 200ln` and `/backend/airdrop.ts: 212ln` to `transferToken`.

- If mintTo method

Change function in `/backend/airdrop.ts: 200ln` and `/backend/airdrop.ts: 212ln` to `mintToFunction`.

# Run backend cron-job

```
$ node app.js
```

It will trigger the `cron-job` which will airdrop everyday on `23:50`.

You can change the schedule time by updating `params` of `/backend.app.js: 4ln`.

If you want to make it as background service, run follwing command.

```
$ pm2 start app.js
```

You need to install pm2 `npm install -g pm2` in this case.


That's it.
Enjoy.