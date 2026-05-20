"use client";

import { useState, useEffect } from "react";
import { listFAQs } from "@/server/actions/commerce-actions";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listFAQs().then(setFaqs).catch(() => {});
  }, []);

  const filtered = search.trim()
    ? faqs.filter((f) =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  const grouped = {} as Record<string, any[]>;
  filtered.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  const toggle = (id: string) => setOpenItems({ ...openItems, [id]: !openItems[id] });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 text-center mb-8">Find answers to common questions about ShopEase</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3 capitalize">{category}</h2>
          <div className="space-y-2">
            {items.map((faq) => (
              <div key={faq.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openItems[faq.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openItems[faq.id] && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t bg-gray-50 p-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && search && (
        <div className="text-center py-8 text-gray-500">No results found for &ldquo;{search}&rdquo;</div>
      )}
    </div>
  );
}
