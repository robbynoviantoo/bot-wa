"use client";

import { useEffect, useState } from "react";
import UserList from "@/components/UserList";
import UserForm from "@/components/UserForm";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users from backend...");
      const res = await fetch("http://localhost:3001/api/users");
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

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">📋 Daftar Pengguna</h1>
      <UserForm onUserAdded={fetchUsers} />
      <UserList users={users} />
    </main>
  );
}
