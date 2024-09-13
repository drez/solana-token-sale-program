import { PublicKey } from "@solana/web3.js";

//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";

export const TokenSaleAccountLayout = BufferLayout.struct([
  BufferLayout.u8("isInitialized"), //1byte
  BufferLayout.blob(32, "sellerPubkey"), //pubkey(32byte)
  BufferLayout.blob(32, "tempTokenAccountPubkey"), //pubkey(32byte)
  BufferLayout.blob(8, "pricePerToken"), //8byte
  BufferLayout.blob(8, "min_buy"), //8byte
]);

export interface TokenSaleAccountLayoutInterface {
  [index: string]: number | Uint8Array;
  isInitialized: number;
  sellerPubkey: Uint8Array;
  tempTokenAccountPubkey: Uint8Array;
  pricePerToken: Uint8Array;
  min_buy: Uint8Array;
}

export interface ExpectedTokenSaleAccountLayoutInterface {
  [index: string]: number | PublicKey;
  isInitialized: number;
  sellerPubkey: PublicKey;
  tempTokenAccountPubkey: PublicKey;
  pricePerToken: number;
  min_buy: number;
}
