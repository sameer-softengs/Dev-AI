import { History, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';

function AuthHero() {
  return (
    <section className="auth-panel brand-panel">
      <div className="eyebrow">
        <Sparkles size={16} />
        <span>AI Service Workspace</span>
      </div>
      <h1>Build faster with one place for chat, images, and delivery history.</h1>
      <p>
        Secure sign-in, a working dashboard, and account-level daily image
        limits are wired together so the product behaves like a real system.
      </p>

      <div className="feature-grid">
        <article>
          <LayoutDashboard size={18} />
          <strong>Focused dashboard</strong>
          <span>See activity, recent output, and quota status at a glance.</span>
        </article>
        <article>
          <History size={18} />
          <strong>Persistent history</strong>
          <span>Every chat and image request is stored per account.</span>
        </article>
        <article>
          <ShieldCheck size={18} />
          <strong>Protected generation</strong>
          <span>Image creation is capped at 4 per day for each account.</span>
        </article>
      </div>
    </section>
  );
}

export default AuthHero;
