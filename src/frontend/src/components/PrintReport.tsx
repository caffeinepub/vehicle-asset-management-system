import { AssetLabel, AssetType, Category } from "../backend";
import {
  useGetAllAssets,
  useGetAllDownAssets,
  useGetAllPairings,
} from "../hooks/useQueries";

const CATEGORY_ORDER = [
  Category.transports,
  Category.killTrucks,
  Category.combo,
  Category.acidFracs,
  Category.fracPumps,
  Category.treatersTrucksAndTrailers,
  Category.floatTrailer,
  Category.misc,
  Category.spareTractors,
] as const;

const categoryPrintColors: Record<Category, string> = {
  [Category.transports]: "print-category-transports",
  [Category.killTrucks]: "print-category-kill-trucks",
  [Category.combo]: "print-category-combo",
  [Category.acidFracs]: "print-category-acid-fracs",
  [Category.fracPumps]: "print-category-frac-pumps",
  [Category.treatersTrucksAndTrailers]: "print-category-treater",
  [Category.floatTrailer]: "print-category-float-trailer",
  [Category.misc]: "print-category-misc",
  [Category.spareTractors]: "print-category-spare",
};

interface PrintReportProps {
  mode?: "full" | "down-assets";
}

export default function PrintReport({ mode = "full" }: PrintReportProps) {
  const { data: assets = [] } = useGetAllAssets();
  const { data: pairings = [] } = useGetAllPairings();
  const { data: downAssets = [] } = useGetAllDownAssets();

  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAssetType = (type: AssetType) => {
    switch (type) {
      case AssetType.tractor:
        return "Tractor";
      case AssetType.trailer:
        return "Trailer";
      case AssetType.pump:
        return "Pump";
      case AssetType.pickup:
        return "Pickup";
      default:
        return type;
    }
  };

  const formatCategory = (category: Category) => {
    const categoryMap: Record<Category, string> = {
      [Category.transports]: "Transports",
      [Category.killTrucks]: "Kill Trucks",
      [Category.combo]: "Combo",
      [Category.acidFracs]: "Acid Fracs",
      [Category.fracPumps]: "Frac Pumps",
      [Category.treatersTrucksAndTrailers]: "Treater Trucks & Trailers",
      [Category.floatTrailer]: "Float Trailer",
      [Category.misc]: "Misc",
      [Category.spareTractors]: "Spare Tractors",
    };
    return categoryMap[category] || category;
  };

  const formatAssetLabel = (label?: AssetLabel) => {
    if (!label) return "N/A";
    switch (label) {
      case AssetLabel.ptoTractor:
        return "PTO Tractor";
      case AssetLabel.twoTank:
        return "2 Tank";
      case AssetLabel.threeTank:
        return "3 Tank";
      case AssetLabel.f250:
        return "F-250";
      case AssetLabel.f350:
        return "F-350";
      case AssetLabel.dodgeRam:
        return "Dodge Ram";
      case AssetLabel.tundra:
        return "Tundra";
      default:
        return "N/A";
    }
  };

  const getPairingForAsset = (assetNumber: string) => {
    return pairings.find(
      (p) => p.tractorId === assetNumber || p.secondAssetId === assetNumber,
    );
  };

  const tractors = assets.filter((a) => a.assetType === AssetType.tractor);
  const trailers = assets.filter((a) => a.assetType === AssetType.trailer);
  const pumps = assets.filter((a) => a.assetType === AssetType.pump);
  const pickups = assets.filter((a) => a.assetType === AssetType.pickup);
  const downTractors = downAssets.filter(
    (a) => a.assetType === AssetType.tractor,
  );
  const downTrailers = downAssets.filter(
    (a) => a.assetType === AssetType.trailer,
  );
  const downPumps = downAssets.filter((a) => a.assetType === AssetType.pump);
  const downPickups = downAssets.filter(
    (a) => a.assetType === AssetType.pickup,
  );

  const pairedAssetIds = new Set(
    pairings.flatMap((p) => [p.tractorId, p.secondAssetId]),
  );
  const standaloneMiscPickups = pickups.filter(
    (p) =>
      !pairedAssetIds.has(p.assetNumber) &&
      p.standaloneCategory === Category.misc,
  );
  const standaloneSpareTractors = tractors.filter(
    (t) =>
      !pairedAssetIds.has(t.assetNumber) &&
      t.standaloneCategory === Category.spareTractors,
  );

  // Group pairings by category in the specified order
  const pairingsByCategory = CATEGORY_ORDER.map((category) => {
    const categoryPairings = pairings.filter((p) => p.category === category);
    let standaloneAssets: typeof assets = [];

    if (category === Category.misc) {
      standaloneAssets = standaloneMiscPickups;
    } else if (category === Category.spareTractors) {
      standaloneAssets = standaloneSpareTractors;
    }

    return {
      category,
      label: formatCategory(category),
      colorClass: categoryPrintColors[category],
      pairings: categoryPairings,
      standaloneAssets,
      totalCount: categoryPairings.length + standaloneAssets.length,
    };
  }).filter((group) => group.totalCount > 0);

  // Render Down Assets Only Report
  if (mode === "down-assets") {
    return (
      <div className="print-only print-light-mode hidden">
        <style>{`
          @media print {
            .print-only { display: block !important; }
            .print-light-mode { 
              color-scheme: light !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .print-light-mode * {
              color-scheme: light !important;
            }
            body { 
              font-family: Arial, sans-serif; 
              color: #000000 !important; 
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            h1 { font-size: 24pt; margin-bottom: 8pt; color: #5c1a1a !important; }
            h2 { font-size: 18pt; margin-top: 16pt; margin-bottom: 8pt; color: #5c1a1a !important; border-bottom: 2px solid #5c1a1a; padding-bottom: 4pt; page-break-after: avoid; }
            h3 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; color: #5c1a1a !important; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16pt; page-break-inside: avoid; background: #ffffff !important; }
            th { background-color: #5c1a1a !important; color: #ffffff !important; padding: 8pt; text-align: left; font-weight: bold; border: 1px solid #5c1a1a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            td { padding: 6pt; border: 1px solid #cccccc; color: #000000 !important; background: #ffffff !important; }
            tr:nth-child(even) td { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .report-header { text-align: center; margin-bottom: 24pt; }
            .report-date { font-size: 10pt; color: #666666 !important; margin-top: 4pt; }
            .section { margin-bottom: 24pt; page-break-inside: avoid; }
            .summary-stats { display: flex; justify-content: space-around; margin-bottom: 16pt; flex-wrap: wrap; }
            .stat-box { text-align: center; padding: 12pt; border: 1px solid #5c1a1a; border-radius: 4pt; margin: 4pt; background: #ffffff !important; }
            .stat-number { font-size: 24pt; font-weight: bold; color: #5c1a1a !important; }
            .stat-label { font-size: 10pt; color: #666666 !important; margin-top: 4pt; }
          }
        `}</style>

        <div className="report-header">
          <h1>Down Assets Report</h1>
          <div className="report-date">
            Generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="summary-stats">
          <div className="stat-box">
            <div className="stat-number">{downAssets.length}</div>
            <div className="stat-label">Total Down Assets</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{downTractors.length}</div>
            <div className="stat-label">Down Tractors</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{downTrailers.length}</div>
            <div className="stat-label">Down Trailers</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{downPumps.length}</div>
            <div className="stat-label">Down Pumps</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{downPickups.length}</div>
            <div className="stat-label">Down Pickups</div>
          </div>
        </div>

        {/* Down Assets Section */}
        <div className="section">
          <h2>Down Assets Details</h2>

          {downTractors.length > 0 && (
            <>
              <h3>Down Tractors</h3>
              <table>
                <thead>
                  <tr>
                    <th>Asset Number</th>
                    <th>Label</th>
                    <th>Category</th>
                    <th>AVI Inspection Date</th>
                    <th>Down Reason</th>
                    <th>Down Date</th>
                    <th>Last Updated</th>
                    <th>Previous Pairing</th>
                  </tr>
                </thead>
                <tbody>
                  {downTractors.map((asset) => (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>
                        {asset.standaloneCategory
                          ? formatCategory(asset.standaloneCategory)
                          : "N/A"}
                      </td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>{asset.downReason}</td>
                      <td>{formatDate(asset.downDate)}</td>
                      <td>{formatDate(asset.lastUpdated)}</td>
                      <td>
                        {asset.previousPairing
                          ? `${asset.previousPairing.trailerId} (${formatAssetType(asset.previousPairing.assetType)}, ${formatCategory(asset.previousPairing.category)})`
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {downTrailers.length > 0 && (
            <>
              <h3>Down Trailers</h3>
              <table>
                <thead>
                  <tr>
                    <th>Asset Number</th>
                    <th>Label</th>
                    <th>AVI Inspection Date</th>
                    <th>VILK Inspection Date</th>
                    <th>Down Reason</th>
                    <th>Down Date</th>
                    <th>Last Updated</th>
                    <th>Previous Pairing</th>
                    <th>Previous Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {downTrailers.map((asset) => {
                    const showDriver =
                      asset.previousPairing?.category ===
                        Category.treatersTrucksAndTrailers &&
                      asset.previousPairing?.driverName;
                    return (
                      <tr key={asset.assetNumber}>
                        <td>{asset.assetNumber}</td>
                        <td>{formatAssetLabel(asset.assetLabel)}</td>
                        <td>{formatDate(asset.aviDate)}</td>
                        <td>{formatDate(asset.vilkDate)}</td>
                        <td>{asset.downReason}</td>
                        <td>{formatDate(asset.downDate)}</td>
                        <td>{formatDate(asset.lastUpdated)}</td>
                        <td>
                          {asset.previousPairing
                            ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                            : "None"}
                        </td>
                        <td>
                          {showDriver
                            ? asset.previousPairing?.driverName
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {downPumps.length > 0 && (
            <>
              <h3>Down Pumps</h3>
              <table>
                <thead>
                  <tr>
                    <th>Asset Number</th>
                    <th>Label</th>
                    <th>AVI Inspection Date</th>
                    <th>Down Reason</th>
                    <th>Down Date</th>
                    <th>Last Updated</th>
                    <th>Previous Pairing</th>
                  </tr>
                </thead>
                <tbody>
                  {downPumps.map((asset) => (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>{asset.downReason}</td>
                      <td>{formatDate(asset.downDate)}</td>
                      <td>{formatDate(asset.lastUpdated)}</td>
                      <td>
                        {asset.previousPairing
                          ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {downPickups.length > 0 && (
            <>
              <h3>Down Pickups</h3>
              <table>
                <thead>
                  <tr>
                    <th>Asset Number</th>
                    <th>Label</th>
                    <th>Driver Name</th>
                    <th>Category</th>
                    <th>AVI Inspection Date</th>
                    <th>Down Reason</th>
                    <th>Down Date</th>
                    <th>Last Updated</th>
                    <th>Previous Pairing</th>
                  </tr>
                </thead>
                <tbody>
                  {downPickups.map((asset) => (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>{asset.driverName || "N/A"}</td>
                      <td>
                        {asset.standaloneCategory
                          ? formatCategory(asset.standaloneCategory)
                          : "N/A"}
                      </td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>{asset.downReason}</td>
                      <td>{formatDate(asset.downDate)}</td>
                      <td>{formatDate(asset.lastUpdated)}</td>
                      <td>
                        {asset.previousPairing
                          ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {downAssets.length === 0 && <p>No down assets</p>}
        </div>
      </div>
    );
  }

  // Render Full Report (existing functionality)
  return (
    <div className="print-only print-light-mode hidden">
      <style>{`
        @media print {
          .print-only { display: block !important; }
          .print-light-mode { 
            color-scheme: light !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-light-mode * {
            color-scheme: light !important;
          }
          body { 
            font-family: Arial, sans-serif; 
            color: #000000 !important; 
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          h1 { font-size: 24pt; margin-bottom: 8pt; color: #5c1a1a !important; }
          h2 { font-size: 18pt; margin-top: 16pt; margin-bottom: 8pt; color: #5c1a1a !important; border-bottom: 2px solid #5c1a1a; padding-bottom: 4pt; page-break-after: avoid; }
          h3 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; color: #5c1a1a !important; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16pt; page-break-inside: avoid; background: #ffffff !important; }
          th { background-color: #5c1a1a !important; color: #ffffff !important; padding: 8pt; text-align: left; font-weight: bold; border: 1px solid #5c1a1a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          td { padding: 6pt; border: 1px solid #cccccc; color: #000000 !important; background: #ffffff !important; }
          tr:nth-child(even) td { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .report-header { text-align: center; margin-bottom: 24pt; }
          .report-date { font-size: 10pt; color: #666666 !important; margin-top: 4pt; }
          .section { margin-bottom: 24pt; page-break-inside: avoid; }
          .category-section { margin-bottom: 20pt; page-break-inside: avoid; }
          .category-header { padding: 8pt 12pt; margin-bottom: 8pt; border-radius: 4pt; font-size: 12pt; font-weight: bold; page-break-after: avoid; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .summary-stats { display: flex; justify-content: space-around; margin-bottom: 16pt; flex-wrap: wrap; }
          .stat-box { text-align: center; padding: 12pt; border: 1px solid #5c1a1a; border-radius: 4pt; margin: 4pt; background: #ffffff !important; }
          .stat-number { font-size: 24pt; font-weight: bold; color: #5c1a1a !important; }
          .stat-label { font-size: 10pt; color: #666666 !important; margin-top: 4pt; }
          .pairing-row { display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 12pt; padding: 8pt; border: 1px solid #cccccc; border-radius: 4pt; page-break-inside: avoid; background: #ffffff !important; }
          .pairing-assets { display: flex; align-items: center; gap: 8pt; flex: 1; }
          .asset-box { flex: 1; padding: 8pt; border: 1px solid #999999; border-radius: 4pt; background: #f9f9f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .asset-box-header { font-size: 9pt; color: #666666 !important; margin-bottom: 4pt; }
          .asset-box-id { font-size: 12pt; font-weight: bold; margin-bottom: 4pt; color: #000000 !important; }
          .asset-box-label { font-size: 8pt; color: #5c1a1a !important; background: #f0e6e6 !important; padding: 2pt 6pt; border-radius: 3pt; display: inline-block; margin-bottom: 4pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .asset-box-category { font-size: 8pt; color: #5c1a1a !important; background: #e6f0f0 !important; padding: 2pt 6pt; border-radius: 3pt; display: inline-block; margin-bottom: 4pt; margin-left: 4pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .asset-box-driver { font-size: 8pt; color: #5c1a1a !important; background: #f0e6f0 !important; padding: 2pt 6pt; border-radius: 3pt; display: inline-block; margin-bottom: 4pt; margin-left: 4pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .asset-box-dates { font-size: 8pt; color: #666666 !important; }
          .pairing-symbol { flex-shrink: 0; width: 24pt; text-align: center; }
          .pairing-symbol img { width: 20pt; height: 20pt; opacity: 0.6; }
          .pairing-details { font-size: 8pt; color: #666666 !important; margin-top: 4pt; padding-left: 8pt; width: 100%; }
          .driver-name-prominent { font-size: 10pt; color: #5c1a1a !important; font-weight: bold; margin-top: 6pt; padding: 6pt 8pt; background: #f0e6e6 !important; border-left: 3pt solid #5c1a1a; border-radius: 3pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .standalone-note { font-size: 8pt; color: #666666 !important; font-style: italic; margin-top: 4pt; }
          .pairing-row-wrapper { width: 100%; }
        }
      `}</style>

      <div className="report-header">
        <h1>Fleet Management Detailed Report</h1>
        <div className="report-date">
          Generated on{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-box">
          <div className="stat-number">{tractors.length}</div>
          <div className="stat-label">Active Tractors</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{trailers.length}</div>
          <div className="stat-label">Active Trailers</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{pumps.length}</div>
          <div className="stat-label">Active Pumps</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{pickups.length}</div>
          <div className="stat-label">Active Pickups</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{pairings.length}</div>
          <div className="stat-label">Active Pairings</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{downAssets.length}</div>
          <div className="stat-label">Down Assets</div>
        </div>
      </div>

      {/* Complete Pairings Dashboard Section */}
      <div className="section">
        <h2>
          Complete Pairings Dashboard - All Paired Assets & Categorized Assets
          by Category
        </h2>
        {pairingsByCategory.length > 0 ? (
          pairingsByCategory.map(
            ({
              category,
              label,
              colorClass,
              pairings: categoryPairings,
              standaloneAssets,
            }) => (
              <div key={category} className="category-section">
                <div className={`category-header ${colorClass}`}>
                  {label} ({categoryPairings.length + standaloneAssets.length})
                </div>

                {/* Paired Assets */}
                {categoryPairings.map((pairing) => {
                  const firstAsset = assets.find(
                    (a) => a.assetNumber === pairing.tractorId,
                  );
                  const secondAsset = assets.find(
                    (a) => a.assetNumber === pairing.secondAssetId,
                  );
                  const firstAssetTypeLabel =
                    firstAsset?.assetType === AssetType.pickup
                      ? "Pickup"
                      : "Tractor";
                  const secondAssetTypeLabel = formatAssetType(
                    pairing.assetType,
                  );
                  const showPairingDriverName =
                    category === Category.treatersTrucksAndTrailers &&
                    pairing.driverName;
                  const showPickupDriverName =
                    firstAsset?.assetType === AssetType.pickup &&
                    firstAsset?.driverName;
                  return (
                    <div
                      key={`${pairing.tractorId}-${pairing.secondAssetId}`}
                      className="pairing-row-wrapper"
                    >
                      <div className="pairing-row">
                        <div className="pairing-assets">
                          {/* First Asset Box (Tractor or Pickup) */}
                          <div className="asset-box">
                            <div className="asset-box-header">
                              {firstAssetTypeLabel}
                            </div>
                            <div className="asset-box-id">
                              {pairing.tractorId}
                            </div>
                            {firstAsset?.assetLabel && (
                              <div className="asset-box-label">
                                {formatAssetLabel(firstAsset.assetLabel)}
                              </div>
                            )}
                            {showPickupDriverName && (
                              <div className="asset-box-driver">
                                Driver: {firstAsset.driverName}
                              </div>
                            )}
                            <div className="asset-box-dates">
                              AVI: {formatDate(firstAsset?.aviDate)}
                            </div>
                          </div>

                          {/* Pairing Symbol */}
                          <div className="pairing-symbol">
                            <img
                              src="/assets/generated/chain-link-icon-transparent.dim_32x32.png"
                              alt="⛓"
                            />
                          </div>

                          {/* Second Asset Box (Trailer or Pump) */}
                          <div className="asset-box">
                            <div className="asset-box-header">
                              {secondAssetTypeLabel}
                            </div>
                            <div className="asset-box-id">
                              {pairing.secondAssetId}
                            </div>
                            {secondAsset?.assetLabel && (
                              <div className="asset-box-label">
                                {formatAssetLabel(secondAsset.assetLabel)}
                              </div>
                            )}
                            <div className="asset-box-dates">
                              AVI: {formatDate(secondAsset?.aviDate)}
                              {secondAsset?.vilkDate && (
                                <> | VILK: {formatDate(secondAsset.vilkDate)}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pairing Details Below - Driver Name Prominently Displayed */}
                      <div style={{ width: "100%", paddingLeft: "8pt" }}>
                        {showPairingDriverName && (
                          <div className="driver-name-prominent">
                            🚗 Driver: {pairing.driverName}
                          </div>
                        )}
                        <div className="pairing-details">
                          Paired: {formatDate(pairing.pairedDate)}
                          {pairing.notes && <> | Notes: {pairing.notes}</>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Standalone Categorized Assets */}
                {standaloneAssets.map((asset) => {
                  const assetTypeLabel =
                    asset.assetType === AssetType.pickup ? "Pickup" : "Tractor";
                  const showDriverName =
                    asset.assetType === AssetType.pickup && asset.driverName;
                  return (
                    <div
                      key={asset.assetNumber}
                      className="pairing-row-wrapper"
                    >
                      <div className="pairing-row">
                        <div className="asset-box" style={{ flex: 1 }}>
                          <div className="asset-box-header">
                            {assetTypeLabel}
                          </div>
                          <div className="asset-box-id">
                            {asset.assetNumber}
                          </div>
                          {asset.assetLabel && (
                            <div className="asset-box-label">
                              {formatAssetLabel(asset.assetLabel)}
                            </div>
                          )}
                          {asset.standaloneCategory && (
                            <div className="asset-box-category">
                              {formatCategory(asset.standaloneCategory)}
                            </div>
                          )}
                          {showDriverName && (
                            <div className="asset-box-driver">
                              Driver: {asset.driverName}
                            </div>
                          )}
                          <div className="asset-box-dates">
                            AVI: {formatDate(asset.aviDate)}
                          </div>
                        </div>
                      </div>
                      <div style={{ width: "100%", paddingLeft: "8pt" }}>
                        <div className="standalone-note">
                          Standalone categorized asset (not paired)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
          )
        ) : (
          <p>No active pairings or categorized assets</p>
        )}
      </div>

      {/* Active Assets Summary Tables */}
      <div className="section">
        <h2>Active Assets Summary</h2>

        {/* Active Tractors Section */}
        <h3>Active Tractors</h3>
        {tractors.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Asset Number</th>
                <th>Label</th>
                <th>Category</th>
                <th>AVI Inspection Date</th>
                <th>Pairing Status</th>
                <th>Pairing Category</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tractors.map((asset) => {
                const pairing = getPairingForAsset(asset.assetNumber);
                return (
                  <tr key={asset.assetNumber}>
                    <td>{asset.assetNumber}</td>
                    <td>{formatAssetLabel(asset.assetLabel)}</td>
                    <td>
                      {asset.standaloneCategory
                        ? formatCategory(asset.standaloneCategory)
                        : "N/A"}
                    </td>
                    <td>{formatDate(asset.aviDate)}</td>
                    <td>
                      {pairing
                        ? `Paired with ${pairing.secondAssetId} (${formatAssetType(pairing.assetType)})`
                        : "Unpaired"}
                    </td>
                    <td>
                      {pairing ? formatCategory(pairing.category) : "N/A"}
                    </td>
                    <td>{pairing?.notes || "N/A"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No active tractors</p>
        )}

        {/* Active Trailers Section */}
        <h3>Active Trailers</h3>
        {trailers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Asset Number</th>
                <th>Label</th>
                <th>AVI Inspection Date</th>
                <th>VILK Inspection Date</th>
                <th>Pairing Status</th>
                <th>Category</th>
                <th>Driver (if Treater)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {trailers.map((asset) => {
                const pairing = getPairingForAsset(asset.assetNumber);
                const showDriver =
                  pairing?.category === Category.treatersTrucksAndTrailers &&
                  pairing?.driverName;
                return (
                  <tr key={asset.assetNumber}>
                    <td>{asset.assetNumber}</td>
                    <td>{formatAssetLabel(asset.assetLabel)}</td>
                    <td>{formatDate(asset.aviDate)}</td>
                    <td>{formatDate(asset.vilkDate)}</td>
                    <td>
                      {pairing
                        ? `Paired with ${pairing.tractorId}`
                        : "Unpaired"}
                    </td>
                    <td>
                      {pairing ? formatCategory(pairing.category) : "N/A"}
                    </td>
                    <td>{showDriver ? pairing.driverName : "N/A"}</td>
                    <td>{pairing?.notes || "N/A"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No active trailers</p>
        )}

        {/* Active Pumps Section */}
        {pumps.length > 0 && (
          <>
            <h3>Active Pumps</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>AVI Inspection Date</th>
                  <th>Pairing Status</th>
                  <th>Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pumps.map((asset) => {
                  const pairing = getPairingForAsset(asset.assetNumber);
                  return (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>
                        {pairing
                          ? `Paired with ${pairing.tractorId}`
                          : "Unpaired"}
                      </td>
                      <td>
                        {pairing ? formatCategory(pairing.category) : "N/A"}
                      </td>
                      <td>{pairing?.notes || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Active Pickups Section */}
        {pickups.length > 0 && (
          <>
            <h3>Active Pickups</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>Driver Name</th>
                  <th>Category</th>
                  <th>AVI Inspection Date</th>
                  <th>Pairing Status</th>
                  <th>Pairing Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map((asset) => {
                  const pairing = getPairingForAsset(asset.assetNumber);
                  return (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>{asset.driverName || "N/A"}</td>
                      <td>
                        {asset.standaloneCategory
                          ? formatCategory(asset.standaloneCategory)
                          : "N/A"}
                      </td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>
                        {pairing
                          ? `Paired with ${pairing.secondAssetId} (${formatAssetType(pairing.assetType)})`
                          : "Unpaired"}
                      </td>
                      <td>
                        {pairing ? formatCategory(pairing.category) : "N/A"}
                      </td>
                      <td>{pairing?.notes || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Down Assets Section */}
      <div className="section">
        <h2>Down Assets</h2>

        {downTractors.length > 0 && (
          <>
            <h3>Down Tractors</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>Category</th>
                  <th>AVI Inspection Date</th>
                  <th>Down Reason</th>
                  <th>Down Date</th>
                  <th>Last Updated</th>
                  <th>Previous Pairing</th>
                </tr>
              </thead>
              <tbody>
                {downTractors.map((asset) => (
                  <tr key={asset.assetNumber}>
                    <td>{asset.assetNumber}</td>
                    <td>{formatAssetLabel(asset.assetLabel)}</td>
                    <td>
                      {asset.standaloneCategory
                        ? formatCategory(asset.standaloneCategory)
                        : "N/A"}
                    </td>
                    <td>{formatDate(asset.aviDate)}</td>
                    <td>{asset.downReason}</td>
                    <td>{formatDate(asset.downDate)}</td>
                    <td>{formatDate(asset.lastUpdated)}</td>
                    <td>
                      {asset.previousPairing
                        ? `${asset.previousPairing.trailerId} (${formatAssetType(asset.previousPairing.assetType)}, ${formatCategory(asset.previousPairing.category)})`
                        : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {downTrailers.length > 0 && (
          <>
            <h3>Down Trailers</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>AVI Inspection Date</th>
                  <th>VILK Inspection Date</th>
                  <th>Down Reason</th>
                  <th>Down Date</th>
                  <th>Last Updated</th>
                  <th>Previous Pairing</th>
                  <th>Previous Driver</th>
                </tr>
              </thead>
              <tbody>
                {downTrailers.map((asset) => {
                  const showDriver =
                    asset.previousPairing?.category ===
                      Category.treatersTrucksAndTrailers &&
                    asset.previousPairing?.driverName;
                  return (
                    <tr key={asset.assetNumber}>
                      <td>{asset.assetNumber}</td>
                      <td>{formatAssetLabel(asset.assetLabel)}</td>
                      <td>{formatDate(asset.aviDate)}</td>
                      <td>{formatDate(asset.vilkDate)}</td>
                      <td>{asset.downReason}</td>
                      <td>{formatDate(asset.downDate)}</td>
                      <td>{formatDate(asset.lastUpdated)}</td>
                      <td>
                        {asset.previousPairing
                          ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                          : "None"}
                      </td>
                      <td>
                        {showDriver ? asset.previousPairing?.driverName : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {downPumps.length > 0 && (
          <>
            <h3>Down Pumps</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>AVI Inspection Date</th>
                  <th>Down Reason</th>
                  <th>Down Date</th>
                  <th>Last Updated</th>
                  <th>Previous Pairing</th>
                </tr>
              </thead>
              <tbody>
                {downPumps.map((asset) => (
                  <tr key={asset.assetNumber}>
                    <td>{asset.assetNumber}</td>
                    <td>{formatAssetLabel(asset.assetLabel)}</td>
                    <td>{formatDate(asset.aviDate)}</td>
                    <td>{asset.downReason}</td>
                    <td>{formatDate(asset.downDate)}</td>
                    <td>{formatDate(asset.lastUpdated)}</td>
                    <td>
                      {asset.previousPairing
                        ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                        : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {downPickups.length > 0 && (
          <>
            <h3>Down Pickups</h3>
            <table>
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>Label</th>
                  <th>Driver Name</th>
                  <th>Category</th>
                  <th>AVI Inspection Date</th>
                  <th>Down Reason</th>
                  <th>Down Date</th>
                  <th>Last Updated</th>
                  <th>Previous Pairing</th>
                </tr>
              </thead>
              <tbody>
                {downPickups.map((asset) => (
                  <tr key={asset.assetNumber}>
                    <td>{asset.assetNumber}</td>
                    <td>{formatAssetLabel(asset.assetLabel)}</td>
                    <td>{asset.driverName || "N/A"}</td>
                    <td>
                      {asset.standaloneCategory
                        ? formatCategory(asset.standaloneCategory)
                        : "N/A"}
                    </td>
                    <td>{formatDate(asset.aviDate)}</td>
                    <td>{asset.downReason}</td>
                    <td>{formatDate(asset.downDate)}</td>
                    <td>{formatDate(asset.lastUpdated)}</td>
                    <td>
                      {asset.previousPairing
                        ? `${asset.previousPairing.tractorId} (${formatCategory(asset.previousPairing.category)})`
                        : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {downAssets.length === 0 && <p>No down assets</p>}
      </div>
    </div>
  );
}
