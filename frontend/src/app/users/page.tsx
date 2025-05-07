"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserList from "@/components/UserList";
import UserForm from "@/components/UserForm";
import Swal from "sweetalert2";


interface User {
  id: string; // Gunakan _id dari MongoDB
  name: string;
  phone: string;
  token: string;
}


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users from backend...");
      const res = await fetch("http://webhook_backend:3001/api/users");
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Users fetched:", data);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEditUser = (user: User) => {
    router.push(`/users/edit/${user.id}`); // Pindah ke halaman edit
  };

  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data pengguna akan dihapus secara permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
  
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3001/api/users/${id}`, {
          method: "DELETE",
        });
  
        if (!res.ok) {
          throw new Error("Failed to delete user");
        }
  
        Swal.fire("Dihapus!", "User telah dihapus.", "success");
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus user.", "error");
      }
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">📋 Daftar Pengguna</h1>
      <UserForm onUserAdded={fetchUsers} />
      <UserList users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} />
    </main>
  );
}
