import Link from "next/link";

export default async function Home() {

  return (
    <div className="mt-10">
      {/* link para /dashboard */}
      <Link href="/admin/dashboard">Dashboard</Link>
      <Link href="/admin/gestao">Gestao</Link>
    </div>
  );
}
