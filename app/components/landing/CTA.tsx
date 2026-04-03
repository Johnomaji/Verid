import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-[120px]">
      <div className="max-w-[900px] mx-auto px-6 text-center">
        <p className="section-label justify-center flex">Get Involved</p>
        <h2 className="section-title mx-auto">
          Join the Trust Layer for African Commodities
        </h2>
        <p className="text-[1.05rem] text-white/60 max-w-[600px] mx-auto leading-[1.7] mb-10">
          Whether you&apos;re a warehouse operator, institutional lender, inspection firm, or Solana
          developer — we want to hear from you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/warehouse" className="btn-primary">
            Start as Operator
          </Link>
          <Link href="/dashboard/lender" className="btn-secondary">
            Explore Lending
          </Link>
        </div>
      </div>
    </section>
  );
}
