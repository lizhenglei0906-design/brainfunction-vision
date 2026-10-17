import type { BrainNetworkDefinition, Yeo7Network } from "../../types/brainAtlas";

interface NetworkFilterProps {
  counts: Record<Yeo7Network, number>;
  enabledNetworks: Set<Yeo7Network>;
  focusedNetwork: Yeo7Network | null;
  networks: BrainNetworkDefinition[];
  onClearFocus: () => void;
  onFocus: (networkId: Yeo7Network) => void;
  onShowAll: () => void;
  onToggle: (networkId: Yeo7Network) => void;
  selectedNetwork: Yeo7Network | null;
}

export function NetworkFilter({
  counts,
  enabledNetworks,
  focusedNetwork,
  networks,
  onClearFocus,
  onFocus,
  onShowAll,
  onToggle,
  selectedNetwork,
}: NetworkFilterProps) {
  return (
    <div className="filter-block">
      <div className="filter-title-row">
        <h2>功能网络</h2>
        <button className="text-button" onClick={onShowAll} type="button">
          全部
        </button>
      </div>

      <div className="network-list">
        {networks.map((network) => {
          const checked = enabledNetworks.has(network.id);
          const active = selectedNetwork === network.id;
          const focused = focusedNetwork === network.id;
          const rowClassName = [
            "network-row",
            active ? "active" : "",
            focused ? "focused" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div className={rowClassName} key={network.id}>
              <label>
                <input
                  checked={checked}
                  onChange={() => onToggle(network.id)}
                  type="checkbox"
                />
                <span className="swatch" style={{ backgroundColor: network.color }} />
                <span className="network-copy">
                  <strong>{network.label}</strong>
                  <small>{network.englishLabel}</small>
                </span>
                <span className="network-count">{counts[network.id]}</span>
              </label>
              <button
                className="isolate-button"
                onClick={() => (focused ? onClearFocus() : onFocus(network.id))}
                type="button"
              >
                {focused ? "聚焦中" : "聚焦"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
