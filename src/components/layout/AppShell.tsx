import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  Mail,
  FileText,
  CalendarClock,
  Search,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ShieldAlert,
  X,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { applyTheme, setTheme, updateSettings, useAppStore } from "@/lib/store";
import { Logo } from "@/components/shared/Logo";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, hint: "Overview and metrics" },
  { to: "/email", label: "Email Generator", icon: Mail, hint: "Draft professional emails" },
  { to: "/meetings", label: "Meeting Summarizer", icon: FileText, hint: "Summaries and action items" },
  { to: "/tasks", label: "Task Planner", icon: CalendarClock, hint: "Schedule your day" },
  { to: "/research", label: "Research Assistant", icon: Search, hint: "Briefings and takeaways" },
  { to: "/chat", label: "AI Chat", icon: MessageSquare, hint: "Workplace assistant" },
  { to: "/settings", label: "Settings", icon: Settings, hint: "Preferences" },
] as const;

export type NavPath = (typeof NAV)[number]["to"];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const current = NAV.find((n) => n.to === pathname) ?? NAV[0];
  const toggleTheme = () => setTheme(settings.theme === "dark" ? "light" : "dark");

  return (
    <div className="min-h-screen bg-background">
      {/* Floating sidebar (desktop) */}
      <aside
        className={cn(
          "fixed left-4 top-4 bottom-4 z-30 hidden flex-col rounded-xl border bg-sidebar shadow-float transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:flex",
          collapsed ? "w-[60px]" : "w-[236px]",
        )}
      >
        <div className={cn("flex h-14 items-center border-b px-3", collapsed ? "justify-center" : "gap-2.5")}>
          <Logo className="size-7 shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              WorkFlow Studio
            </span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const link = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex h-9 items-center rounded-md text-sm transition-colors",
                  collapsed ? "justify-center px-0" : "gap-3 px-2.5",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        <div className="border-t p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className={cn(
                  "flex h-9 w-full items-center rounded-md text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed ? "justify-center" : "gap-3 px-2.5",
                )}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                {!collapsed && <span>Collapse</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center gap-2.5 border-b px-4">
            <Logo className="size-7" />
            <span className="text-sm font-semibold tracking-tight">WorkFlow Studio</span>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          collapsed ? "md:pl-[92px]" : "md:pl-[268px]",
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">WorkFlow Studio</span>
            <span className="hidden text-muted-foreground/50 sm:inline">/</span>
            <span className="truncate font-medium">{current.label}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex h-8 items-center gap-2 rounded-md border bg-card px-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground sm:w-56"
              aria-label="Open command menu"
            >
              <Search className="size-3.5" />
              <span className="hidden flex-1 text-left sm:inline">Search or jump to…</span>
              <span className="hidden items-center gap-0.5 sm:flex">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
              </span>
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="size-8" onClick={toggleTheme} aria-label="Toggle theme">
                  {settings.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Switch to {settings.theme === "dark" ? "light" : "dark"} mode</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {settings.showNotice && (
          <div className="border-b bg-surface px-4 py-2 md:px-8">
            <div className="mx-auto flex max-w-[1400px] items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              <p className="flex-1">
                <span className="font-medium text-foreground">Responsible AI Notice:</span> Model outputs may contain
                inaccuracies. Always review, edit, and verify content before workplace execution. Do not submit
                proprietary corporate data.
              </p>
              <button
                onClick={() => updateSettings({ showNotice: false })}
                className="rounded-sm p-0.5 hover:bg-accent hover:text-foreground"
                aria-label="Dismiss notice"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Jump to a tool or action…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {NAV.map((item) => (
              <CommandItem
                key={item.to}
                value={`${item.label} ${item.hint}`}
                onSelect={() => {
                  setCmdOpen(false);
                  navigate({ to: item.to });
                }}
              >
                <item.icon className="mr-2 size-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="toggle theme light dark"
              onSelect={() => {
                toggleTheme();
                setCmdOpen(false);
              }}
            >
              {settings.theme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
              Toggle {settings.theme === "dark" ? "light" : "dark"} mode
            </CommandItem>
            <CommandItem
              value="toggle sidebar collapse"
              onSelect={() => {
                setCollapsed((c) => !c);
                setCmdOpen(false);
              }}
            >
              <PanelLeftClose className="mr-2 size-4" />
              {collapsed ? "Expand" : "Collapse"} sidebar
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
