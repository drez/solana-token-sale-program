/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
import bs58 = require("bs58");

dotenv.config();

process.env.NODE_ENV = "development";

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {  Mint, TOKEN_2022_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createMint, getMint, getAccount, mintTo, ExtensionType, Account } from "@solana/spl-token";
import { updateEnv } from "./utils";

const setup = async () => {
  console.log("1. Setup Accounts");

  const connection:Connection = new Connection(process.env.RPCURL!, "confirmed");
  console.log(" - payer: "+ process.env.SELLER_PRIVATE_KEY);
  const payerPubkey:PublicKey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const secretKey:Uint8Array = bs58.decode(process.env.SELLER_PRIVATE_KEY!);
  const tokenDecimal:number = parseInt(process.env.TOKEN_DECIMAL!);
  
  const payerPrivateKey:Uint8Array = Uint8Array.from(Buffer.from(secretKey));
  const payerKeypair = new Keypair({
    publicKey: payerPubkey.toBytes(),
    secretKey: payerPrivateKey,
  });

  console.log(" - auth");
  const authPubkey:PublicKey = payerPubkey;
  //const secretKey2 = bs58.decode(process.env.AUTH_PRIVATE_KEY!);
  //const authPrivateKey = Uint8Array.from(Buffer.from(secretKey2));
  const authKeypair:Keypair = payerKeypair
  const buyerPubkey:PublicKey = new PublicKey(process.env.BUYER_PUBLIC_KEY!);
  const tokenPubKey: PublicKey = new PublicKey(process.env.TOKEN_PUBKEY!);
  
  let mintPub:PublicKey;
  let mint:Mint;
  let tokenAccount;

  console.log("2. Get/Set mint: "+ tokenPubKey);

  if (tokenPubKey === undefined) {
    console.log("Create Token Mint Account...\n");
    mintPub = await createMint(connection, payerKeypair, payerKeypair.publicKey, null, 9, undefined, undefined, TOKEN_2022_PROGRAM_ID);
  } else {
    mint = await getMint(connection, tokenPubKey , "confirmed", TOKEN_2022_PROGRAM_ID);
    mintPub = mint.address;
    console.log(mint);
  }
  
  console.log("Create or get Seller Token Account...\n");

  const sellerTokenAccount:Account = await getOrCreateAssociatedTokenAccount(connection, payerKeypair, mintPub, payerKeypair.publicKey, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID);

  console.log(sellerTokenAccount.address.toBase58());

  if (sellerTokenAccount.amount <= 100000) {
    console.log("Mint 5000 Tokens to seller token account... ( " + sellerTokenAccount.address + " )\n");
    await mintTo(connection, payerKeypair, mintPub, sellerTokenAccount.address, authKeypair, 5000*(tokenDecimal*10), undefined, undefined, TOKEN_2022_PROGRAM_ID);
  } else { 
    console.log("Skip mint balance is "+sellerTokenAccount.amount);
  }
  console.log("Mint ok");

  const sellerTokenBalance = await getAccount(connection, sellerTokenAccount.address, "confirmed", TOKEN_2022_PROGRAM_ID);
  const amount: any = sellerTokenBalance.amount.toString();

  console.log(sellerTokenAccount.address);
  console.log(amount);

  console.log("Requesting SOL for buyer...");
  //await connection.requestAirdrop(buyerPubkey, LAMPORTS_PER_SOL * 2);

  const sellerSOLBalance:number = await connection.getBalance(payerKeypair.publicKey, "confirmed");
  const buyerSOLBalance:number = await connection.getBalance(buyerPubkey, "confirmed");

  console.table([
    {
      sellerSOLBalance: sellerSOLBalance / LAMPORTS_PER_SOL,
      buyerSOLBalance: buyerSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.table([
    {
      tokenPubkey: sellerTokenBalance.mint.toString(),
      sellerTokenAccountPubkey: sellerTokenAccount.address.toString(),
      sellerTokenBalance: sellerTokenBalance.amount,
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);

  process.env.SELLER_TOKEN_ACCOUNT_PUBKEY = sellerTokenAccount.address.toString();
 // process.env.TOKEN_PUBKEY = token.publicKey.toString();
  updateEnv();
};

setup();
