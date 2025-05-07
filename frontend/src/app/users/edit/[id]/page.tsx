"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PulseLoader } from "react-spinners"; 

interface User {
  id: string;
  name: string;
  phone: string;
  token: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true); // State untuk loading

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://webhook_backend:3001/api/users/${id}`);
      if (!res.ok) throw new Error("User not found");

      const responseData = await res.json();
      const data: User = responseData.data;

      setUser(data);
      setName(data.name);
      setPhone(data.phone);
      setToken(data.token);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://webhook_backend:3001/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, token }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      console.log("User updated successfully");
      router.push("/users");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <PulseLoader color="#3498db" size={15} />
        <p className="text-gray-500 mt-4 text-lg">Loading data user...</p>
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">✏️ Edit Pengguna</h1>
      <div className="mt-4">
        <label className="block text-gray-700">Nama</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-md mb-3"
        />

        <label className="block text-gray-700">Nomor HP</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded-md mb-3"
        />

        <label className="block text-gray-700">Token</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full p-2 border rounded-md mb-3"
          disabled
        />

        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Simpan Perubahan
        </button>
        <button
          onClick={() => router.push("/users")}
          className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Batal
        </button>
      </div>
    </main>
  );
}
