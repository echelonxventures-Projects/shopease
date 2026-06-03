"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getConfig, getConfigNumber } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { initializeProviders } from "@/lib/providers";
import { getNowPlaying } from "@/lib/providers/content-metadata";

/** Real in-theatre movies from the configured content provider (TMDB now-playing). */
export async function getMovies(_city?: string) {
  initializeProviders();
  const region = getConfig(CONFIG_KEYS.MOVIES_REGION, "US");
  const movies = await getNowPlaying(region);
  return movies.map((m) => ({
    id: m.externalId,
    title: m.title,
    language: "—",
    genre: m.type,
    rating: m.rating ?? 0,
    poster: m.posterUrl || "",
  }));
}

function cinemas(): string[] {
  return getConfig(CONFIG_KEYS.MOVIES_CINEMAS, "PVR,INOX,Cinepolis").split(",").map((c) => c.trim()).filter(Boolean);
}
function showTimes(): string[] {
  return getConfig(CONFIG_KEYS.MOVIES_SHOW_TIMES, "10:30 AM,1:00 PM,6:30 PM,9:45 PM").split(",").map((t) => t.trim()).filter(Boolean);
}
function isEvening(time: string): boolean {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return false;
  let hour = Number(m[1]) % 12;
  if (/PM/i.test(m[3])) hour += 12;
  return hour >= 17; // evening premium from 5 PM
}

/** Showtime id encodes everything needed to reconstruct it: movie|cinemaIdx|date|timeIdx */
export async function getShowtimes(movieId: string, _city: string, date: string) {
  const base = getConfigNumber(CONFIG_KEYS.MOVIES_TICKET_PRICE, 250);
  const surcharge = getConfigNumber(CONFIG_KEYS.MOVIES_EVENING_SURCHARGE, 80);
  const capacity = getConfigNumber(CONFIG_KEYS.MOVIES_SEAT_CAPACITY, 60);
  const cs = cinemas();
  const ts = showTimes();

  const ids: string[] = [];
  cs.forEach((_, ci) => ts.forEach((_, ti) => ids.push(`${movieId}|${ci}|${date}|${ti}`)));
  const booked = await prisma.movieBooking.findMany({ where: { showtime: { in: ids } }, select: { showtime: true, seats: true } });
  const bookedCount = new Map<string, number>();
  for (const b of booked) bookedCount.set(b.showtime, (bookedCount.get(b.showtime) || 0) + b.seats.length);

  const shows: { id: string; cinema: string; time: string; price: number; seatsAvailable: number }[] = [];
  cs.forEach((cinema, ci) =>
    ts.forEach((time, ti) => {
      const id = `${movieId}|${ci}|${date}|${ti}`;
      shows.push({
        id,
        cinema,
        time,
        price: isEvening(time) ? base + surcharge : base,
        seatsAvailable: Math.max(0, capacity - (bookedCount.get(id) || 0)),
      });
    })
  );
  return shows;
}

export async function bookTickets(showtimeId: string, seats: string[], movieTitle: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  if (!seats.length) throw new Error("Select at least one seat");

  const [movieId, cinemaIdx, , timeIdx] = showtimeId.split("|");
  const cinema = cinemas()[Number(cinemaIdx)] || "Unknown";
  const time = showTimes()[Number(timeIdx)] || "—";
  const base = getConfigNumber(CONFIG_KEYS.MOVIES_TICKET_PRICE, 250);
  const surcharge = getConfigNumber(CONFIG_KEYS.MOVIES_EVENING_SURCHARGE, 80);
  const pricePerSeat = isEvening(time) ? base + surcharge : base;
  const amount = pricePerSeat * seats.length;

  // prevent double-booking the same seats for this showtime
  const existing = await prisma.movieBooking.findMany({ where: { showtime: showtimeId }, select: { seats: true } });
  const taken = new Set(existing.flatMap((e) => e.seats));
  const clash = seats.filter((s) => taken.has(s));
  if (clash.length) throw new Error(`Seats already booked: ${clash.join(", ")}`);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient wallet balance");
  const before = Number(wallet.balance);
  const ref = `tkt_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `Movie: ${movieTitle} (${seats.length} seats)`, referenceId: ref, balanceBefore: before, balanceAfter: before - amount },
  });

  const booking = await prisma.movieBooking.create({
    data: { userId, movieId, movieTitle, cinema, showtime: showtimeId, seats, amount, status: "CONFIRMED", qrCode: ref },
  });
  return { bookingId: booking.id, showtimeId, cinema, time, seats, amount, status: booking.status, qrCode: ref };
}

export async function getMyBookings() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.movieBooking.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}
