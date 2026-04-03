use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2, get_feed_id_from_hex};
use receipt_mint::ReceiptAccount;

declare_id!("Pool111111111111111111111111111111111111111");

pub const POOL_SEED:     &[u8] = b"pool";
pub const POSITION_SEED: &[u8] = b"position";
pub const VAULT_SEED:    &[u8] = b"vault";

// Pyth price feed IDs (devnet)
pub const COCOA_FEED_ID:  &str = "c822c4e9352bf3de3f8d56e7a5b3e55f36b4ef03e5e7e65a9310a432e7c9f91"; // mock — replace with real ID
pub const SESAME_FEED_ID: &str = "a822c4e9352bf3de3f8d56e7a5b3e55f36b4ef03e5e7e65a9310a432e7c9f91";
pub const GRAIN_FEED_ID:  &str = "b822c4e9352bf3de3f8d56e7a5b3e55f36b4ef03e5e7e65a9310a432e7c9f91";

pub const PRICE_STALENESS_SECS: u64 = 60; // reject Pyth prices older than 60s
pub const LIQUIDATION_THRESHOLD_BPS: u16 = 8_500; // liquidate at 85% LTV

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod lending_pool {
    use super::*;

    /// Initialize the lending pool. Called once by the protocol admin.
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        max_ltv_bps: u16,        // e.g. 7000 = 70% LTV
        interest_rate_bps: u16,  // e.g. 1350 = 13.5% APR
    ) -> Result<()> {
        require!(max_ltv_bps <= 9_000, PoolError::InvalidLtv);
        require!(interest_rate_bps <= 5_000, PoolError::InvalidRate);

        let pool = &mut ctx.accounts.pool;
        pool.admin             = ctx.accounts.admin.key();
        pool.usdc_mint         = ctx.accounts.usdc_mint.key();
        pool.vault             = ctx.accounts.vault.key();
        pool.total_deposited   = 0;
        pool.total_borrowed    = 0;
        pool.max_ltv_bps       = max_ltv_bps;
        pool.interest_rate_bps = interest_rate_bps;
        pool.bump              = ctx.bumps.pool;
        pool.vault_bump        = ctx.bumps.vault;

        emit!(PoolInitialized {
            pool:              pool.key(),
            max_ltv_bps:       pool.max_ltv_bps,
            interest_rate_bps: pool.interest_rate_bps,
        });

        Ok(())
    }

    /// LP deposits USDC into the pool to provide liquidity.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, PoolError::InvalidAmount);

        // Transfer USDC from LP → vault
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.depositor_token_account.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.pool.total_deposited = ctx.accounts.pool
            .total_deposited
            .checked_add(amount)
            .ok_or(PoolError::Overflow)?;

        emit!(Deposited {
            depositor: ctx.accounts.depositor.key(),
            amount,
            total_deposited: ctx.accounts.pool.total_deposited,
        });

        Ok(())
    }

    /// Borrower posts a verified receipt as collateral and draws USDC.
    pub fn borrow(
        ctx: Context<Borrow>,
        requested_usdc: u64,    // in USDC lamports (6 decimals)
        share_bps: u16,         // fraction of receipt to pledge
    ) -> Result<()> {
        require!(requested_usdc > 0, PoolError::InvalidAmount);
        require!(share_bps > 0 && share_bps <= 10_000, PoolError::InvalidShare);

        let receipt   = &ctx.accounts.receipt;
        let pool      = &ctx.accounts.pool;
        let clock     = Clock::get()?;

        require!(clock.unix_timestamp < receipt.expires_at, PoolError::ReceiptExpired);

        // Get commodity price from Pyth
        let price_per_kg = get_commodity_price(
            &ctx.accounts.price_update,
            &receipt.commodity,
            clock.unix_timestamp,
        )?;

        // Calculate max borrowable against pledged share
        // face_value_usdc = quantity_kg × price_per_kg × share_bps / 10000
        let face_value = (receipt.quantity_kg as u128)
            .checked_mul(price_per_kg as u128).unwrap()
            .checked_mul(share_bps as u128).unwrap()
            .checked_div(10_000).unwrap() as u64;

        let max_borrow = (face_value as u128)
            .checked_mul(pool.max_ltv_bps as u128).unwrap()
            .checked_div(10_000).unwrap() as u64;

        require!(requested_usdc <= max_borrow, PoolError::ExceedsMaxLtv);
        require!(
            requested_usdc <= pool.available_liquidity(),
            PoolError::InsufficientLiquidity
        );

        // Create lien via CPI
        let lien_amount_cents = requested_usdc / 10_000; // USDC lamports → cents
        lien_registry::cpi::create_lien(
            CpiContext::new(
                ctx.accounts.lien_program.to_account_info(),
                lien_registry::cpi::accounts::CreateLien {
                    lien:           ctx.accounts.lien.to_account_info(),
                    receipt:        ctx.accounts.receipt.to_account_info(),
                    borrower:       ctx.accounts.borrower.to_account_info(),
                    lender:         ctx.accounts.pool.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            lien_amount_cents,
            share_bps,
        )?;

        // Record loan position
        let position = &mut ctx.accounts.position;
        position.pool           = ctx.accounts.pool.key();
        position.receipt        = ctx.accounts.receipt.key();
        position.borrower       = ctx.accounts.borrower.key();
        position.lien           = ctx.accounts.lien.key();
        position.principal_usdc = requested_usdc;
        position.interest_accrued = 0;
        position.share_bps      = share_bps;
        position.price_per_kg   = price_per_kg;
        position.borrowed_at    = clock.unix_timestamp;
        position.due_at         = clock.unix_timestamp + 180 * 86_400; // 180 days
        position.status         = LoanStatus::Active;
        position.bump           = ctx.bumps.position;

        // Transfer USDC from vault → borrower (pool PDA signs)
        let pool_seeds: &[&[u8]] = &[POOL_SEED, &[ctx.accounts.pool.bump]];
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault.to_account_info(),
                    to:        ctx.accounts.borrower_token_account.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                &[pool_seeds],
            ),
            requested_usdc,
        )?;

        ctx.accounts.pool.total_borrowed = ctx.accounts.pool
            .total_borrowed
            .checked_add(requested_usdc)
            .ok_or(PoolError::Overflow)?;

        emit!(Borrowed {
            position:       position.key(),
            borrower:       position.borrower,
            principal_usdc: position.principal_usdc,
            share_bps:      position.share_bps,
            price_per_kg:   position.price_per_kg,
            due_at:         position.due_at,
        });

        Ok(())
    }

    /// Borrower repays principal + accrued interest. Lien is released.
    pub fn repay(ctx: Context<Repay>) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(position.status == LoanStatus::Active, PoolError::LoanNotActive);

        let clock         = Clock::get()?;
        let elapsed_secs  = (clock.unix_timestamp - position.borrowed_at) as u64;
        let interest      = calculate_interest(
            position.principal_usdc,
            ctx.accounts.pool.interest_rate_bps,
            elapsed_secs,
        );
        let repay_amount  = position.principal_usdc.checked_add(interest).ok_or(PoolError::Overflow)?;

        // Transfer USDC from borrower → vault
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.borrower_token_account.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.borrower.to_account_info(),
                },
            ),
            repay_amount,
        )?;

        // Release lien via CPI
        let pool_seeds: &[&[u8]] = &[POOL_SEED, &[ctx.accounts.pool.bump]];
        lien_registry::cpi::release_lien(
            CpiContext::new_with_signer(
                ctx.accounts.lien_program.to_account_info(),
                lien_registry::cpi::accounts::ReleaseLien {
                    lien:    ctx.accounts.lien.to_account_info(),
                    receipt: ctx.accounts.receipt.to_account_info(),
                    lender:  ctx.accounts.pool.to_account_info(),
                },
                &[pool_seeds],
            ),
        )?;

        position.interest_accrued = interest;
        position.status           = LoanStatus::Repaid;

        ctx.accounts.pool.total_borrowed = ctx.accounts.pool
            .total_borrowed
            .saturating_sub(position.principal_usdc);

        emit!(Repaid {
            position:    position.key(),
            borrower:    position.borrower,
            repay_amount,
        });

        Ok(())
    }

    /// Liquidate an underwater or overdue loan.
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        let position  = &mut ctx.accounts.position;
        let receipt   = &ctx.accounts.receipt;
        let clock     = Clock::get()?;

        require!(position.status == LoanStatus::Active, PoolError::LoanNotActive);

        let is_overdue     = clock.unix_timestamp > position.due_at;
        let price_per_kg   = get_commodity_price(
            &ctx.accounts.price_update,
            &receipt.commodity,
            clock.unix_timestamp,
        )?;
        let current_value  = (receipt.quantity_kg as u128)
            .checked_mul(price_per_kg as u128).unwrap()
            .checked_mul(position.share_bps as u128).unwrap()
            .checked_div(10_000).unwrap() as u64;
        let current_ltv_bps = if current_value == 0 {
            10_000u16
        } else {
            ((position.principal_usdc as u128)
                .checked_mul(10_000).unwrap()
                .checked_div(current_value as u128).unwrap()) as u16
        };

        let is_underwater  = current_ltv_bps >= LIQUIDATION_THRESHOLD_BPS;

        require!(is_overdue || is_underwater, PoolError::LoanNotLiquidatable);

        // Release lien
        let pool_seeds: &[&[u8]] = &[POOL_SEED, &[ctx.accounts.pool.bump]];
        lien_registry::cpi::release_lien(
            CpiContext::new_with_signer(
                ctx.accounts.lien_program.to_account_info(),
                lien_registry::cpi::accounts::ReleaseLien {
                    lien:    ctx.accounts.lien.to_account_info(),
                    receipt: ctx.accounts.receipt.to_account_info(),
                    lender:  ctx.accounts.pool.to_account_info(),
                },
                &[pool_seeds],
            ),
        )?;

        position.status = LoanStatus::Liquidated;

        emit!(Liquidated {
            position:       position.key(),
            borrower:       position.borrower,
            current_ltv_bps,
            is_overdue,
        });

        Ok(())
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Fetch and validate a commodity price from Pyth.
/// Returns price in USD cents per kg (u64).
fn get_commodity_price(
    price_update: &Account<PriceUpdateV2>,
    commodity: &str,
    current_ts: i64,
) -> Result<u64> {
    let feed_id_hex = match commodity.to_lowercase().as_str() {
        "cocoa"  => COCOA_FEED_ID,
        "sesame" => SESAME_FEED_ID,
        "grain"  => GRAIN_FEED_ID,
        _        => GRAIN_FEED_ID,
    };
    let feed_id = get_feed_id_from_hex(feed_id_hex).map_err(|_| PoolError::InvalidPriceFeed)?;
    let price   = price_update.get_price_no_older_than(
        &Clock::get()?,
        PRICE_STALENESS_SECS,
        &feed_id,
    ).map_err(|_| PoolError::StalePriceData)?;

    // price.price is in the oracle's base units; normalise to USD cents per kg
    // This normalisation is commodity-specific — using a simple approximation here
    let price_usd_cents = (price.price.abs() as u64) / 100;
    Ok(price_usd_cents)
}

/// Simple interest: principal × rate × time / (365 days × 10000)
fn calculate_interest(principal: u64, rate_bps: u16, elapsed_secs: u64) -> u64 {
    const YEAR_SECS: u64 = 365 * 86_400;
    (principal as u128)
        .checked_mul(rate_bps as u128).unwrap()
        .checked_mul(elapsed_secs as u128).unwrap()
        .checked_div(YEAR_SECS as u128 * 10_000).unwrap() as u64
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = admin,
        space = PoolAccount::LEN,
        seeds = [POOL_SEED],
        bump,
    )]
    pub pool: Account<'info, PoolAccount>,

    #[account(
        init,
        payer                    = admin,
        seeds                    = [VAULT_SEED],
        bump,
        token::mint              = usdc_mint,
        token::authority         = pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:           Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, PoolAccount>,

    #[account(mut, seeds = [VAULT_SEED], bump = pool.vault_bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub depositor:      Signer<'info>,
    pub token_program:  Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, PoolAccount>,

    #[account(mut, seeds = [VAULT_SEED], bump = pool.vault_bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = borrower,
        space = LoanPosition::LEN,
        seeds = [POSITION_SEED, receipt.key().as_ref(), borrower.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, LoanPosition>,

    #[account(
        constraint = receipt.owner == borrower.key() @ PoolError::NotReceiptOwner,
    )]
    pub receipt: Account<'info, ReceiptAccount>,

    /// CHECK: lien PDA is initialised by the lien-registry CPI
    #[account(mut)]
    pub lien: UncheckedAccount<'info>,

    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,

    /// Pyth price oracle for the commodity
    pub price_update: Account<'info, PriceUpdateV2>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub lien_program:   Program<'info, lien_registry::program::LienRegistry>,
    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, PoolAccount>,

    #[account(mut, seeds = [VAULT_SEED], bump = pool.vault_bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        has_one = borrower @ PoolError::Unauthorized,
        has_one = pool     @ PoolError::Unauthorized,
    )]
    pub position: Account<'info, LoanPosition>,

    #[account(mut)]
    pub receipt: Account<'info, ReceiptAccount>,

    #[account(mut)]
    pub lien: Account<'info, lien_registry::LienAccount>,

    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,

    pub borrower:       Signer<'info>,
    pub lien_program:   Program<'info, lien_registry::program::LienRegistry>,
    pub token_program:  Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, PoolAccount>,

    #[account(mut)]
    pub position: Account<'info, LoanPosition>,

    pub receipt: Account<'info, ReceiptAccount>,

    #[account(mut)]
    pub lien: Account<'info, lien_registry::LienAccount>,

    pub price_update: Account<'info, PriceUpdateV2>,

    /// Anyone can trigger liquidation
    pub liquidator: Signer<'info>,

    pub lien_program: Program<'info, lien_registry::program::LienRegistry>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct PoolAccount {
    pub admin:             Pubkey,  // 32
    pub usdc_mint:         Pubkey,  // 32
    pub vault:             Pubkey,  // 32
    pub total_deposited:   u64,     // 8
    pub total_borrowed:    u64,     // 8
    pub max_ltv_bps:       u16,     // 2
    pub interest_rate_bps: u16,     // 2
    pub bump:              u8,      // 1
    pub vault_bump:        u8,      // 1
}

impl PoolAccount {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 2 + 2 + 1 + 1;

    pub fn available_liquidity(&self) -> u64 {
        self.total_deposited.saturating_sub(self.total_borrowed)
    }
}

#[account]
pub struct LoanPosition {
    pub pool:              Pubkey,      // 32
    pub receipt:           Pubkey,      // 32
    pub borrower:          Pubkey,      // 32
    pub lien:              Pubkey,      // 32
    pub principal_usdc:    u64,         // 8
    pub interest_accrued:  u64,         // 8
    pub share_bps:         u16,         // 2
    pub price_per_kg:      u64,         // 8
    pub borrowed_at:       i64,         // 8
    pub due_at:            i64,         // 8
    pub status:            LoanStatus,  // 1 + 1
    pub bump:              u8,          // 1
}

impl LoanPosition {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 2 + 8 + 8 + 8 + 2 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
    Liquidated,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PoolInitialized {
    pub pool:              Pubkey,
    pub max_ltv_bps:       u16,
    pub interest_rate_bps: u16,
}

#[event]
pub struct Deposited {
    pub depositor:       Pubkey,
    pub amount:          u64,
    pub total_deposited: u64,
}

#[event]
pub struct Borrowed {
    pub position:       Pubkey,
    pub borrower:       Pubkey,
    pub principal_usdc: u64,
    pub share_bps:      u16,
    pub price_per_kg:   u64,
    pub due_at:         i64,
}

#[event]
pub struct Repaid {
    pub position:     Pubkey,
    pub borrower:     Pubkey,
    pub repay_amount: u64,
}

#[event]
pub struct Liquidated {
    pub position:       Pubkey,
    pub borrower:       Pubkey,
    pub current_ltv_bps: u16,
    pub is_overdue:     bool,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum PoolError {
    #[msg("LTV must be between 0 and 90%")]
    InvalidLtv,
    #[msg("Interest rate must be between 0 and 50%")]
    InvalidRate,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Share must be between 1 and 10000 basis points")]
    InvalidShare,
    #[msg("Loan amount exceeds maximum LTV")]
    ExceedsMaxLtv,
    #[msg("Pool has insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Receipt has expired")]
    ReceiptExpired,
    #[msg("Signer is not the receipt owner")]
    NotReceiptOwner,
    #[msg("Loan is not in Active status")]
    LoanNotActive,
    #[msg("Loan is not overdue or underwater — cannot liquidate")]
    LoanNotLiquidatable,
    #[msg("Signer is not authorised for this operation")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid Pyth price feed ID")]
    InvalidPriceFeed,
    #[msg("Pyth price data is stale")]
    StalePriceData,
}
