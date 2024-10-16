/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import {
  sendAndConfirmTransaction,
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  SendTransactionError
} from "@solana/web3.js";
import BN = require("bn.js");
import { checkAccountInitialized, checkAccountDataIsValid, createAccountInfo, updateEnv } from "./utils";
import { createTransferInstruction, createInitializeAccountInstruction, AccountLayout,  TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {
  TokenSaleAccountLayout,
  TokenSaleAccountLayoutInterface,
  ExpectedTokenSaleAccountLayoutInterface,
} from "./account";
import bs58 = require("bs58");

const tokenAmountToAdd = 10;

 console.log("Setup Transaction");
  const connection = new Connection(process.env.RPCURL!, "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
  console.log(" -Seller");
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const secretKey = bs58.decode(process.env.SELLER_PRIVATE_KEY!);
  const sellerPrivateKey = Uint8Array.from(Buffer.from(secretKey));
  const sellerKeypair = new Keypair({
    publicKey: sellerPubkey.toBytes(),
    secretKey: sellerPrivateKey,
  });
  console.log(" -Token");
  const tokenMintAccountPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const tokenDecimal = parseInt(process.env.TOKEN_DECIMAL!);
  const sellerTokenAccountPubkey = new PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!);
const tempTokenAccountKeypair = new PublicKey(process.env.TEMP_TOKEN_ACCOUNT_PUBKEY!);
  const amountOfTokenForSale = 100 * Math.pow(tokenAmountToAdd, tokenDecimal);
  
  
const transaction = async () => {
  const transferTokenToTempTokenAccountIx = createTransferInstruction(
    sellerTokenAccountPubkey,
    tempTokenAccountKeypair,
    sellerKeypair.publicKey,
    amountOfTokenForSale,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  let tx = new Transaction().add(
    transferTokenToTempTokenAccountIx,
  );

  await sendAndConfirmTransaction(connection, tx, [sellerKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  }).catch(err => console.log(err));

}

transaction();