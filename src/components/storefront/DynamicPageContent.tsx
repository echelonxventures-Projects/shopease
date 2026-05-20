"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, ArrowRight, Loader2, Check } from "lucide-react";

interface DynamicPageContentProps {
  page: {
    title: string;
    subtitle?: string | null;
    heroContent?: string | null;
    sections?: any;
    formConfig?: any;
    faq?: any;
  };
  submitAction?: (data: Record<string, string>) => Promise<void>;
}

export function DynamicPageContent({ page, submitAction }: DynamicPageContentProps) {
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const sections = page.sections as any[];
  const formConfig = page.formConfig as any;
  const faq = page.faq as any[];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAction) return;
    setFormLoading(true);
    try {
      await submitAction(formValues);
      setFormSubmitted(true);
    } catch {
      // handled by parent
    } finally {
      setFormLoading(false);
    }
  };

  const renderField = (field: any) => {
    if (field.type === "textarea") {
      return (
        <Textarea
          value={formValues[field.name] || ""}
          onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
          placeholder={field.placeholder}
          className="mt-1 resize-none"
          rows={3}
        />
      );
    }
    if (field.type === "select") {
      return (
        <Select onValueChange={(v) => { if (v) setFormValues({ ...formValues, [field.name]: v }); }}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt: string) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        type={field.type}
        value={formValues[field.name] || ""}
        onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
        placeholder={field.placeholder}
        className="mt-1"
      />
    );
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{page.title}</h1>
            {page.subtitle && <p className="text-xl text-indigo-100 mb-4">{page.subtitle}</p>}
            {page.heroContent && <p className="text-indigo-100 max-w-2xl">{page.heroContent}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Sections */}
        {sections?.map((section: any, idx: number) => (
          <section key={idx}>
            <h2 className="text-2xl font-bold text-center mb-8">{section.title}</h2>

            {section.type === "stats" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {section.items?.map((item: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-6 text-center hover:shadow-lg transition-shadow">
                    <span className="text-3xl mb-3 block">{item.icon}</span>
                    <p className="text-2xl font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            )}

            {section.type === "features" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items?.map((item: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
                    <span className="text-2xl mb-3 block">{item.icon}</span>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )}

            {section.type === "steps" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.items?.map((item: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-6 relative">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-4">
                      {i + 1}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )}

            {section.type === "cta" && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">{section.title}</h3>
                {section.content && <p className="text-indigo-100 mb-4">{section.content}</p>}
                {section.link && (
                  <Link href={section.link} className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    {section.ctaText || "Get Started"} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </section>
        ))}

        {/* Form */}
        {formConfig && (
          <section className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border p-8">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
                  <p className="text-gray-500">Our team will review your application and get back to you within 5 business days.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-6">Apply Now</h2>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {formConfig.fields?.map((field: any) => (
                      <div key={field.name}>
                        <Label>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                    <Button type="submit" disabled={formLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Application
                    </Button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq && faq.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faq.map((item: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg border p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
