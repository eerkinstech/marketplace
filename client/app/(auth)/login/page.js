import { AuthForm } from "@/components/forms/AuthForm";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <section className="container page-section" style={{ maxWidth: 560 }}>
      <div className="stack" style={{ marginBottom: 20 }}>
        <div className="kicker">Secure access</div>
        <h1 className="page-title">Sign in to your marketplace account</h1>
      </div>
      <AuthForm mode="login" />
    </section>
  );
}
