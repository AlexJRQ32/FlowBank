import type { ComponentType } from "react";
import type { AccionColor } from "../../../types";
import "./StatCards.scss";

interface StatConfig {
  key: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  color: AccionColor;
  label: string;
}

interface StatCardsProps {
  config: StatConfig[];
  data: Record<string, number>;
}

export function StatCards({ config, data }: StatCardsProps) {
  if (!config?.length) return null;

  return (
    <div className="stat-cards">
      {config.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${card.color}`}>
              <Icon size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="stat-card__number">{data[card.key] ?? 0}</div>
              <div className="stat-card__label">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatCards;
