export default function UserList({ users }: { users: any[] }) {
  return (
    <table className="w-full mt-4 border-collapse ">
      <thead>
        <tr className="">
          <th className="border p-2">Nama</th>
          <th className="border p-2">Nomor HP</th>
          <th className="border p-2">Token</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border">
            <td className="border p-2">{user.name}</td>
            <td className="border p-2">{user.phone}</td>
            <td className="border p-2">{user.token}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}