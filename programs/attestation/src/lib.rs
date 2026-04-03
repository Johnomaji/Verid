use anchor_lang::prelude::*;

declare_id!("Atst111111111111111111111111111111111111111");

// ─── Constants ────────────────────────────────────────────────────────────────

pub const ATTESTATION_SEED:   &[u8] = b"attestation";
pub const INSPECTOR_SEED:     &[u8] = b"inspector";
pub const MIN_STAKE_LAMPORTS: u64   = 1_000_000_000; // 1 SOL min stake
pub const MAX_COMMODITY_LEN:  usize = 32;
pub const MAX_GRADE_LEN:      usize = 4;
pub const MAX_IPFS_CID_LEN:   usize = 64;
pub const MAX_WAREHOUSE_LEN:  usize = 64;

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod attestation {
    use super::*;

    /// Register a new inspector and stake SOL as reputation collateral.
    pub fn register_inspector(
        ctx: Context<RegisterInspector>,
        cert_number: String,
        region: String,
    ) -> Result<()> {
        require!(cert_number.len() <= 32, AttestationError::StringTooLong);
        require!(region.len() <= 32, AttestationError::StringTooLong);

        let inspector = &mut ctx.accounts.inspector;
        inspector.authority    = ctx.accounts.authority.key();
        inspector.cert_number  = cert_number;
        inspector.region       = region;
        inspector.staked_lamports = ctx.accounts.authority.lamports();
        inspector.slash_count  = 0;
        inspector.is_active    = true;
        inspector.bump         = ctx.bumps.inspector;

        // Transfer stake into the inspector PDA
        let stake_amount = MIN_STAKE_LAMPORTS;
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to:   inspector.to_account_info(),
                },
            ),
            stake_amount,
        )?;
        inspector.staked_lamports = stake_amount;

        emit!(InspectorRegistered {
            inspector: inspector.key(),
            authority: inspector.authority,
            cert_number: inspector.cert_number.clone(),
        });

        Ok(())
    }

    /// Submit an attestation for a warehouse inventory.
    pub fn submit_attestation(
        ctx: Context<SubmitAttestation>,
        params: AttestationParams,
    ) -> Result<()> {
        let inspector = &ctx.accounts.inspector;
        require!(inspector.is_active, AttestationError::InspectorNotActive);
        require!(
            params.commodity.len() <= MAX_COMMODITY_LEN,
            AttestationError::StringTooLong
        );
        require!(
            params.grade.len() <= MAX_GRADE_LEN,
            AttestationError::StringTooLong
        );
        require!(
            params.photo_ipfs_hash.len() <= MAX_IPFS_CID_LEN,
            AttestationError::StringTooLong
        );
        require!(
            params.warehouse_id.len() <= MAX_WAREHOUSE_LEN,
            AttestationError::StringTooLong
        );
        require!(params.quantity_kg > 0, AttestationError::InvalidQuantity);

        let att = &mut ctx.accounts.attestation;
        att.inspector      = ctx.accounts.inspector.key();
        att.warehouse_id   = params.warehouse_id.clone();
        att.commodity      = params.commodity.clone();
        att.quantity_kg    = params.quantity_kg;
        att.grade          = params.grade.clone();
        att.gps_lat        = params.gps_lat;
        att.gps_lng        = params.gps_lng;
        att.photo_ipfs_hash = params.photo_ipfs_hash.clone();
        att.status         = AttestationStatus::Pending;
        att.is_disputed    = false;
        att.submitted_at   = Clock::get()?.unix_timestamp;
        att.verified_at    = None;
        att.bump           = ctx.bumps.attestation;

        emit!(AttestationSubmitted {
            attestation:  att.key(),
            inspector:    att.inspector,
            warehouse_id: att.warehouse_id.clone(),
            commodity:    att.commodity.clone(),
            quantity_kg:  att.quantity_kg,
        });

        Ok(())
    }

    /// Protocol admin verifies an attestation (in production: multi-sig or DAO).
    pub fn verify_attestation(ctx: Context<AdminAction>) -> Result<()> {
        let att = &mut ctx.accounts.attestation;
        require!(
            att.status == AttestationStatus::Pending,
            AttestationError::InvalidStatus
        );
        att.status      = AttestationStatus::Verified;
        att.verified_at = Some(Clock::get()?.unix_timestamp);

        emit!(AttestationVerified {
            attestation: att.key(),
            verified_at: att.verified_at.unwrap(),
        });

        Ok(())
    }

    /// Raise a dispute on an attestation. Marks for slashing review.
    pub fn dispute_attestation(ctx: Context<AdminAction>) -> Result<()> {
        let att = &mut ctx.accounts.attestation;
        require!(
            att.status == AttestationStatus::Verified
                || att.status == AttestationStatus::Pending,
            AttestationError::InvalidStatus
        );
        att.is_disputed = true;
        att.status      = AttestationStatus::Disputed;

        emit!(AttestationDisputed { attestation: att.key() });

        Ok(())
    }

    /// Slash inspector stake on confirmed fraud. Burns the slashed SOL.
    pub fn slash_inspector(
        ctx: Context<SlashInspector>,
        slash_bps: u16, // basis points, e.g. 1000 = 10%
    ) -> Result<()> {
        require!(slash_bps <= 10_000, AttestationError::InvalidSlashAmount);

        let inspector = &mut ctx.accounts.inspector;
        let slash_amount = (inspector.staked_lamports as u128)
            .checked_mul(slash_bps as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap() as u64;

        inspector.staked_lamports = inspector
            .staked_lamports
            .checked_sub(slash_amount)
            .ok_or(AttestationError::InsufficientStake)?;
        inspector.slash_count += 1;
        if inspector.slash_count >= 3 {
            inspector.is_active = false;
        }

        // Burn by transferring to the zero address (system program with 0 data)
        // In production: send to a protocol treasury
        **inspector.to_account_info().try_borrow_mut_lamports()? -= slash_amount;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += slash_amount;

        emit!(InspectorSlashed {
            inspector:    inspector.key(),
            slash_amount,
            slash_count:  inspector.slash_count,
        });

        Ok(())
    }
}

// ─── Params ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AttestationParams {
    pub warehouse_id:    String,
    pub commodity:       String,   // "cocoa" | "sesame" | "grain" | "coffee"
    pub quantity_kg:     u64,
    pub grade:           String,   // "A" | "B" | "C"
    pub gps_lat:         i64,      // scaled ×10^6, e.g. 6524400 = 6.5244°N
    pub gps_lng:         i64,      // scaled ×10^6
    pub photo_ipfs_hash: String,   // IPFS CID of inspection photos
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(cert_number: String, region: String)]
pub struct RegisterInspector<'info> {
    #[account(
        init,
        payer  = authority,
        space  = InspectorAccount::LEN,
        seeds  = [INSPECTOR_SEED, authority.key().as_ref()],
        bump,
    )]
    pub inspector: Account<'info, InspectorAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(params: AttestationParams)]
pub struct SubmitAttestation<'info> {
    #[account(
        init,
        payer = authority,
        space = AttestationAccount::LEN,
        seeds = [
            ATTESTATION_SEED,
            inspector.key().as_ref(),
            &Clock::get().unwrap().unix_timestamp.to_le_bytes(),
        ],
        bump,
    )]
    pub attestation: Account<'info, AttestationAccount>,

    #[account(
        seeds = [INSPECTOR_SEED, authority.key().as_ref()],
        bump  = inspector.bump,
        has_one = authority,
    )]
    pub inspector: Account<'info, InspectorAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut)]
    pub attestation: Account<'info, AttestationAccount>,

    /// Protocol admin — in production replace with a multisig PDA
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SlashInspector<'info> {
    #[account(mut)]
    pub inspector: Account<'info, InspectorAccount>,

    /// CHECK: treasury receives slashed SOL — validate address in production
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct InspectorAccount {
    pub authority:        Pubkey,  // 32
    pub cert_number:      String,  // 4 + 32
    pub region:           String,  // 4 + 32
    pub staked_lamports:  u64,     // 8
    pub slash_count:      u8,      // 1
    pub is_active:        bool,    // 1
    pub bump:             u8,      // 1
}

impl InspectorAccount {
    pub const LEN: usize = 8     // discriminator
        + 32                     // authority
        + (4 + 32)               // cert_number
        + (4 + 32)               // region
        + 8                      // staked_lamports
        + 1                      // slash_count
        + 1                      // is_active
        + 1;                     // bump
}

#[account]
pub struct AttestationAccount {
    pub inspector:        Pubkey,          // 32
    pub warehouse_id:     String,          // 4 + 64
    pub commodity:        String,          // 4 + 32
    pub quantity_kg:      u64,             // 8
    pub grade:            String,          // 4 + 4
    pub gps_lat:          i64,             // 8
    pub gps_lng:          i64,             // 8
    pub photo_ipfs_hash:  String,          // 4 + 64
    pub status:           AttestationStatus, // 1 + 1
    pub is_disputed:      bool,            // 1
    pub submitted_at:     i64,             // 8
    pub verified_at:      Option<i64>,     // 1 + 8
    pub bump:             u8,              // 1
}

impl AttestationAccount {
    pub const LEN: usize = 8
        + 32
        + (4 + 64)
        + (4 + 32)
        + 8
        + (4 + 4)
        + 8
        + 8
        + (4 + 64)
        + 2
        + 1
        + 8
        + 9
        + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AttestationStatus {
    Pending,
    Verified,
    Disputed,
    Rejected,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct InspectorRegistered {
    pub inspector:   Pubkey,
    pub authority:   Pubkey,
    pub cert_number: String,
}

#[event]
pub struct AttestationSubmitted {
    pub attestation:  Pubkey,
    pub inspector:    Pubkey,
    pub warehouse_id: String,
    pub commodity:    String,
    pub quantity_kg:  u64,
}

#[event]
pub struct AttestationVerified {
    pub attestation: Pubkey,
    pub verified_at: i64,
}

#[event]
pub struct AttestationDisputed {
    pub attestation: Pubkey,
}

#[event]
pub struct InspectorSlashed {
    pub inspector:    Pubkey,
    pub slash_amount: u64,
    pub slash_count:  u8,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum AttestationError {
    #[msg("Inspector is not active")]
    InspectorNotActive,
    #[msg("Attestation is not in the required status")]
    InvalidStatus,
    #[msg("Quantity must be greater than zero")]
    InvalidQuantity,
    #[msg("String field exceeds maximum length")]
    StringTooLong,
    #[msg("Slash amount exceeds 100%")]
    InvalidSlashAmount,
    #[msg("Inspector has insufficient staked balance")]
    InsufficientStake,
}
