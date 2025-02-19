import Link from "next/link";

export default function Home() {
  return (
    <main className="container p-8">
      <h1 className="text-2xl font-bold">📋 WhatsApp Webhook Admin</h1>
      <p>Kelola daftar pengguna WhatsApp.</p>
      <Link href="/users">
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Lihat Pengguna
        </button>
      </Link>
    </main>
  );
}