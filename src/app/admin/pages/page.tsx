import { getAllPageContents } from "@/server/actions/page-content-actions";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await getAllPageContents().catch(() => []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Page Content</h1>
      <p className="text-sm text-gray-500 mb-6">CMS landing pages and their sections.</p>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sections</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No page content yet.</td></tr>
            ) : (
              pages.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{p.slug}</td>
                  <td className="px-4 py-3">{p.title || "—"}</td>
                  <td className="px-4 py-3">{Array.isArray(p.sections) ? p.sections.length : 0}</td>
                  <td className="px-4 py-3">{p.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={p.isActive ? "text-green-600" : "text-gray-400"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
