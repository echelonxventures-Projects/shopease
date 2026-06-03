"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getConfig, getConfigNumber } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

// itemId format: TYPE|label|unitPrice  (server-generated; price re-derived on booking)
function encodeId(type: string, label: string, price: number) {
  return `${type}|${label}|${price}`;
}

export async function searchFlights(from: string, to: string, date: string, passengers = 1) {
  const base = getConfigNumber(CONFIG_KEYS.TRAVEL_FLIGHT_BASE_FARE, 3500);
  const airlines = getConfig(CONFIG_KEYS.TRAVEL_AIRLINES, "IndiGo,Air India,SpiceJet,Vistara").split(",").map((s) => s.trim()).filter(Boolean);
  const slots = getConfig(CONFIG_KEYS.TRAVEL_FLIGHT_SLOTS, "06:00,09:15,14:00,19:30").split(",").map((s) => s.trim()).filter(Boolean);
  return airlines.flatMap((airline, ai) =>
    slots.map((dep, si) => {
      const unit = base + ai * 700 + si * 200;
      const label = `${airline} ${from}-${to} ${date} ${dep}`;
      return { id: encodeId("FLIGHT", label, unit), airline, from, to, date, departure: dep, stops: si % 3 === 0 ? 0 : 1, duration: `2h ${15 + si * 5}m`, price: unit * passengers, unitPrice: unit };
    })
  );
}

export async function searchTrains(from: string, to: string, date: string) {
  // config CSV: "Name:Class:Price,..."
  return getConfig(CONFIG_KEYS.TRAVEL_TRAINS, "Rajdhani Express:3AC:1800,Shatabdi Express:CC:1200,Duronto Express:SL:650")
    .split(",")
    .map((row) => {
      const [name, cls, price] = row.split(":").map((s) => s.trim());
      const p = Number(price) || 0;
      const label = `${name} ${cls} ${from}-${to} ${date}`;
      return { id: encodeId("TRAIN", label, p), name, class: cls, from, to, date, price: p };
    })
    .filter((t) => t.name);
}

export async function searchHotels(city: string, checkIn: string, checkOut: string, guests = 1) {
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) || 1);
  return getConfig(CONFIG_KEYS.TRAVEL_HOTELS, "Taj Hotel:8500,Marriott:7000,OYO Rooms:1500")
    .split(",")
    .map((row) => {
      const [name, price] = row.split(":").map((s) => s.trim());
      const perNight = Number(price) || 0;
      const total = perNight * nights * guests;
      const label = `${name} ${city} ${nights}n×${guests}`;
      return { id: encodeId("HOTEL", label, total), name, city, nights, perNight, price: total };
    })
    .filter((h) => h.name);
}

export async function bookTravel(itemId: string, passengers: { name: string; age: number }[]) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const [type, label, priceStr] = itemId.split("|");
  const unit = Number(priceStr);
  if (!type || !unit) throw new Error("Invalid travel item");
  // flights/trains are per-passenger; hotels already total
  const count = Math.max(1, passengers.length);
  const amount = type === "HOTEL" ? unit : unit * count;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient wallet balance");
  const before = Number(wallet.balance);
  const ref = `trv_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `Travel: ${label}`, referenceId: ref, balanceBefore: before, balanceAfter: before - amount },
  });

  const booking = await prisma.travelBooking.create({
    data: { userId, type, itemId, details: { label }, passengers, amount, status: "CONFIRMED" },
  });
  return { bookingId: booking.id, type, label, amount, status: booking.status };
}

export async function getMyTravelBookings() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.travelBooking.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}
