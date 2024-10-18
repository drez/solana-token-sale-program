# Solana Token Sale Program

Swap SPL tokens for SOL at a fixed price

- Updated client to the latest @solana/web3.js.
- Updated program to the latest Cargo and spl-token-2022, with more verbosity.
- Added help and tutorial to this README.

## Development Environment Setup

- Install the latest stable Rust from [rustup.rs](https://rustup.rs/).
- Install Solana v1.6.1 or later from [Solana CLI Tools Installation Guide](https://docs.solana.com/cli/install-solana-cli-tools).
- Install the libudev development package for your distribution (`libudev-dev` on Debian-derived distros, `libudev-devel` on Redhat-derived).

### Build

To build a specific program, such as SPL Token, for the Solana BPF target:

```bash
$ cd program
$ cargo build-bpf
```

### Deploy

```bash
$ solana program deploy target/deploy/spl_tokensale_solana.so
```

* Note the resulting `Program Id:` and set `CUSTOM_PROGRAM_ID` in .env.

### Set Environment Variables

Before running RPC Client, change `.example-env` to `.env`. See below for details:
**See below for more info**

```
CUSTOM_PROGRAM_ID= <Program id generated after running `cargo build-bpf`>
SELLER_PUBLIC_KEY= <base58 format>
SELLER_PRIVATE_KEY= <base58 format>
BUYER_PUBLIC_KEY= <base58 format>
BUYER_PRIVATE_KEY= <base58 format>
TOKEN_PUBKEY= <base58 format>
TOKEN_DECIMAL= <from your token creation>
RPCURL=http://localhost:8899
API_URL=http://localhost:3000
TOKEN_SALE_PRICE= <token price, not in lamports>
TOKEN_MIN_BUY= <minimum amount of token allowed to sell>

# can be generated
SELLER_TOKEN_ACCOUNT_PUBKEY=
# will be generated
TEMP_TOKEN_ACCOUNT_PUBKEY=
TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY=
```

### Test/run

check package.json for more commands

```bash
$ cd client
$ npm install
$ npm run all
```

# Disclaimer

Use this contract at your own risk. This program was not audited.

- Reference https://github.com/swaroopmaddu/solana-token-sale-program
- Reference https://github.com/myungjunChae/solana_token_sale

# Setup the .env constants with Solana CLI and Phantom Wallet

Ressources: https://solana.com/docs/core/tokens, https://spl.solana.com/token, https://docs.solanalabs.com/cli/wallets/paper

Install Solana CLI tool suite

Ensure you have the private key of the owner secured.
If you need a new account:
```bash
$ solana new -o seller.json
```
Use it to set the Solana CLI environment:

```bash
$ solana config set -k <YOUR-OWNER-KEY-JSON-FILE> -u devnet
```

Confirm your are using the right wallet, and have funds

```bash
$ solana address
$ solana account <ACCOUNT-PUBKEY>
```

Airdrop funds if needed. The account will not actually exists on the network before it has funds:

```bash
$ solana airdrop 5 <YOUR-USER-PUB-KEY>
```

set `SELLER_PUBLIC_KEY` in .env

**I choose to put all variable in base58 in the .ENV for consitency. Unfortunatly, Solana CLI doesnt have format option for the output of the private key. I use Phantom wallet, by restoring and exporting the private key to get the base58 format.**

```bash
$ solana config get
$ cat <Keypair Path>
make sure your wallet is on the right network (main, dev, test)
create wallet in Phantom wallet via "Add/Connect Wallet" -> "Import Private Key"
export the base58 private key via "Settings" -> "Manage Sccounts" -> Choose accoout ->  "Show private key"
```

### Repeat the previous step if needed to get the buyer public and private key, ignore the `solana config set`.

Set `SELLER_PRIVATE_KEY` with the output of Phantom wallet (base58).

Create the token with `spl-token`. Note, it looks like most wallet assume that token with deciaml 0 are NFTs.
This is my setup:

```bash
$ spl-token create-token --decimals 2
```

* Note the resulting `Address` and set `TOKEN_PUBKEY` and `TOKEN_DECIMAL` in .env.

Create and save the sellers token account:

```bash
$ spl-token create-account <TOKEN_MINT_ADDRESS>
```

* Note the resulting `Creating account ` and set `SELLER_TOKEN_ACCOUNT_PUBKEY` in .env.

Upload the token image to a server and json metadata to a server of your choice. Use the samples in the root dir.
```bash
$ cargo install metaboss --locked
$ metaboss create metadata -a <TOKEN_PUBKEY> -m metadata.json
```
https://mafyuh.com/posts/spl-token-cli/

# Help

To be noted, when creating your token, most wallet will consider a token with 0 decimals as NFT and put them in a hidden area...

Wanna start fresh?

- Generate a new program_id: Delete program/target/deploy/spl_tokensale_solana-keypair.json, rebuild the program
- Create new PDA: Delete SELLER_TOKEN_ACCOUNT_PUBKEY, TEMP_TOKEN_ACCOUNT_PUBKEY, TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY from your env file. They will recreated.

Random observations to potentially save time.

**Getting "Error: Deploying program failed: RPC response error -32002: Transaction simulation failed: Error processing Instruction 0: account data too small for instruction [3 log messages]" after a second deploy.**

Extend the program account size, 20000 for testing is a good value, be efficient in production!:

```bash
$ solana program extend PROGRAM_ID <AMOUNT_OF_BYTES>
```

**Random RPC error ie. "RPC response error -32002: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1" OR unexpected error in web3js like "TokenAccountNotFoundError"**

- Check the balance on the authority account, the account used to deploy the program.
- Go get cofee and check again. Sometimes the RPC are misbehaving, sometimes the nodes takes a while to update...

**Random error in web3js functions like "TokenAccountNotFoundError"**

- Check the balance on the all accounts. Account needs funds to be initialized.
- Go get cofee and check again. Sometimes the RPC are misbehaving, sometimes the nodes takes a while to update...

**Force a program to have a new program ID**

delete target/deploy/spl_tokensale_solana-keypair.json

**failed: invalid account data for instruction**

Validate the accounts exists and that you are specifying the right `programId`, in this case `TOKEN_2022_PROGRAM_ID` ( `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` )

```bash
$ solana-keygen new -o target/deploy/spl_tokensale_solana-keypair.json
$ solana program deploy target/deploy/spl_tokensale_solana.so
```

* Note the `Program Id` and add it to `CUSTOM_PROGRAM_ID` in the client `.env`.

**Testnet and Devnet misbehaving**

I have experienced some instability on those networks. To remedy, I switch sometimes from private nodes to public nodes. The private nodes tends to be stabl"er" than the public ones.

- Using a local node

If you already installed Solana CLI tool suite, just run:

```bash
$ solana-test-validator
```

This is very stable and fast! Problem is no wallet that I know of permit to use local node... Please correct me, that would be great!

# TODO

- switch `UpdateTokenPrice` to `UpdateTokenSale` and add `min_buy` update
