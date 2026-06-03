"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Building, Users, Truck, CreditCard, ArrowRight } from "lucide-react";

export default function CorporateGiftingPage() {
  const [step, setStep] = useState<"browse" | "quote">("browse");
  const [form, setForm] = useState<{
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    numberOfCards: string;
    amountPerCard: string;
    occasion: string;
    message: string;
    customRequirements: string;
  }>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    numberOfCards: "",
    amountPerCard: "",
    occasion: "",
    message: "",
    customRequirements: "",
  });

  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Bulk Orders",
      description: "Send gift cards to hundreds of employees, customers, or partners at once.",
    },
    {
      icon: <Building className="w-8 h-8 text-green-600" />,
      title: "Custom Branding",
      description: "Add your company logo and personalized messages to each gift card.",
    },
    {
      icon: <Truck className="w-8 h-8 text-purple-600" />,
      title: "Scheduled Delivery",
      description: "Schedule deliveries for birthdays, holidays, or special occasions.",
    },
    {
      icon: <CreditCard className="w-8 h-8 text-orange-600" />,
      title: "Volume Discounts",
      description: "Get special pricing on bulk orders of 50+ gift cards.",
    },
  ];

  const occasions = [
    "Employee Recognition", "Holiday Gifts", "Birthday Celebrations",
    "New Joining", "Appreciation", "Farewell", "Client Gifting",
    "Event Prizes", "Customer Rewards", "Custom",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-10 h-10" />
              <h1 className="text-3xl font-bold">Amazon Gift Cards — Corporate Gifting</h1>
            </div>
            <p className="text-lg text-indigo-100 mb-6">
              Simplify gifting for your business. Send personalized gift cards at scale for any occasion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("quote")}
                className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                Get a Quote <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep("browse")}
                className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Browse Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose Corporate Gifting?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Perfect For</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { emoji: "👨‍💼", label: "Employee Rewards" },
            { emoji: "🎂", label: "Birthday Wishes" },
            { emoji: "🎄", label: "Holiday Gifts" },
            { emoji: "🤝", label: "Client Gifting" },
            { emoji: "🏆", label: "Awards & Recognition" },
            { emoji: "🎓", label: "Graduation Gifts" },
            { emoji: "🎊", label: "Event Prizes" },
            { emoji: "👋", label: "Farewell Cards" },
            { emoji: "❤️", label: "Appreciation" },
            { emoji: "🎁", label: "Customer Rewards" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg border p-4 text-center hover:shadow-md transition-shadow">
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-sm font-medium mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Form */}
      {step === "quote" && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold">Request a Quote</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Your Company"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Full Name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Number of Cards</Label>
                  <Input
                    type="number"
                    value={form.numberOfCards}
                    onChange={(e) => setForm({ ...form, numberOfCards: e.target.value })}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Amount Per Card (₹)</Label>
                  <Input
                    type="number"
                    value={form.amountPerCard}
                    onChange={(e) => setForm({ ...form, amountPerCard: e.target.value })}
                    placeholder="1000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Occasion</Label>
                <Select value={form.occasion} onValueChange={(v) => { if (v) setForm({ ...form, occasion: v }); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Message Template (optional)</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Dear {name}, We appreciate your hard work..."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label>Additional Requirements</Label>
                <Textarea
                  value={form.customRequirements}
                  onChange={(e) => setForm({ ...form, customRequirements: e.target.value })}
                  placeholder="Custom branding, specific delivery dates, etc."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                Submit Quote Request
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Our team will get back to you within 24 hours with a custom quote
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-indigo-50 border-t mt-12">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Gift className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Corporate Gifting?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of companies using Amazon Gift Cards for employee rewards, client appreciation, and more.
          </p>
          <button
            onClick={() => setStep("quote")}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
