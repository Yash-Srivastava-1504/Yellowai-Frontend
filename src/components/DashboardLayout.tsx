import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, MessageCircle, BarChart3, Dumbbell, Settings, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo.png";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: BarChart3, label: "Mood", path: "/mood" },
  { icon: Dumbbell, label: "Exercises", path: "/exercises" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const displayName = profile?.anonymous ? "Anonymous" : (profile?.display_name?.trim() || "Friend");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border/60 fixed inset-y-0 left-0 z-30 bg-background transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-56'}`}>
        <div className={`py-5 flex items-center relative transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-5 justify-between'}`}>
          {!isCollapsed ? (
            <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground whitespace-nowrap overflow-hidden">
              <img src={Logo} alt="Manah Logo" className="h-8 w-auto drop-shadow-sm" />
              Manah
            </Link>
          ) : (
            <Link to="/" className="flex items-center justify-center w-full text-xl font-bold tracking-tight text-foreground">
              <img src={Logo} alt="Manah Logo" className="h-8 w-auto drop-shadow-sm" />
            </Link>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 bg-background border border-border/60 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/80 z-40 transition-transform shadow-sm"
          >
            {isCollapsed ? <ChevronRight className="w-[14px] h-[14px]" /> : <ChevronLeft className="w-[14px] h-[14px]" />}
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl py-2.5 text-sm transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${
                  active ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={active ? 2 : 1.5} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`py-4 border-t border-border/40 transition-all duration-300 ${isCollapsed ? 'flex justify-center items-center' : 'px-4 mx-3'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full overflow-hidden'}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{initial}</div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">Free Plan</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-56 bg-background border-r border-border p-5 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <span className="flex items-center gap-2 text-lg font-bold text-foreground"><img src={Logo} alt="Manah" className="h-8 w-auto drop-shadow-sm" /> Manah</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-20' : 'lg:ml-56'}`}>
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-lg border-b border-border/40">
          <div className="flex items-center justify-between px-5 h-14">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="hidden lg:block" />
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold lg:hidden">{initial}</div>
          </div>
        </header>
        <main className="p-5 lg:p-8 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/90 backdrop-blur-lg border-t border-border/40 z-30">
        <div className="flex justify-around py-1.5 safe-area-pb">
          {navItems.slice(0, 4).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center gap-0.5 p-2 text-[10px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                <span className={active ? "font-medium" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}