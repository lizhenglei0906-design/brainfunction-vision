import type { BrainNetworkDefinition, BrainParcel } from "../../types/brainAtlas";
import {
  getParcelCompactDisplayName,
  getParcelFunctionalTag,
  getParcelRegionStatus,
} from "../../lib/parcelNaming";
import type { ParcelIdentityEntry } from "../../types/parcelIdentity";

interface ParcelSearchProps {
  identityById: Map<string, ParcelIdentityEntry>;
  networkById: Record<string, BrainNetworkDefinition>;
  onQueryChange: (query: string) => void;
  onSelectParcel: (parcel: BrainParcel) => void;
  query: string;
  results: BrainParcel[];
}

export function ParcelSearch({
  identityById,
  networkById,
  onQueryChange,
  onSelectParcel,
  query,
  results,
}: ParcelSearchProps) {
  const trimmedQuery = query.trim();

  return (
    <form
      className="parcel-search"
      onSubmit={(event) => {
        event.preventDefault();
        if (results[0]) {
          onSelectParcel(results[0]);
        }
      }}
    >
      <label htmlFor="parcel-search-input">定位点位</label>
      <input
        autoComplete="off"
        id="parcel-search-input"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="ROI 2、脑区名、网络名"
        type="search"
        value={query}
      />
      {trimmedQuery && (
        <div className="search-results" role="listbox" aria-label="点位搜索结果">
          {results.length > 0 ? (
            results.map((parcel) => {
              const network = networkById[parcel.network];
              const identity = identityById.get(parcel.id);
              const regionLabel = getParcelCompactDisplayName(identity, parcel);
              const functionalTag = getParcelFunctionalTag(identity);
              const regionStatus = getParcelRegionStatus(identity);
              return (
                <button
                  aria-label={`选择 ${regionLabel}, ROI ${parcel.roi}`}
                  className="search-result"
                  key={parcel.id}
                  onClick={() => onSelectParcel(parcel)}
                  type="button"
                >
                  <span className="search-main">
                    <strong>{regionLabel}</strong>
                    <small>
                      ROI {parcel.roi} · {parcel.sourceLabel} · {regionStatus}
                    </small>
                  </span>
                  <span className="search-meta">
                    <span className="inline-swatch" style={{ backgroundColor: network.color }} />
                    {functionalTag ?? parcel.displayLabel}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="search-empty">没有找到匹配点位</p>
          )}
        </div>
      )}
    </form>
  );
}
