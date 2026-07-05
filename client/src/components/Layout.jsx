import { Link, useLocation } from "react-router-dom";
import { PenLine } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-serif font-bold tracking-tight hover:text-accent transition-colors"
        >
          inkwell<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm transition-colors ${
              isHome
                ? "text-ink font-medium"
                : "text-muted hover:text-ink"
            }`}
          >
            Posts
          </Link>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-paper rounded-full hover:bg-ink/80 transition-colors"
          >
            <PenLine size={14} />
            Write
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-muted">
        <span>© {new Date().getFullYear()} inkwell</span>
        <span>Built with MERN + Tailwind</span>
      </div>
    </footer>
  );
}
