import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LandingNavbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-primary/10"
          : "bg-gradient-to-b from-white via-primary-subtle/30 to-white border-primary/20"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/favicon.png" 
              alt="VettedAI" 
              className="h-8 w-8"
              style={{
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(234deg) brightness(104%) contrast(97%)'
              }}
            />
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-primary">VettedAI</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            <Link to="/jobs">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Browse Roles
              </Button>
            </Link>
            <a
              href="https://www.vettedai.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                For Recruiters
              </Button>
            </a>
            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

