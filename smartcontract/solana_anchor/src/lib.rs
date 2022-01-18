pub mod utils;
use borsh::{BorshDeserialize,BorshSerialize};
use {
    crate::utils::*,
    anchor_lang::{
        prelude::*,
        AnchorDeserialize,
        AnchorSerialize,
        Key,
        solana_program::{
            program_pack::Pack,
            msg
        }      
    },
    spl_token::state
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn init_pool(
            ctx : Context<InitPool>,
            _amount: u64,
            _bump : u8,
        ) -> ProgramResult {

        msg!("Init Pool");

        let pool = &mut ctx.accounts.pool;
        let airdrop_account : state::Account = state::Account::unpack_from_slice(&ctx.accounts.airdrop_account.data.borrow())?;
        if airdrop_account.owner != pool.key() {
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if airdrop_account.mint != *ctx.accounts.airdrop_mint.key {
            return Err(PoolError::InvalidTokenAccount.into());
        }

        pool.owner = *ctx.accounts.owner.key;
        pool.rand = *ctx.accounts.rand.key;
        pool.airdrop_mint = *ctx.accounts.airdrop_mint.key;
        pool.airdrop_account = *ctx.accounts.airdrop_account.key;
        pool.airdrop_amount = _amount;
        pool.bump = _bump;

        Ok(())
    }

    pub fn update_pool(
            ctx : Context<UpdatePool>,
            _amount: u64,
        ) -> ProgramResult {

        msg!("Update Pool");

        let pool = &mut ctx.accounts.pool;
        let airdrop_account : state::Account = state::Account::unpack_from_slice(&ctx.accounts.airdrop_account.data.borrow())?;
        if airdrop_account.owner != pool.key() {
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if airdrop_account.mint != *ctx.accounts.airdrop_mint.key {
            return Err(PoolError::InvalidTokenAccount.into());
        }

        pool.owner = *ctx.accounts.owner.key;
        pool.airdrop_mint = *ctx.accounts.airdrop_mint.key;
        pool.airdrop_account = *ctx.accounts.airdrop_account.key;
        pool.airdrop_amount = _amount;
        
        Ok(())
    }

    pub fn airdrop_transfer(
            ctx : Context<AirdropTransfer>
        ) -> ProgramResult {

        msg!("Airdrop Transfer");

        let pool = &ctx.accounts.pool;
        
        if pool.airdrop_account != *ctx.accounts.source_airdrop_account.key {
            msg!("Source  account must be pool's  account");
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if pool.airdrop_account == *ctx.accounts.dest_airdrop_account.key {
            msg!("Dest  account is not allowed to be pool's  account");
            return Err(PoolError::InvalidTokenAccount.into());
        }

        let pool_airdrop_account : state::Account = state::Account::unpack_from_slice(&ctx.accounts.source_airdrop_account.data.borrow())?;
        let pool_airdrop_amount = pool_airdrop_account.amount;

        if pool_airdrop_amount < pool.airdrop_amount {
            msg!("Pool has insufficient funds");
            return Err(PoolError::InsufficientFunds.into());
        }

        let pool_seeds = &[
            pool.rand.as_ref(),
            &[pool.bump],
        ];

        spl_token_transfer(
            TokenTransferParams{
                source : ctx.accounts.source_airdrop_account.clone(),
                destination : ctx.accounts.dest_airdrop_account.clone(),
                authority : pool.to_account_info().clone(),
                authority_signer_seeds : pool_seeds,
                token_program : ctx.accounts.token_program.clone(),
                amount : pool.airdrop_amount,
            }
        )?;

        Ok(())
    }

    pub fn airdrop_mint_to(
            ctx : Context<AirdropMintTo>
        ) -> ProgramResult {
        
        msg!("Airdrop MintTo");

        let pool = &ctx.accounts.pool;
        
        if pool.airdrop_account == *ctx.accounts.dest_airdrop_account.key {
            msg!("Dest  account is not allowed to be pool's  account");
            return Err(PoolError::InvalidTokenAccount.into());
        }

        let pool_seeds = &[
            pool.rand.as_ref(),
            &[pool.bump],
        ];

        spl_token_mint_to(TokenMintToParams {
            mint : ctx.accounts.airdrop_mint.clone(),
            destination : ctx.accounts.dest_airdrop_account.clone(),
            amount : pool.airdrop_amount,
            authority : ctx.accounts.mint_authority.clone(),
            authority_signer_seeds : pool_seeds,
            token_program : ctx.accounts.token_program.clone(),
        })?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct AirdropTransfer<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,   

    pool : ProgramAccount<'info,Pool>,

    #[account(mut,owner=spl_token::id())]
    source_airdrop_account : AccountInfo<'info>,

    #[account(mut,owner=spl_token::id())]
    dest_airdrop_account : AccountInfo<'info>,

    #[account(address=spl_token::id())]
    token_program : AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AirdropMintTo<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,   

    pool : ProgramAccount<'info,Pool>,

    #[account(mut, owner=spl_token::id())]
    airdrop_mint : AccountInfo<'info>,

    #[account(mut, owner=spl_token::id())]
    dest_airdrop_account : AccountInfo<'info>,

    #[account(mut, signer)]
    mint_authority : AccountInfo<'info>,

    #[account(address = spl_token::id())]
    token_program : AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(_bump : u8)]
pub struct InitPool<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,

    #[account(init, seeds=[(*rand.key).as_ref()], bump = _bump, payer = owner, space = 8 + POOL_SIZE)]
    pool : ProgramAccount<'info, Pool>,

    rand : AccountInfo<'info>,

    #[account(owner=spl_token::id())]
    airdrop_mint : AccountInfo<'info>,

    #[account(owner=spl_token::id())]
    airdrop_account : AccountInfo<'info>,

    system_program : Program<'info,System>,
}

#[derive(Accounts)]
pub struct UpdatePool<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,

    #[account(mut)]
    pool : ProgramAccount<'info, Pool>,

    #[account(owner=spl_token::id())]
    airdrop_mint : AccountInfo<'info>,

    #[account(owner=spl_token::id())]
    airdrop_account : AccountInfo<'info>,

    system_program : Program<'info,System>,
}

pub const POOL_SIZE : usize = 32 + 32 + 32 + 32 + 8 + 1;

#[account]
pub struct Pool {
    pub owner : Pubkey,
    pub rand : Pubkey,
    pub airdrop_mint : Pubkey,
    pub airdrop_account : Pubkey,
    pub airdrop_amount : u64,
    pub bump : u8,
}

#[error]
pub enum PoolError {
    #[msg("Token mint to failed")]
    TokenMintToFailed,

    #[msg("Token set authority failed")]
    TokenSetAuthorityFailed,

    #[msg("Token transfer failed")]
    TokenTransferFailed,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    #[msg("Insufficient Pool Funds")]
    InsufficientFunds,
}