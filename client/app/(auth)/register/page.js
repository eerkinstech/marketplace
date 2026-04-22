import { AuthForm } from "@/components/forms/AuthForm";

export const metadata = {
  title: "Register",
  description: "Create a customer or vendor marketplace account.",
  robots: {
    index: false,
    follow: false
  }
};

export default function RegisterPage() {
  return (
    <section className="container page-section" style={{ maxWidth: 640 }}>
      <div className="stack" style={{ marginBottom: 20 }}>
        <div className="kicker">Marketplace onboarding</div>
        <h1 className="page-title">Create a customer or vendor account</h1>
      </div>
      <AuthForm mode="register" />
    </section>
  );
}
