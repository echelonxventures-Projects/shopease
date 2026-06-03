import { getOpenRFQs } from "@/server/actions/rfq-actions";

export const dynamic = "force-dynamic";

export default async function AdminRFQPage() {
  const rfqs = await getOpenRFQs().catch(() => []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">RFQ Management</h1>
      <p className="text-sm text-gray-500 mb-6">Open B2B requests for quotation.</p>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Responses</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No open RFQs.</td></tr>
            ) : (
              rfqs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3">{r.business?.name || "—"}</td>
                  <td className="px-4 py-3">{r.category || "—"}</td>
                  <td className="px-4 py-3">{r._count?.items ?? 0}</td>
                  <td className="px-4 py-3">{r._count?.responses ?? 0}</td>
                  <td className="px-4 py-3">{r.priority}</td>
                  <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
