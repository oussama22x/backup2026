import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-2">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="VettedAI"
              className="h-3.5 w-3.5"
              style={{
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(234deg) brightness(104%) contrast(97%)'
              }}
            />
            <span className="text-xs font-semibold">
              <span className="text-primary">VettedAI</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <a
              href="mailto:support@vettedai.app"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

