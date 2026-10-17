import type { BrainNetworkDefinition } from "../../types/brainAtlas";
import type { LearningFunctionDefinition } from "../../types/learningFunction";
import type { ReactNode } from "react";

interface LearningFunctionNavigatorProps {
  activeFunction: LearningFunctionDefinition | null;
  activeFunctionMenu?: ReactNode;
  learningFunctions: LearningFunctionDefinition[];
  networkById: Record<string, BrainNetworkDefinition>;
  onClear: () => void;
  onSelect: (functionId: string) => void;
}

export function LearningFunctionNavigator({
  activeFunction,
  activeFunctionMenu,
  learningFunctions,
  networkById,
  onClear,
  onSelect,
}: LearningFunctionNavigatorProps) {
  return (
    <section className="learning-function-panel" aria-label="九项基础脑功能">
      <div className="filter-title-row">
        <div>
          <p className="eyebrow">训练系统</p>
          <h2>九项基础脑功能</h2>
        </div>
        {activeFunction && (
          <button className="text-button" onClick={onClear} type="button">
            清除
          </button>
        )}
      </div>

      <div className="learning-function-list">
        {learningFunctions.map((item) => {
          const active = activeFunction?.id === item.id;
          return (
            <div className="learning-function-slot" key={item.id}>
              <button
                className={["learning-function-button", active ? "active" : ""].filter(Boolean).join(" ")}
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <span className="function-order">{item.order}</span>
                <span className="function-copy">
                  <strong>{item.label}</strong>
                  <small>{item.candidateNetworks.length} 个相关网络</small>
                </span>
                <span className="function-network-stack" aria-hidden="true">
                  {item.candidateNetworks.map((networkId) => (
                    <span
                      className="function-network-dot"
                      key={networkId}
                      style={{ backgroundColor: networkById[networkId]?.color }}
                      title={networkById[networkId]?.label}
                    />
                  ))}
                </span>
              </button>
              {active && activeFunctionMenu}
            </div>
          );
        })}
      </div>

    </section>
  );
}
