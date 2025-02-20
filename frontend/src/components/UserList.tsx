import { useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

interface User {
  id: string;
  name: string;
  phone: string;
  token: string;
}

export default function UserList({ users, onEdit, onDelete }: { users: User[]; onEdit: (user: User) => void; onDelete: (id: string) => void; }) {
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
        name: "ID",
        selector: (row) => row.id,
        sortable: true,
      },
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
      {
        name: "Aksi",
        cell: (row) => (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(row)}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(row.id)}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Hapus
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
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
