use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
        CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use attestation::{AttestationAccount, AttestationStatus};

declare_id!("Rcpt111111111111111111111111111111111111111");

pub const RECEIPT_SEED:  &[u8] = b"receipt";
pub const MINT_AUTH_SEED: &[u8] = b"mint_authority";

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod receipt_mint {
    use super::*;

    /// Mint a warehouse receipt SPL token from a verified attestation.
    /// One attestation → one receipt mint. Enforced by PDA derivation.
    pub fn mint_receipt(
        ctx: Context<MintReceipt>,
        expires_at: i64,
    ) -> Result<()> {
        let att = &ctx.accounts.attestation;

        // Only verified attestations can be minted
        require!(
            att.status == AttestationStatus::Verified,
            ReceiptError::AttestationNotVerified
        );
        require!(!att.is_disputed, ReceiptError::AttestationDisputed);

        let clock = Clock::get()?;
        require!(expires_at > clock.unix_timestamp, ReceiptError::InvalidExpiry);

        // Store receipt metadata on-chain
        let receipt = &mut ctx.accounts.receipt;
        receipt.attestation    = ctx.accounts.attestation.key();
        receipt.owner          = ctx.accounts.owner.key();
        receipt.mint           = ctx.accounts.mint.key();
        receipt.commodity      = att.commodity.clone();
        receipt.quantity_kg    = att.quantity_kg;
        receipt.grade          = att.grade.clone();
        receipt.warehouse_id   = att.warehouse_id.clone();
        receipt.is_encumbered  = false;
        receipt.encumbrance_bps = 0;
        receipt.minted_at      = clock.unix_timestamp;
        receipt.expires_at     = expires_at;
        receipt.bump           = ctx.bumps.receipt;

        // Derive mint authority signer seeds
        let mint_auth_seeds: &[&[u8]] = &[
            MINT_AUTH_SEED,
            ctx.accounts.attestation.key().as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[mint_auth_seeds];

        // Create Metaplex metadata for the SPL token
        let symbol = commodity_symbol(&att.commodity);
        let name = format!(
            "VeridLayer {} Receipt — {}kg Grade {}",
            symbol, att.quantity_kg, att.grade
        );
        let uri = format!(
            "https://veridlayer.xyz/receipt/{}",
            ctx.accounts.attestation.key()
        );

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata:         ctx.accounts.metadata.to_account_info(),
                    mint:             ctx.accounts.mint.to_account_info(),
                    mint_authority:   ctx.accounts.mint_authority.to_account_info(),
                    payer:            ctx.accounts.owner.to_account_info(),
                    update_authority: ctx.accounts.mint_authority.to_account_info(),
                    system_program:   ctx.accounts.system_program.to_account_info(),
                    rent:             ctx.accounts.rent.to_account_info(),
                },
                signer_seeds,
            ),
            DataV2 {
                name,
                symbol: symbol.to_string(),
                uri,
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            false, // is_mutable
            true,  // update_authority_is_signer
            None,  // collection_details
        )?;

        // Mint exactly 1 token (receipt is non-fungible)
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.mint.to_account_info(),
                    to:        ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            1,
        )?;

        emit!(ReceiptMinted {
            receipt:     receipt.key(),
            attestation: receipt.attestation,
            mint:        receipt.mint,
            owner:       receipt.owner,
            commodity:   receipt.commodity.clone(),
            quantity_kg: receipt.quantity_kg,
        });

        Ok(())
    }

    /// Transfer receipt ownership to a new wallet.
    pub fn transfer_receipt(ctx: Context<TransferReceipt>) -> Result<()> {
        let receipt = &mut ctx.accounts.receipt;
        require!(!receipt.is_encumbered, ReceiptError::ReceiptEncumbered);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < receipt.expires_at, ReceiptError::ReceiptExpired);

        receipt.owner = ctx.accounts.new_owner.key();

        emit!(ReceiptTransferred {
            receipt:   receipt.key(),
            old_owner: ctx.accounts.current_owner.key(),
            new_owner: receipt.owner,
        });

        Ok(())
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn commodity_symbol(commodity: &str) -> &'static str {
    match commodity.to_lowercase().as_str() {
        "cocoa"  => "COCOA",
        "sesame" => "SES",
        "grain"  => "GRN",
        "coffee" => "CFE",
        _        => "RWA",
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct MintReceipt<'info> {
    #[account(
        init,
        payer = owner,
        space = ReceiptAccount::LEN,
        seeds = [RECEIPT_SEED, attestation.key().as_ref()],
        bump,
    )]
    pub receipt: Account<'info, ReceiptAccount>,

    /// The verified attestation this receipt is based on
    pub attestation: Account<'info, AttestationAccount>,

    /// The new SPL mint for this receipt token
    #[account(
        init,
        payer   = owner,
        mint::decimals  = 0,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// PDA that acts as mint authority (prevents unauthorized minting)
    /// CHECK: validated by seeds constraint
    #[account(
        seeds = [MINT_AUTH_SEED, attestation.key().as_ref()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer                    = owner,
        associated_token::mint   = mint,
        associated_token::authority = owner,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// CHECK: created by Metaplex CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program:        Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program:     Program<'info, Metadata>,
    pub system_program:       Program<'info, System>,
    pub rent:                 Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferReceipt<'info> {
    #[account(
        mut,
        has_one = owner @ ReceiptError::Unauthorized,
    )]
    pub receipt: Account<'info, ReceiptAccount>,

    pub current_owner: Signer<'info>,

    /// CHECK: just storing the new owner's pubkey
    pub new_owner: UncheckedAccount<'info>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct ReceiptAccount {
    pub attestation:     Pubkey,  // 32
    pub owner:           Pubkey,  // 32
    pub mint:            Pubkey,  // 32
    pub commodity:       String,  // 4 + 32
    pub quantity_kg:     u64,     // 8
    pub grade:           String,  // 4 + 4
    pub warehouse_id:    String,  // 4 + 64
    pub is_encumbered:   bool,    // 1
    pub encumbrance_bps: u16,     // 2  (basis points, 0–10000)
    pub minted_at:       i64,     // 8
    pub expires_at:      i64,     // 8
    pub bump:            u8,      // 1
}

impl ReceiptAccount {
    pub const LEN: usize = 8
        + 32 + 32 + 32
        + (4 + 32)
        + 8
        + (4 + 4)
        + (4 + 64)
        + 1 + 2 + 8 + 8 + 1;
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct ReceiptMinted {
    pub receipt:     Pubkey,
    pub attestation: Pubkey,
    pub mint:        Pubkey,
    pub owner:       Pubkey,
    pub commodity:   String,
    pub quantity_kg: u64,
}

#[event]
pub struct ReceiptTransferred {
    pub receipt:   Pubkey,
    pub old_owner: Pubkey,
    pub new_owner: Pubkey,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum ReceiptError {
    #[msg("Attestation must be in Verified status before minting")]
    AttestationNotVerified,
    #[msg("Cannot mint a receipt for a disputed attestation")]
    AttestationDisputed,
    #[msg("Expiry must be in the future")]
    InvalidExpiry,
    #[msg("Receipt is currently encumbered and cannot be transferred")]
    ReceiptEncumbered,
    #[msg("Receipt has expired")]
    ReceiptExpired,
    #[msg("Signer is not the receipt owner")]
    Unauthorized,
}
