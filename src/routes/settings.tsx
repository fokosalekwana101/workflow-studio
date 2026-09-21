import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Moon, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  clearActivityData,
  setTheme,
  updateSettings,
  useAppStore,
  type EmailTone,
  type ResponseStyle,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Segmented } from "@/components/shared/tool-kit";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WorkFlow Studio" },
      { name: "description", content: "Theme, AI response length, default email tone and local demo data." },
      { property: "og:title", content: "Settings — WorkFlow Studio" },
      { property: "og:description", content: "Theme, AI response length, default email tone and local demo data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="sm:w-64 sm:shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const { settings } = useAppStore();

  return (
    <>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Lightweight preferences stored in this browser only. No accounts, no billing, no team administration."
      />

      <div className="max-w-3xl overflow-hidden rounded-xl border bg-card shadow-sm">
        <Row title="Appearance" description="Light and dark are designed separately, both strictly monochrome.">
          <div className="flex gap-2">
            <Button
              variant={settings.theme === "light" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setTheme("light")}
            >
              <Sun className="size-3.5" /> Light
            </Button>
            <Button
              variant={settings.theme === "dark" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setTheme("dark")}
            >
              <Moon className="size-3.5" /> Dark
            </Button>
          </div>
        </Row>

        <Row title="AI response preference" description="Applies to every tool and to AI Chat.">
          <Segmented<ResponseStyle>
            value={settings.responseStyle}
            onChange={(v) => updateSettings({ responseStyle: v })}
            options={["concise", "detailed"] as const}
          />
        </Row>

        <Row title="Default email tone" description="Pre-selected when you open the Email Generator.">
          <Segmented<EmailTone>
            value={settings.defaultTone}
            onChange={(v) => updateSettings({ defaultTone: v })}
            options={["formal", "direct", "persuasive"] as const}
          />
        </Row>

        <Row
          title="Responsible AI notice"
          description="Show the review-and-verify banner at the top of every page."
        >
          <div className="flex items-center gap-3 sm:justify-end">
            <Switch
              checked={settings.showNotice}
              onCheckedChange={(v) => updateSettings({ showNotice: v })}
              aria-label="Toggle responsible AI notice"
            />
            <span className="text-sm text-muted-foreground">{settings.showNotice ? "Visible" : "Hidden"}</span>
          </div>
        </Row>

        <Row
          title="Clear local activity data"
          description="Removes demo metrics and recent activity from this browser. Cannot be undone."
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              clearActivityData();
              toast.success("Local activity data cleared");
            }}
          >
            <Trash2 className="size-3.5" /> Clear data
          </Button>
        </Row>
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-6 text-muted-foreground">
        Metrics shown across the app are local estimates from your own usage in this browser, not measured
        organisational outcomes.
      </p>
    </>
  );
}
