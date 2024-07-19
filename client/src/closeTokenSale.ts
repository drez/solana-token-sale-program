/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { createAccountInfo, checkAccountInitialized } from "./utils";
import { getOrCreateAssociatedTokenAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TokenSaleAccountLayoutInterface, TokenSaleAccountLayout } from "./account";
import bs58 = require("bs58");

type InstructionNumber = 0 | 1 | 2;

const transaction = async () => { 
   
  console.log("4. Close Token Sale");

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const secretKey = bs58.decode(process.env.SELLER_PRIVATE_KEY!);
  const sellerPrivateKey = Uint8Array.from(Buffer.from(secretKey));
  const sellerKeypair = new Keypair({
    publicKey: sellerPubkey.toBytes(),
    secretKey: sellerPrivateKey,
  });
  const buyerPubkey = new PublicKey(process.env.BUYER_PUBLIC_KEY!);
  const secretKey1 = bs58.decode(process.env.BUYER_PRIVATE_KEY!);
  const buyerPrivateKey = Uint8Array.from(Buffer.from(secretKey1));
  const buyerKeypair = new Keypair({
    publicKey: buyerPubkey.toBytes(),
    secretKey: buyerPrivateKey,
  });

  const tokenPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const tokenSaleProgramAccountPubkey = new PublicKey(process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY!);
  const sellerTokenAccountPubkey = new PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!);
  const instruction: InstructionNumber = 2;

  const tokenSaleProgramAccount = await checkAccountInitialized(connection, tokenSaleProgramAccountPubkey);
  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;
  const tokenSaleProgramAccountData = {
    isInitialized: decodedTokenSaleProgramAccountData.isInitialized,
    sellerPubkey: new PublicKey(decodedTokenSaleProgramAccountData.sellerPubkey),
    tempTokenAccountPubkey: new PublicKey(decodedTokenSaleProgramAccountData.tempTokenAccountPubkey),
    swapSolAmount: decodedTokenSaleProgramAccountData.swapSolAmount,
    swapTokenAmount: decodedTokenSaleProgramAccountData.swapTokenAmount,
  };

  const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, buyerKeypair, tokenPubkey, buyerKeypair.publicKey, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID);

  const PDA = await PublicKey.findProgramAddressSync([Buffer.from("token_sale")], tokenSaleProgramId);

  const closeTokenSaleIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerPubkey, true, true),
      createAccountInfo(sellerTokenAccountPubkey, false, true),
      createAccountInfo(tokenSaleProgramAccountData.tempTokenAccountPubkey, false, true),
      createAccountInfo(TOKEN_2022_PROGRAM_ID, false, false),
      createAccountInfo(PDA[0], false, false),
      createAccountInfo(tokenSaleProgramAccountPubkey, false, true),
    ],
    data: Buffer.from(Uint8Array.of(instruction)),
  });
  const tx = new Transaction().add(closeTokenSaleIx);

  await connection.sendTransaction(tx, [sellerKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  //phase1 end

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //phase2 (check token sale)
  const sellerTokenAccountBalance = await connection.getTokenAccountBalance(sellerTokenAccountPubkey);
  const buyerTokenAccountBalance = await connection.getTokenAccountBalance(buyerTokenAccount.address);

  console.table([
    {
      sellerTokenAccountBalance: sellerTokenAccountBalance.value.amount.toString(),
      buyerTokenAccountBalance: buyerTokenAccountBalance.value.amount.toString(),
    },
  ]);

  const sellerSOLBalance = await connection.getBalance(sellerPubkey, "confirmed");
  const buyerSOLBalance = await connection.getBalance(buyerPubkey, "confirmed");

  console.table([
    {
      sellerSOLBalance: sellerSOLBalance / LAMPORTS_PER_SOL,
      buyerSOLBalance: buyerSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end
};

transaction();
