# VeridLayer

**Trust infrastructure for real-world commodity collateral on Solana.**

VeridLayer turns stranded inventory in African warehouses into verifiable on-chain collateral — enabling commodity owners to unlock institutional liquidity without selling their goods.

> Built for the Colosseum Frontier Hackathon.

---

## How It Works

```
Inspector → Attestation → Receipt Token → Lien Registry → Lending Pool
```

1. **Attest** — A staked inspector physically verifies warehouse inventory and submits a signed attestation on-chain.
2. **Mint** — A verified attestation unlocks an SPL receipt token representing the commodity (quantity, grade, warehouse).
3. **Borrow** — The receipt is pledged as collateral against a USDC lending pool, with a lien registered on-chain. Pyth price feeds determine the LTV.
4. **Repay / Liquidate** — On repayment the lien is released; underwater or overdue loans can be liquidated by anyone.

---

## Programs (Anchor / Solana)

| Program | Description |
|---|---|
| `attestation` | Inspector registration, staking, attestation submission & verification, dispute/slash |
| `receipt-mint` | Mint SPL receipt tokens from verified attestations via Metaplex metadata |
| `lien-registry` | Record and release encumbrances against receipt tokens |
| `lending-pool` | USDC liquidity pool with LTV-gated borrowing, interest accrual, and liquidation |

All programs are deployed to **Solana Devnet**.

---

## Stack

- **On-chain**: Anchor 0.30, Rust, Metaplex Token Metadata, Pyth price feeds
- **Frontend**: Next.js 15, Tailwind CSS, `@solana/wallet-adapter`
- **Backend / DB**: PostgreSQL, Prisma
- **Storage**: IPFS (inspection photos via web3.storage)

---

## Project Structure

```
veridlayer/
├── programs/
│   ├── attestation/
│   ├── receipt-mint/
│   ├── lien-registry/
│   └── lending-pool/
├── app/                  # Next.js frontend
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── inspector/
│   │   │   ├── warehouse/
│   │   │   └── lender/
│   ├── components/
│   │   └── landing/
│   └── prisma/
│       └── schema.prisma
├── Anchor.toml
└── Cargo.toml
```

---

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `0.30.1`
- Node.js 18+
- PostgreSQL

### 1. Build programs

```bash
anchor build
```

### 2. Set up the frontend

```bash
cd app
cp .env.local.example .env.local
# Fill in DATABASE_URL and NEXT_PUBLIC_RPC_URL
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy to devnet

```bash
solana config set --url devnet
anchor deploy
```

---

## Environment Variables

See `app/.env.local.example` for the full list. Key vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC endpoint (Helius recommended) |
| `WEB3_STORAGE_TOKEN` | IPFS upload token for inspection photos |

---

## License

MIT
