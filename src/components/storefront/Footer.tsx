"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFooterLinks } from "@/server/actions/site-actions";

const isExternal = (href: string) => href.startsWith("http://") || href.startsWith("https://");

// Define section display order
const SECTION_ORDER = [
  "Make Money with Us",
  "Let Us Help You",
  "About ShopEase",
  "Programs",
  "Connect With Us",
  "Legal",
];

export function Footer() {
  const [sections, setSections] = useState<Record<string, Array<{ label: string; href: string; icon?: string | null }>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFooterLinks()
      .then(setSections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sort sections by defined order
  const sortedSections = Object.entries(sections).sort(([a], [b]) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  if (loading) {
    return (
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse h-32 bg-gray-800 rounded" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {sortedSections.map(([sectionName, links]) => (
          <div key={sectionName}>
            <h4 className="text-white font-semibold mb-3">{sectionName}</h4>
            <ul className="space-y-2 text-sm">
              {links.map((link) =>
                isExternal(link.href) ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {link.icon && <span className="mr-1">{link.icon}</span>}
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.icon && <span className="mr-1">{link.icon}</span>}
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm">
        © {new Date().getFullYear()} ShopEase. All rights reserved.
      </div>
    </footer>
  );
}
