/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
import bs58 = require("bs58");

dotenv.config();

process.env.NODE_ENV = "development";

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {  Mint, TOKEN_2022_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createMint, getMint, getAccount, mintTo, ExtensionType } from "@solana/spl-token";
import { updateEnv } from "./utils";

const setup = async () => {  
  
  console.log("1. Setup Accounts");

  const connection = new Connection(process.env.RPCURL!,  "confirmed" );
  
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const secretKey = bs58.decode(process.env.SELLER_PRIVATE_KEY!);
  const sellerPrivateKey = Uint8Array.from(Buffer.from(secretKey));
  const sellerKeypair = new Keypair({
    publicKey: sellerPubkey.toBytes(),
    secretKey: sellerPrivateKey,
  });

  const authPubkey = new PublicKey(process.env.AUTH_PUBLIC_KEY!);
  const secretKeyAuth = bs58.decode(process.env.AUTH_PRIVATE_KEY!);
  const authPrivateKey = Uint8Array.from(Buffer.from(secretKeyAuth));
  const authKeypair = new Keypair({
    publicKey: authPubkey.toBytes(),
    secretKey: authPrivateKey,
  });
  
  const buyerPubkey = new PublicKey(process.env.BUYER_PUBLIC_KEY!);
  const tokenPubKey = process.env.TOKEN_PUBKEY;

  console.log("2. Get/Set mint");
  let mintPub:PublicKey;
  let mint:Mint;

  if (tokenPubKey === undefined) {
    console.log("Create Token Mint Account...\n");
    mintPub = await createMint(connection, sellerKeypair, sellerKeypair.publicKey, null, 9, undefined, undefined, TOKEN_2022_PROGRAM_ID);
  } else {
    mint = await getMint(connection, new PublicKey(tokenPubKey), "confirmed", TOKEN_2022_PROGRAM_ID);
    mintPub = mint.address;
  }

  console.log("Get/Create Seller Token Account ( "+mintPub+" )... \n");
  const sellerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, sellerKeypair, mintPub, sellerKeypair.publicKey, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID);

  console.log("Mint 5000 Tokens to seller token account... ( " + sellerTokenAccount.address + " )\n");
  await mintTo(connection, sellerKeypair, mintPub, sellerTokenAccount.address, authKeypair, 500000, undefined, undefined, TOKEN_2022_PROGRAM_ID);

  console.log("Minted, validating ...");
  const sellerTokenBal = await getAccount(connection, sellerTokenAccount.address, "confirmed", TOKEN_2022_PROGRAM_ID);
  const sellerTokenBalance: any = sellerTokenBal.amount.toString();

  console.log(sellerTokenBalance);
  
  console.log("Requesting SOL for buyer...");
  //await connection.requestAirdrop(buyerPubkey, LAMPORTS_PER_SOL * 2);

  const sellerSOLBalance = await connection.getBalance(sellerPubkey, "confirmed");
  const buyerSOLBalance = await connection.getBalance(buyerPubkey, "confirmed");

  console.table([
    {
      sellerSOLBalance: sellerSOLBalance / LAMPORTS_PER_SOL,
      buyerSOLBalance: buyerSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.table([
    {
     // tokenPubkey: token.publicKey.toString(),
      sellerTokenAccountPubkey: sellerTokenAccount.address.toString(),
      sellerTokenBalance: sellerTokenBalance,
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);

  process.env.SELLER_TOKEN_ACCOUNT_PUBKEY = sellerTokenAccount.address.toString();
  //process.env.TOKEN_PUBKEY = token.publicKey.toString();
  updateEnv();
};

setup();
