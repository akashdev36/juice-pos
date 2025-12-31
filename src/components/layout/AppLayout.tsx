import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Receipt, History } from "lucide-react";
import juiceJungleLogo from "@/assets/juice-jungle-logo.jpg";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/history", icon: History, label: "History" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={juiceJungleLogo}
              alt="Juice Jungle"
              className="h-10 w-10 rounded-full object-cover"
            />
            <h1 className="text-xl font-bold text-primary hidden sm:block">
              Juice Jungle
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-action-manipulation ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}