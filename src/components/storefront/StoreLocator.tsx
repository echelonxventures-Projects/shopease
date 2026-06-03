"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Phone, Clock, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock stores (in production, fetch from API)
const mockStores = [
  { id: "1", name: "ShopEase Dark Store - Delhi", address: "Connaught Place, New Delhi", distance: 0.5, rating: 4.8, hours: "24/7", phone: "+91 9876543210", lat: 28.63, lng: 77.22 },
  { id: "2", name: "ShopEase Hub - Mumbai", address: "Andheri West, Mumbai", distance: 1.2, rating: 4.6, hours: "8AM - 10PM", phone: "+91 9876543211", lat: 19.12, lng: 72.84 },
  { id: "3", name: "ShopEase Express - Bangalore", address: "Koramangala, Bangalore", distance: 2.0, rating: 4.7, hours: "24/7", phone: "+91 9876543212", lat: 12.93, lng: 77.62 },
];

export function StoreLocator() {
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState(mockStores);

  const handleSearch = () => {
    setStores(mockStores.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
    ));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MapPin className="w-7 h-7 text-blue-600" />
        Store Locator
      </h1>

      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores near you..."
            className="pl-10"
            aria-label="Search store locations"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="outline" onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              setStores(mockStores.map((s) => ({
                ...s,
                distance: parseFloat(Math.sqrt(
                  Math.pow(pos.coords.latitude - s.lat, 2) + Math.pow(pos.coords.longitude - s.lng, 2)
                ).toFixed(1)),
              })).sort((a, b) => a.distance - b.distance));
            });
          }
        }} aria-label="Use current location">
          <Navigation className="w-4 h-4 mr-2" />
          Near Me
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((store) => (
          <div key={store.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{store.name}</h3>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{store.rating}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {store.address}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {store.hours}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {store.phone}
              </p>
              <p className="flex items-center gap-2 text-green-600 font-medium">
                <Navigation className="w-4 h-4" />
                {store.distance} km away
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                <Navigation className="w-3.5 h-3.5 mr-1" />
                Directions
              </Button>
              <Link
                href={`tel:${store.phone}`}
                className="inline-flex items-center h-9 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                aria-label={`Call ${store.name}`}
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                Call
              </Link>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No stores found near &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
