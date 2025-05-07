"use client";

import { useState } from "react";

export default function UserForm({ onUserAdded }: { onUserAdded: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://10.20.10.106:3001/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, token }),
      });
      onUserAdded();
      setName("");
      setPhone("");
      setToken("");
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded">
      <input
        type="text"
        placeholder="Nama"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 m-2 text-black"
        required
      />
      <input
        type="text"
        placeholder="Nomor HP"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border p-2 m-2 text-black"
        required
      />
      <input
        type="text"
        placeholder="Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="border p-2 m-2 text-black"
        required
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2">
        Tambah
      </button>
    </form>
  );
}
