import { BrandingForm } from "@/components/admin/BrandingForm";

export default function AdminBrandingPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Branding &amp; Contact</h1>
      <p className="mt-1 text-sm text-muted">
        Site name, tagline, the contact email shown on the Contact and Disclaimer pages, and the footer&apos;s social links.
      </p>
      <div className="mt-6">
        <BrandingForm />
      </div>
    </div>
  );
}
