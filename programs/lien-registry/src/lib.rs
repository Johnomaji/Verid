use anchor_lang::prelude::*;
use receipt_mint::ReceiptAccount;

declare_id!("Lien111111111111111111111111111111111111111");

pub const LIEN_SEED: &[u8] = b"lien";

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod lien_registry {
    use super::*;

    /// Record a lien (encumbrance) against a receipt token.
    /// Called by the lending pool when a loan is issued.
    /// `share_bps`: fraction of the receipt being pledged (0–10000 = 0–100%).
    pub fn create_lien(
        ctx: Context<CreateLien>,
        amount_usd_cents: u64,
        share_bps: u16,
    ) -> Result<()> {
        require!(share_bps > 0 && share_bps <= 10_000, LienError::InvalidShare);
        require!(amount_usd_cents > 0, LienError::InvalidAmount);

        let receipt = &mut ctx.accounts.receipt;
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < receipt.expires_at, LienError::ReceiptExpired);

        // Ensure total encumbrance doesn't exceed 100%
        let new_total = receipt.encumbrance_bps
            .checked_add(share_bps)
            .ok_or(LienError::OverEncumbered)?;
        require!(new_total <= 10_000, LienError::OverEncumbered);

        receipt.is_encumbered   = true;
        receipt.encumbrance_bps = new_total;

        let lien = &mut ctx.accounts.lien;
        lien.receipt          = ctx.accounts.receipt.key();
        lien.lender           = ctx.accounts.lender.key();
        lien.amount_usd_cents = amount_usd_cents;
        lien.share_bps        = share_bps;
        lien.is_active        = true;
        lien.created_at       = clock.unix_timestamp;
        lien.settled_at       = None;
        lien.bump             = ctx.bumps.lien;

        emit!(LienCreated {
            lien:             lien.key(),
            receipt:          lien.receipt,
            lender:           lien.lender,
            amount_usd_cents: lien.amount_usd_cents,
            share_bps:        lien.share_bps,
        });

        Ok(())
    }

    /// Release (settle) a lien when a loan is repaid or liquidated.
    pub fn release_lien(ctx: Context<ReleaseLien>) -> Result<()> {
        let lien = &mut ctx.accounts.lien;
        require!(lien.is_active, LienError::LienNotActive);

        lien.is_active  = false;
        lien.settled_at = Some(Clock::get()?.unix_timestamp);

        // Update receipt encumbrance
        let receipt = &mut ctx.accounts.receipt;
        receipt.encumbrance_bps = receipt
            .encumbrance_bps
            .saturating_sub(lien.share_bps);
        if receipt.encumbrance_bps == 0 {
            receipt.is_encumbered = false;
        }

        emit!(LienReleased {
            lien:        lien.key(),
            receipt:     lien.receipt,
            settled_at:  lien.settled_at.unwrap(),
        });

        Ok(())
    }

    /// Query helper — check if a receipt can be pledged for an additional share.
    pub fn check_available_share(
        ctx: Context<CheckShare>,
        requested_bps: u16,
    ) -> Result<u16> {
        let receipt = &ctx.accounts.receipt;
        let available = 10_000u16.saturating_sub(receipt.encumbrance_bps);
        require!(available >= requested_bps, LienError::OverEncumbered);
        Ok(available)
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct CreateLien<'info> {
    #[account(
        init,
        payer = lender,
        space = LienAccount::LEN,
        seeds = [
            LIEN_SEED,
            receipt.key().as_ref(),
            lender.key().as_ref(),
        ],
        bump,
    )]
    pub lien: Account<'info, LienAccount>,

    /// The receipt being pledged — must be owned by the borrower
    #[account(
        mut,
        constraint = receipt.owner == borrower.key() @ LienError::NotReceiptOwner,
    )]
    pub receipt: Account<'info, ReceiptAccount>,

    /// Borrower signs to authorise pledging their receipt
    pub borrower: Signer<'info>,

    /// Lender / lending pool PDA pays for account creation
    #[account(mut)]
    pub lender: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseLien<'info> {
    #[account(
        mut,
        has_one = lender @ LienError::Unauthorized,
    )]
    pub lien: Account<'info, LienAccount>,

    #[account(mut)]
    pub receipt: Account<'info, ReceiptAccount>,

    /// Only the original lender (or lending pool PDA) can release a lien
    pub lender: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckShare<'info> {
    pub receipt: Account<'info, ReceiptAccount>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct LienAccount {
    pub receipt:          Pubkey,       // 32
    pub lender:           Pubkey,       // 32
    pub amount_usd_cents: u64,          // 8
    pub share_bps:        u16,          // 2
    pub is_active:        bool,         // 1
    pub created_at:       i64,          // 8
    pub settled_at:       Option<i64>,  // 9
    pub bump:             u8,           // 1
}

impl LienAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 2 + 1 + 8 + 9 + 1;
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct LienCreated {
    pub lien:             Pubkey,
    pub receipt:          Pubkey,
    pub lender:           Pubkey,
    pub amount_usd_cents: u64,
    pub share_bps:        u16,
}

#[event]
pub struct LienReleased {
    pub lien:       Pubkey,
    pub receipt:    Pubkey,
    pub settled_at: i64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum LienError {
    #[msg("Share must be between 1 and 10000 basis points")]
    InvalidShare,
    #[msg("Loan amount must be greater than zero")]
    InvalidAmount,
    #[msg("Receipt has expired")]
    ReceiptExpired,
    #[msg("Total encumbrance would exceed 100%")]
    OverEncumbered,
    #[msg("Lien is not active")]
    LienNotActive,
    #[msg("Signer is not the receipt owner")]
    NotReceiptOwner,
    #[msg("Only the original lender can release this lien")]
    Unauthorized,
}
