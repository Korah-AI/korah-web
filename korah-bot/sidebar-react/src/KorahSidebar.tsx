import { Moon, Sun, X } from "lucide-react";
import type { CSSProperties } from "react";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
} from "@/components/ui/animated-sidebar";
import { Adopt, historyNode, logoutNode, settingsNode } from "./persistent";
import { setDesktopOpen, setMobileOpen, toggleTheme, useHostState } from "./alpine";

interface Destination {
  label: string;
  path: string;
  icon: string;
  /** [dark theme, light theme] label and icon colour. */
  accent: [string, string];
}

interface Group {
  label: string;
  items: Destination[];
}

// Same destinations and per-destination colours the old sidebar had. The colour
// is now carried by the label and icon only; the row itself stays neutral.
const home: Destination = { label: "Home", path: "/home.html", icon: "home", accent: ["#c4b5fd", "#6d28d9"] };
const apHub: Destination = { label: "AP Hub", path: "/ap/home.html", icon: "home", accent: ["#c4b5fd", "#6d28d9"] };
const ask: Destination = { label: "Ask Korah Tutor", path: "/chat.html", icon: "chat", accent: ["#22d3ee", "#0d6e88"] };
const potd: Destination = { label: "Problem of the Day", path: "/potd/index.html", icon: "emoji_objects", accent: ["#34d399", "#037252"] };

const satGroups: Group[] = [
  {
    label: "Practice",
    items: [
      { label: "Question Bank", path: "/sat/index.html", icon: "assignment", accent: ["#fbbf24", "#92400e"] },
      { label: "Latest Questions", path: "/sat/latest-questions.html", icon: "fiber_new", accent: ["#4ade80", "#127236"] },
      { label: "Tailored Practice", path: "/sat/tailored.html", icon: "auto_awesome", accent: ["#93c5fd", "#1d4ed8"] },
      { label: "Practice Rush", path: "/sat/rush.html", icon: "bolt", accent: ["#fb923c", "#9a3412"] },
    ],
  },
  {
    label: "Study",
    items: [
      { label: "Practice Tests", path: "/sat/practice-test/index.html", icon: "timer", accent: ["#a5b4fc", "#4338ca"] },
      { label: "Dashboard", path: "/sat/dashboard.html", icon: "insights", accent: ["#f472b6", "#be185d"] },
      { label: "Vocab", path: "/sat/vocab/learn.html", icon: "menu_book", accent: ["#e879f9", "#a21caf"] },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Desmos Chat", path: "/sat/math-chat.html", icon: "calculate", accent: ["#38bdf8", "#0369a1"] },
      { label: "Study Plan", path: "/sat/study-plan.html", icon: "event", accent: ["#f87171", "#b91c1c"] },
    ],
  },
];

const apGroups: Group[] = [
  {
    label: "AP practice",
    items: [
      { label: "FRQ Practice", path: "/ap/index.html", icon: "assignment", accent: ["#fda4af", "#9f1239"] },
      { label: "Mock Exams", path: "/ap/exams.html", icon: "functions", accent: ["#fcd6a4", "#854d0e"] },
      { label: "AP Progress", path: "/ap/progress.html", icon: "trending_up", accent: ["#5eead4", "#0e7068"] },
    ],
  },
];

const collegeGroups: Group[] = [
  {
    label: "College prep",
    items: [
      { label: "Essays", path: "/college-prep/index.html", icon: "article", accent: ["#d8b4fe", "#7e22ce"] },
      { label: "College Match", path: "/sat/college-match/index.html", icon: "school", accent: ["#d4e157", "#626b08"] },
    ],
  },
];

const tabs = [
  { key: "sat", label: "SAT", path: "/home.html?tab=sat" },
  { key: "ap", label: "AP", path: "/ap/home.html" },
  { key: "college-prep", label: "College Prep", path: "/college-prep/index.html" },
];

function isCurrent(path: string, base: string) {
  try {
    const target = new URL(base + path, window.location.href).pathname;
    const here = window.location.pathname.endsWith("/")
      ? window.location.pathname + "index.html"
      : window.location.pathname;
    return target === here;
  } catch {
    return false;
  }
}

function NavGroup({ group, base, first }: { group: Group; base: string; first?: boolean }) {
  return (
    <AnimatedSidebarGroup className={first ? "pt-0" : undefined}>
      <AnimatedSidebarGroupLabel className="ksb-label">{group.label}</AnimatedSidebarGroupLabel>
      <AnimatedSidebarGroupContent>
        <AnimatedSidebarMenu>
          {group.items.map((item) => (
            <AnimatedSidebarMenuItem
              key={item.path}
              style={{ "--ksb-a-dark": item.accent[0], "--ksb-a-light": item.accent[1] } as CSSProperties}
            >
              <AnimatedSidebarMenuButton
                className="ksb-nav"
                href={base + item.path}
                isActive={isCurrent(item.path, base)}
                icon={<span className="material-icons-round ksb-icon">{item.icon}</span>}
              >
                {item.label}
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          ))}
        </AnimatedSidebarMenu>
      </AnimatedSidebarGroupContent>
    </AnimatedSidebarGroup>
  );
}

export function KorahSidebar({ base }: { base: string }) {
  const host = useHostState();
  const tab = host.activeTab;
  const groups = tab === "ap" ? apGroups : tab === "college-prep" ? collegeGroups : satGroups;
  const homeGroup: Group = {
    label: "Home",
    items: [tab === "ap" ? apHub : home, ask, potd],
  };

  return (
    <AnimatedSidebarProvider
      className="ksb min-h-0 w-auto shrink-0"
      open={!host.collapsed}
      onOpenChange={setDesktopOpen}
      openMobile={host.mobileOpen}
      onOpenMobileChange={setMobileOpen}
    >
      <AnimatedSidebar ariaLabel="Korah navigation" collapsible="icon" panelClassName="ksb-panel">
        <AnimatedSidebarHeader className="p-3 pb-1">
          <div className="flex min-h-11 items-center gap-2.5 overflow-hidden px-1">
            <a href={base + "/index.html"} className="flex min-w-0 flex-1 items-center gap-2.5 no-underline" aria-label="Korah AI home">
              <img src={base + "/logo-images/newlogo2.png"} alt="" className="size-8 shrink-0 object-contain" />
              <span className="ksb-brand truncate text-[1.0625rem] font-semibold text-foreground group-data-[state=collapsed]/sidebar:hidden">
                Korah AI
              </span>
            </a>
            <AnimatedSidebarClose className="ml-auto size-8 text-muted-foreground hover:bg-muted md:hidden">
              <X aria-hidden="true" className="size-4" />
            </AnimatedSidebarClose>
          </div>
        </AnimatedSidebarHeader>

        <AnimatedSidebarContent className="px-2 pt-1">
          <nav className="ksb-tabs group-data-[state=collapsed]/sidebar:hidden" aria-label="Section">
            {tabs.map((t) => (
              <a
                key={t.key}
                href={base + t.path}
                className="ksb-tab"
                aria-current={tab === t.key ? "page" : undefined}
              >
                {t.label}
              </a>
            ))}
          </nav>

          <NavGroup group={homeGroup} base={base} first />
          {groups.map((group) => (
            <NavGroup key={group.label} group={group} base={base} />
          ))}

          <AnimatedSidebarGroup className="ksb-recent group-data-[state=collapsed]/sidebar:hidden">
            <AnimatedSidebarGroupLabel className="ksb-label shrink-0">Recent chats</AnimatedSidebarGroupLabel>
            <Adopt node={historyNode} />
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>

        <AnimatedSidebarFooter className="ksb-footer">
          {/* Removed: mood indicator ("Full Focus Mode")
          <div className="ksb-mood group-data-[state=collapsed]/sidebar:hidden">
            <Adopt node={moodNode} />
          </div>
          */}
          <div className="ksb-actions">
            <Adopt node={logoutNode} />
            <Adopt node={settingsNode} />
            <button
              type="button"
              className="ksb-icon-btn"
              title="Toggle theme"
              aria-label="Toggle theme"
              onClick={() => toggleTheme(host.theme)}
            >
              {host.theme === "dark" ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
            </button>
          </div>
        </AnimatedSidebarFooter>

        <AnimatedSidebarRail />
      </AnimatedSidebar>
    </AnimatedSidebarProvider>
  );
}
