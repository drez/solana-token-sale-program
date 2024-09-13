use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::CustomError::InvalidInstruction;

pub enum TokenSaleInstruction {
    InitTokenSale { per_token_price: u64, min_buy: u64 },
    BuyToken { number_of_tokens: u64 },
    UpdateTokenPrice { new_per_token_price: u64 },
    EndTokenSale {},
}

//function of enum
impl TokenSaleInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        //check instruction type
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        //unpack the rest data for each instruction
        return match tag {
            0 => Ok(Self::InitTokenSale {
                per_token_price: Self::unpack_byte(rest, 0)?,
                min_buy: Self::unpack_byte(rest, 1)?,
            }),
            1 => Ok(Self::BuyToken {
                number_of_tokens: Self::unpack_byte(rest, 0)?,
            }),
            2 => Ok(Self::EndTokenSale {}),
            3 => Ok(Self::UpdateTokenPrice {
                new_per_token_price: Self::unpack_byte(rest, 0)?,
            }),
            _ => Err(InvalidInstruction.into()),
        };
    }
    fn unpack_byte(input: &[u8], byte_index: usize) -> Result<u64, ProgramError> {
        let start_bit = byte_index * 8;
        let end_bit = start_bit + 8;

        let data = input
            .get(start_bit..end_bit)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        return Ok(data);
    }
}
