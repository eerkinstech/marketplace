export function DataTable({ columns, rows }) {
  return (
    <div className="glass-card overflow-x-auto p-6">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-slate-500">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-left font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-b border-black/10 last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-3 align-top text-ink">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
