"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfiles, createProfile, updateProfile, deleteProfile } from "@/server/actions/streaming-actions";

const AVATARS = ["🎬", "🎭", "🎪", "🎨", "🎵", "🎮", "🌟", "🦊", "🐱", "🦁", "🐻", "🐼"];

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  useEffect(() => { getProfiles().then(setProfiles); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProfile({ name: newName, isKids });
    setNewName(""); setIsKids(false); setShowCreate(false);
    setProfiles(await getProfiles());
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    setProfiles(await getProfiles());
  };

  const handleUpdate = async () => {
    if (!editingProfile) return;
    await updateProfile(editingProfile.id, { name: editingProfile.name, maturityRating: editingProfile.maturityRating, pin: editingProfile.pin });
    setEditingProfile(null);
    setProfiles(await getProfiles());
  };

  const selectProfile = (profile: any) => {
    if (editing) { setEditingProfile(profile); return; }
    localStorage.setItem("streaming_profile", JSON.stringify(profile));
    router.push("/streaming");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl text-white mb-8">Who&apos;s watching?</h1>
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {profiles.map((p) => (
            <button key={p.id} onClick={() => selectProfile(p)} className="group text-center">
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-md bg-gray-700 flex items-center justify-center text-4xl md:text-5xl border-2 ${editing ? "border-gray-400" : "border-transparent group-hover:border-white"} transition`}>
                {p.avatarUrl || AVATARS[profiles.indexOf(p) % AVATARS.length]}
              </div>
              <p className="text-gray-400 group-hover:text-white mt-2 text-sm">{p.name}</p>
              {p.isKids && <span className="text-xs text-blue-400">KIDS</span>}
              {editing && <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-xs text-red-500 block mt-1">Delete</button>}
            </button>
          ))}
          {profiles.length < 5 && (
            <button onClick={() => setShowCreate(true)} className="group text-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-md bg-gray-800 flex items-center justify-center text-4xl border-2 border-transparent group-hover:border-white transition">+</div>
              <p className="text-gray-400 group-hover:text-white mt-2 text-sm">Add Profile</p>
            </button>
          )}
        </div>
        <button onClick={() => setEditing(!editing)} className="border border-gray-500 text-gray-400 px-6 py-2 rounded hover:text-white hover:border-white text-sm">
          {editing ? "Done" : "Manage Profiles"}
        </button>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg w-80 space-y-4">
              <h2 className="text-xl text-white font-semibold">Add Profile</h2>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
              <label className="flex items-center gap-2 text-gray-300 text-sm">
                <input type="checkbox" checked={isKids} onChange={(e) => setIsKids(e.target.checked)} /> Kids Profile
              </label>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">Create</button>
                <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg w-80 space-y-4 text-left">
              <h2 className="text-xl text-white font-semibold">Edit Profile</h2>
              <input value={editingProfile.name} onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
              <div>
                <label className="text-sm text-gray-400">Maturity Rating</label>
                <select value={editingProfile.maturityRating} onChange={(e) => setEditingProfile({ ...editingProfile, maturityRating: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mt-1">
                  {["U", "U/A 7+", "U/A 13+", "U/A 16+", "A"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Profile Lock PIN (4 digits)</label>
                <input value={editingProfile.pin || ""} onChange={(e) => setEditingProfile({ ...editingProfile, pin: e.target.value.slice(0, 4) })} placeholder="Optional" maxLength={4} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mt-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">Save</button>
                <button onClick={() => setEditingProfile(null)} className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
