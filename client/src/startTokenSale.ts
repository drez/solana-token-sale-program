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

type InstructionNumber = 0 | 1 | 2;

const transaction = async () => {  
  console.log("2. Start Token Sale");

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(process.env.RPCURL!, "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const secretKey = bs58.decode(process.env.SELLER_PRIVATE_KEY!);
  const sellerPrivateKey = Uint8Array.from(Buffer.from(secretKey));
  const sellerKeypair = new Keypair({
    publicKey: sellerPubkey.toBytes(),
    secretKey: sellerPrivateKey,
  });
  const tokenMintAccountPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const sellerTokenAccountPubkey = new PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!);
  console.log("sellerTokenAccountPubkey: ", sellerTokenAccountPubkey.toBase58());
  const instruction: InstructionNumber = 0;
  const amountOfTokenWantToSale = 1000;
  const tokenPrice = parseFloat(process.env.TOKEN_SALE_PRICE!);
  const perTokenPrice = tokenPrice*LAMPORTS_PER_SOL;

  const tempTokenAccountKeypair = new Keypair();
  console.log("tempTokenAccountKeypair: "+tempTokenAccountKeypair.publicKey);
  const createTempTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tempTokenAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    space: AccountLayout.span,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const tokenSaleProgramAccountKeypair = new Keypair();
  console.log("tokenSaleProgramAccountKeypair: "+tokenSaleProgramAccountKeypair.publicKey);
  const createTokenSaleProgramAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tokenSaleProgramAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(TokenSaleAccountLayout.span),
    space: TokenSaleAccountLayout.span,
    programId: tokenSaleProgramId,
  });

  const initTempTokenAccountIx = createInitializeAccountInstruction(
    tempTokenAccountKeypair.publicKey,
    tokenMintAccountPubkey,
    sellerKeypair.publicKey,
    TOKEN_2022_PROGRAM_ID
  );

  const transferTokenToTempTokenAccountIx = createTransferInstruction(
    sellerTokenAccountPubkey,
    tempTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey,
    amountOfTokenWantToSale,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  const initTokenSaleProgramIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerKeypair.publicKey, true, false),
      createAccountInfo(tempTokenAccountKeypair.publicKey, false, true),
      createAccountInfo(tokenSaleProgramAccountKeypair.publicKey, false, true),
      createAccountInfo(SYSVAR_RENT_PUBKEY, false, false),
      createAccountInfo(TOKEN_2022_PROGRAM_ID, false, false),
    ],
    data: Buffer.from(
      Uint8Array.of(instruction, ...new BN(perTokenPrice).toArray("le", 8))
    ),
  });

  //make transaction with several instructions(ix)
 console.log("Send transaction 1...\n");
  let tx = new Transaction().add(
    createTempTokenAccountIx,
    initTempTokenAccountIx,
    transferTokenToTempTokenAccountIx,
    createTokenSaleProgramAccountIx,
    initTokenSaleProgramIx
  );

  await sendAndConfirmTransaction(connection, tx, [sellerKeypair, tempTokenAccountKeypair, tokenSaleProgramAccountKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  }).catch(err => console.log(err));

  //phase1 end
  console.log("Init: "+tokenSaleProgramAccountKeypair.publicKey);

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 3000));

  //phase2 (check Transaction result is valid)
  const tokenSaleProgramAccount = await checkAccountInitialized(connection, tokenSaleProgramAccountKeypair.publicKey);

  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;

  const expectedTokenSaleProgramAccountData: ExpectedTokenSaleAccountLayoutInterface = {
    isInitialized: 1,
    sellerPubkey: sellerKeypair.publicKey,
    tempTokenAccountPubkey: tempTokenAccountKeypair.publicKey,
    pricePerToken: perTokenPrice,
  };

  console.log("Current TokenSaleProgramAccountData");
  checkAccountDataIsValid(decodedTokenSaleProgramAccountData, expectedTokenSaleProgramAccountData);

  console.table([
    {
      tokenSaleProgramAccountPubkey: tokenSaleProgramAccountKeypair.publicKey.toString(),
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end

  process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY = tokenSaleProgramAccountKeypair.publicKey.toString();
  process.env.TEMP_TOKEN_ACCOUNT_PUBKEY = tempTokenAccountKeypair.publicKey.toString();
  updateEnv();
  
};

transaction();
