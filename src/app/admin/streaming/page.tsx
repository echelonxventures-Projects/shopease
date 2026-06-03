"use client";

import { useEffect, useState } from "react";
import {
  getStreamingConfig, updateStreamingConfig,
  getStreamingPlans, createStreamingPlan, updateStreamingPlan, deleteStreamingPlan,
  getStreamingContent, createStreamingContent, deleteStreamingContent,
  getCollections, createCollection, addToCollection, removeFromCollection, deleteCollection,
  sendNotification,
} from "@/server/actions/streaming-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StreamingAdminPage() {
  const [tab, setTab] = useState<"config" | "plans" | "content" | "collections" | "notifications">("config");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStreamingConfig(), getStreamingPlans(false), getStreamingContent(), getCollections()])
      .then(([c, p, ct, col]) => { setConfig(c); setPlans(p); setContent(ct.items); setCollections(col); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Streaming Service Configuration</h1>

      <div className="flex gap-2">
        {(["config", "plans", "content", "collections", "notifications"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t === "config" ? "Settings" : t === "plans" ? "Plans" : t === "content" ? "Content" : t === "collections" ? "Collections" : "Notifications"}
          </Button>
        ))}
      </div>

      {tab === "config" && <ConfigTab config={config} onUpdate={setConfig} />}
      {tab === "plans" && <PlansTab plans={plans} onUpdate={setPlans} />}
      {tab === "content" && <ContentTab content={content} onUpdate={setContent} />}
      {tab === "collections" && <CollectionsTab collections={collections} content={content} onUpdate={setCollections} />}
      {tab === "notifications" && <NotificationsTab />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConfigTab({ config, onUpdate }: { config: any; onUpdate: (c: any) => void }) {
  const [form, setForm] = useState(config || {});

  const save = async () => {
    try {
      const updated = await updateStreamingConfig(form);
      onUpdate(updated);
      toast.success("Configuration saved");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-4">
        <Label>Enabled</Label>
        <input type="checkbox" checked={form.enabled || false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
      </div>
      <div><Label>Brand Name</Label><Input value={form.brandName || ""} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
      <div><Label>Tagline</Label><Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
      <div><Label>Logo URL</Label><Input value={form.logoUrl || ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></div>
      <div><Label>Hero Image URL</Label><Input value={form.heroImageUrl || ""} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Max Concurrent Streams</Label><Input type="number" value={form.maxConcurrentStreams || 1} onChange={(e) => setForm({ ...form, maxConcurrentStreams: +e.target.value })} /></div>
        <div><Label>Trial Days</Label><Input type="number" value={form.trialDays || 7} onChange={(e) => setForm({ ...form, trialDays: +e.target.value })} /></div>
        <div><Label>Max Downloads</Label><Input type="number" value={form.maxDownloads || 10} onChange={(e) => setForm({ ...form, maxDownloads: +e.target.value })} /></div>
        <div><Label>Offline Viewing Days</Label><Input type="number" value={form.offlineViewingDays || 30} onChange={(e) => setForm({ ...form, offlineViewingDays: +e.target.value })} /></div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[
          { key: "downloadEnabled", label: "Downloads" },
          { key: "adSupportedTier", label: "Ad-Supported Tier" },
          { key: "parentalControlEnabled", label: "Parental Controls" },
          { key: "autoPlayNext", label: "Auto-Play Next" },
          { key: "skipIntroEnabled", label: "Skip Intro" },
          { key: "watchPartyEnabled", label: "Watch Party" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
            {label}
          </label>
        ))}
      </div>
      <Button onClick={save}>Save Configuration</Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlansTab({ plans, onUpdate }: { plans: any[]; onUpdate: (p: any[]) => void }) {
  const [form, setForm] = useState({ name: "", price: 0, interval: "MONTHLY", maxStreams: 1, maxProfiles: 1, quality: "HD", downloadAllowed: false, adsEnabled: false, trialDays: 0, features: "" });
  const [options, setOptions] = useState<{ key: string; value: string }[]>([]);

  const addOption = () => setOptions([...options, { key: "", value: "" }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, field: "key" | "value", val: string) => {
    const updated = [...options];
    updated[i][field] = val;
    setOptions(updated);
  };

  const add = async () => {
    try {
      const optionsObj = options.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value.trim();
        return acc;
      }, {} as Record<string, string>);
      const plan = await createStreamingPlan({
        ...form,
        features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
        options: Object.keys(optionsObj).length > 0 ? optionsObj : undefined,
      });
      onUpdate([...plans, plan]);
      setForm({ name: "", price: 0, interval: "MONTHLY", maxStreams: 1, maxProfiles: 1, quality: "HD", downloadAllowed: false, adsEnabled: false, trialDays: 0, features: "" });
      setOptions([]);
      toast.success("Plan created");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    await deleteStreamingPlan(id);
    onUpdate(plans.filter((p) => p.id !== id));
    toast.success("Plan deactivated");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
        <div><Label>Interval</Label>
          <select className="w-full border rounded p-2" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
            <option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="YEARLY">Yearly</option>
          </select>
        </div>
        <div><Label>Quality</Label>
          <select className="w-full border rounded p-2" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
            <option value="SD">SD</option><option value="HD">HD</option><option value="FULL_HD">Full HD</option><option value="UHD_4K">4K</option>
          </select>
        </div>
        <div><Label>Max Streams</Label><Input type="number" value={form.maxStreams} onChange={(e) => setForm({ ...form, maxStreams: +e.target.value })} /></div>
        <div><Label>Max Profiles</Label><Input type="number" value={form.maxProfiles} onChange={(e) => setForm({ ...form, maxProfiles: +e.target.value })} /></div>
        <div><Label>Trial Days</Label><Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: +e.target.value })} /></div>
        <div><Label>Features (comma-sep)</Label><Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.downloadAllowed} onChange={(e) => setForm({ ...form, downloadAllowed: e.target.checked })} />Downloads</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.adsEnabled} onChange={(e) => setForm({ ...form, adsEnabled: e.target.checked })} />Ads</label>
      </div>

      {/* Dynamic Options */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Custom Options</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>+ Add Option</Button>
        </div>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Key (e.g. HDR, Spatial Audio)" value={opt.key} onChange={(e) => updateOption(i, "key", e.target.value)} className="flex-1" />
            <Input placeholder="Value (e.g. Dolby Vision, true)" value={opt.value} onChange={(e) => updateOption(i, "value", e.target.value)} className="flex-1" />
            <Button type="button" variant="destructive" size="sm" onClick={() => removeOption(i)}>×</Button>
          </div>
        ))}
      </div>

      <Button onClick={add}>Add Plan</Button>

      <div className="grid gap-3 mt-4">
        {plans.map((p) => (
          <div key={p.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <span className="font-semibold">{p.name}</span>
              <Badge className="ml-2" variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
              <span className="ml-3 text-sm text-muted-foreground">₹{Number(p.price)}/{p.interval} • {p.quality} • {p.maxStreams} streams</span>
              {p.options && Object.keys(p.options).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(p.options as Record<string, string>).map(([k, v]) => (
                    <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Button variant="destructive" size="sm" onClick={() => remove(p.id)}>Deactivate</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContentTab({ content, onUpdate }: { content: any[]; onUpdate: (c: any[]) => void }) {
  const [form, setForm] = useState({ title: "", type: "MOVIE", description: "", thumbnailUrl: "", videoUrl: "", duration: 0, language: "en", genres: "", cast: "", director: "" });

  const add = async () => {
    try {
      const item = await createStreamingContent({
        ...form,
        genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
        cast: form.cast.split(",").map((c) => c.trim()).filter(Boolean),
        duration: form.duration || undefined,
      });
      onUpdate([item, ...content]);
      setForm({ title: "", type: "MOVIE", description: "", thumbnailUrl: "", videoUrl: "", duration: 0, language: "en", genres: "", cast: "", director: "" });
      toast.success("Content added");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    await deleteStreamingContent(id);
    onUpdate(content.filter((c) => c.id !== id));
    toast.success("Content removed");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Type</Label>
          <select className="w-full border rounded p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["MOVIE", "SERIES", "EPISODE", "DOCUMENTARY", "SHORT", "LIVE", "MUSIC_VIDEO", "PODCAST"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
        <div><Label>Thumbnail URL</Label><Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} /></div>
        <div><Label>Video URL</Label><Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} /></div>
        <div><Label>Duration (sec)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} /></div>
        <div><Label>Genres (comma-sep)</Label><Input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} /></div>
        <div><Label>Cast (comma-sep)</Label><Input value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} /></div>
        <div><Label>Director</Label><Input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} /></div>
      </div>
      <div><Label>Description</Label><textarea className="w-full border rounded p-2 h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <Button onClick={add}>Add Content</Button>

      <div className="grid gap-2 mt-4">
        {content.map((c) => (
          <div key={c.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="font-semibold">{c.title}</span>
              <Badge className="ml-2">{c.type}</Badge>
              <span className="ml-2 text-sm text-muted-foreground">{c.language} • {c.genres?.join(", ")}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={() => remove(c.id)}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CollectionsTab({ collections, content, onUpdate }: { collections: any[]; content: any[]; onUpdate: (c: any[]) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("MANUAL");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createCollection({ title, type });
    setTitle("");
    onUpdate(await getCollections());
    toast.success("Collection created");
  };

  const handleAdd = async (collectionId: string) => {
    if (!selectedContent) return;
    await addToCollection(collectionId, selectedContent);
    setSelectedContent(""); setAddingTo(null);
    onUpdate(await getCollections());
    toast.success("Added to collection");
  };

  const handleRemoveItem = async (collectionId: string, contentId: string) => {
    await removeFromCollection(collectionId, contentId);
    onUpdate(await getCollections());
  };

  const handleDelete = async (id: string) => {
    await deleteCollection(id);
    onUpdate(await getCollections());
    toast.success("Collection removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1"><Label>Collection Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Type</Label>
          <select className="border rounded p-2" value={type} onChange={(e) => setType(e.target.value)}>
            {["MANUAL", "TRENDING", "TOP_10", "NEW_RELEASES", "GENRE"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Button onClick={handleCreate}>Create</Button>
      </div>
      <div className="space-y-3">
        {collections.map((col) => (
          <div key={col.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <div><span className="font-semibold">{col.title}</span> <Badge className="ml-2">{col.type}</Badge></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAddingTo(addingTo === col.id ? null : col.id)}>+ Add Content</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(col.id)}>Delete</Button>
              </div>
            </div>
            {addingTo === col.id && (
              <div className="flex gap-2 mb-2">
                <select className="flex-1 border rounded p-2 text-sm" value={selectedContent} onChange={(e) => setSelectedContent(e.target.value)}>
                  <option value="">Select content...</option>
                  {content.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <Button size="sm" onClick={() => handleAdd(col.id)}>Add</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {col.items?.map((item: any) => (
                <span key={item.id} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
                  {item.content?.title} <button onClick={() => handleRemoveItem(col.id, item.contentId)} className="text-red-500 hover:text-red-700">×</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [type, setType] = useState("NEW_RELEASE");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    await sendNotification({ type, title, message, imageUrl: imageUrl || undefined });
    setTitle(""); setMessage(""); setImageUrl("");
    toast.success("Notification sent to all subscribers");
  };

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">Send a notification to all active subscribers.</p>
      <div><Label>Type</Label>
        <select className="w-full border rounded p-2" value={type} onChange={(e) => setType(e.target.value)}>
          {["NEW_RELEASE", "RECOMMENDATION", "SUBSCRIPTION", "REMINDER"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><Label>Message</Label><textarea className="w-full border rounded p-2 h-20" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <div><Label>Image URL (optional)</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></div>
      <Button onClick={handleSend}>Send to All Subscribers</Button>
    </div>
  );
}
