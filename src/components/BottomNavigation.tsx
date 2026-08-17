import { Activity, List, MapIcon } from "lucide-react";

type Tab = "map" | "details" | "history";

type BottomNavigationProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

const items = [
  { id: "map" as const, label: "Mapa", icon: MapIcon },
  { id: "details" as const, label: "Detalhes", icon: Activity },
  { id: "history" as const, label: "Histórico", icon: List },
];

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegação do tracking">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={activeTab === item.id ? "active" : undefined}
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
          >
            <Icon size={18} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

