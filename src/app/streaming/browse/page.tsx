"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCollections, getRecommendations, getNotifications, markNotificationRead, markAllNotificationsRead, getDownloads, deleteDownload } from "@/server/actions/streaming-actions";

export default function BrowsePage() {
  const [tab, setTab] = useState<"browse" | "notifications" | "downloads">("browse");
  const [collections, setCollections] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);

  useEffect(() => {
    getCollections().then(setCollections);
    getRecommendations().then(setRecommendations);
    getNotifications().then(setNotifications);
    getDownloads().then(setDownloads);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800 pb-3">
          {(["browse", "notifications", "downloads"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`capitalize text-sm font-medium pb-1 ${tab === t ? "text-white border-b-2 border-red-600" : "text-gray-400 hover:text-white"}`}>
              {t} {t === "notifications" && notifications.filter((n) => !n.isRead).length > 0 && <span className="bg-red-600 text-xs px-1.5 rounded-full ml-1">{notifications.filter((n) => !n.isRead).length}</span>}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <div className="space-y-10">
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Recommended For You</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recommendations.map((item: any) => (
                    <Link key={item.id} href={`/streaming/watch/${item.id}`} className="flex-shrink-0 w-36 group">
                      <div className="aspect-[2/3] bg-gray-800 rounded overflow-hidden">
                        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center">{item.title}</div>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{item.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Collections */}
            {collections.map((col: any) => (
              <section key={col.id}>
                <h2 className="text-xl font-semibold mb-4">{col.title}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {col.items?.map((item: any) => (
                    <Link key={item.id} href={`/streaming/watch/${item.content?.id || item.contentId}`} className="flex-shrink-0 w-36 group">
                      <div className="aspect-[2/3] bg-gray-800 rounded overflow-hidden">
                        {item.content?.thumbnailUrl ? <img src={item.content.thumbnailUrl} alt={item.content.title} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center">{item.content?.title}</div>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{item.content?.title}</p>
                    </Link>
                  ))}
                  {(!col.items || col.items.length === 0) && <p className="text-sm text-gray-500">No items in this collection yet.</p>}
                </div>
              </section>
            ))}
            {collections.length === 0 && recommendations.length === 0 && <p className="text-gray-500 text-center py-10">Start watching to get personalized recommendations!</p>}
          </div>
        )}

        {tab === "notifications" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Notifications</h2>
              {notifications.some((n) => !n.isRead) && (
                <button onClick={async () => { await markAllNotificationsRead(); setNotifications(await getNotifications()); }} className="text-sm text-red-500 hover:text-red-400">Mark all read</button>
              )}
            </div>
            <div className="space-y-2">
              {notifications.map((n: any) => (
                <div key={n.id} onClick={async () => { if (!n.isRead) { await markNotificationRead(n.id); setNotifications(await getNotifications()); } }} className={`p-4 rounded-lg cursor-pointer ${n.isRead ? "bg-gray-900" : "bg-gray-800 border-l-4 border-red-600"}`}>
                  <div className="flex items-start gap-3">
                    {n.imageUrl && <img src={n.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-gray-500 text-center py-10">No notifications yet.</p>}
            </div>
          </div>
        )}

        {tab === "downloads" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Downloads</h2>
            <div className="space-y-3">
              {downloads.map((d: any) => (
                <div key={d.id} className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg">
                  <div className="w-20 h-12 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                    {d.content?.thumbnailUrl && <img src={d.content.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.content?.title}</p>
                    <p className="text-xs text-gray-400">{d.quality} • Expires {new Date(d.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={async () => { await deleteDownload(d.contentId); setDownloads(await getDownloads()); }} className="text-red-500 text-sm hover:text-red-400">Remove</button>
                </div>
              ))}
              {downloads.length === 0 && <p className="text-gray-500 text-center py-10">No downloads. Save content for offline viewing!</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
