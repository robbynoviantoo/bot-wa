import { useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

interface User {
  id: number;
  name: string;
  phone: string;
  token: string;
}

export default function UserList({ users }: { users: User[] }) {
  const [filterText, setFilterText] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(filterText.toLowerCase()) ||
        user.phone.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [filterText, users]);

  const columns: TableColumn<User>[] = useMemo(
    () => [
      {
        name: "Nama",
        selector: (row) => row.name,
        sortable: true,
      },
      {
        name: "Nomor HP",
        selector: (row) => row.phone,
        sortable: true,
      },
      {
        name: "Token",
        selector: (row) => row.token,
        wrap: true,
      },
    ],
    []
  );

  return (
    <div className="mt-4 p-4 rounded-lg shadow-md text-black">
      {/* Search Box */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari pengguna..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      <DataTable
        title="Daftar Pengguna"
        columns={columns}
        data={filteredUsers}
        pagination
        responsive
        highlightOnHover
      />
    </div>
  );
}
