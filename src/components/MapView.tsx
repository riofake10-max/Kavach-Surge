import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Circle,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Rectangle,
} from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/useAppStore';
import { calculateWindRadii } from '../engine/holland';
import { CriticalAsset, AssetType, AssetStatus } from '../types';
import { Layers, Eye, ShieldAlert, Zap, Plus, Home } from 'lucide-react';

// Custom Map Controller to center when scenario changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 9, { duration: 1.2 });
  }, [center[0], center[1], map]);
  return null;
}

// Click handler for custom landfall coordinate selection
function MapClickHandler({ onMapClick, isCustom }: { onMapClick: (lat: number, lng: number) => void; isCustom: boolean }) {
  useMapEvents({
    click(e) {
      if (isCustom) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Custom Leaflet Icons for Cyclone and Infrastructure
const createCycloneIcon = () =>
  L.divIcon({
    className: 'cyclone-pin',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 -ml-6 -mt-6 pointer-events-none">
        <div class="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping"></div>
        <div class="absolute inset-1 rounded-full bg-cyan-500/20 border border-cyan-400/80 backdrop-blur"></div>
        <svg class="w-7 h-7 text-cyan-300 animate-spin" style="animation-duration: 4s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2a10 10 0 0 0-7.07 2.93l1.41 1.41A8 8 0 0 1 12 4v-2z" />
          <path d="M22 12a10 10 0 0 0-2.93-7.07l-1.41 1.41A8 8 0 0 1 20 12h2z" />
          <path d="M12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 12 20v2z" />
          <path d="M2 12a10 10 0 0 0 2.93 7.07l1.41-1.41A8 8 0 0 1 4 12H2z" />
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const createAssetIcon = (type: AssetType, status: AssetStatus, isCascadeFailed: boolean = false) => {
  let strokeColor = '#10b981'; // safe: emerald
  let bgColor = 'bg-emerald-950/80 border-emerald-500';
  let badgeIcon = '🏥';

  if (status === 'at_risk') {
    strokeColor = '#eab308'; // yellow
    bgColor = 'bg-yellow-950/80 border-yellow-500';
  } else if (status === 'impacted') {
    strokeColor = '#f97316'; // orange
    bgColor = 'bg-orange-950/80 border-orange-500';
  } else if (status === 'failed') {
    strokeColor = '#ef4444'; // red
    bgColor = 'bg-red-950/80 border-red-500';
  }

  if (type === 'substation') badgeIcon = '⚡';
  else if (type === 'shelter') badgeIcon = '🛡️';
  else if (type === 'hospital') badgeIcon = '🏥';
  else if (type === 'road') badgeIcon = '🛣️';
  else if (type === 'bridge') badgeIcon = '🌉';

  const pulseClass = status === 'failed' || isCascadeFailed ? 'animate-pulse ring-2 ring-red-500' : '';

  return L.divIcon({
    className: 'asset-marker-pin',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 cursor-pointer hover:scale-110 transition-transform ${pulseClass}">
        <div class="w-7 h-7 rounded-md border flex items-center justify-center text-xs shadow-lg ${bgColor}">
          <span>${badgeIcon}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const MapView: React.FC = () => {
  const {
    activeScenario,
    scenarioId,
    setCustomLandfall,
    timeHours,
    vmaxKt,
    mapLayerToggles,
    toggleLayer,
    floodSimResult,
    cascadeSimResult,
    selectAsset,
    selectedAsset,
  } = useAppStore();

  const { landfallLatLng, syntheticTrack, rmaxKm, centralPressureHpa } = activeScenario;

  // Find closest track point for current time
  const currentPoint = useMemo(() => {
    let closest = syntheticTrack[0];
    let minD = Infinity;
    for (const p of syntheticTrack) {
      const diff = Math.abs(p.timeHours - timeHours);
      if (diff < minD) {
        minD = diff;
        closest = p;
      }
    }
    return closest;
  }, [syntheticTrack, timeHours]);

  // Track polyline coordinates
  const trackLineCoords = useMemo(
    () => syntheticTrack.map((p) => [p.lat, p.lng] as [number, number]),
    [syntheticTrack]
  );

  // Cone of uncertainty coordinates (widens with distance before landfall)
  const conePolygonCoords = useMemo(() => {
    const leftEdge: [number, number][] = [];
    const rightEdge: [number, number][] = [];

    syntheticTrack.forEach((p) => {
      // Radius widens as lead time increases: 15km at landfall, up to 90km at T-72
      const leadHours = Math.abs(Math.min(0, p.timeHours));
      const radiusKm = 15 + (leadHours / 72) * 85;
      const degOffset = radiusKm / 111;

      leftEdge.push([p.lat + degOffset * 0.7, p.lng - degOffset * 0.7]);
      rightEdge.push([p.lat - degOffset * 0.7, p.lng + degOffset * 0.7]);
    });

    return [...leftEdge, ...rightEdge.reverse()];
  }, [syntheticTrack]);

  // Holland wind radii for current position
  const windRadii = useMemo(() => {
    return calculateWindRadii({
      vmaxKt: currentPoint.vmaxKt,
      pcHpa: currentPoint.centralPressureHpa,
      rmaxKm,
      latDeg: currentPoint.lat,
    });
  }, [currentPoint, rmaxKm]);

  // Center coordinate
  const centerCoord: [number, number] = [landfallLatLng.lat, landfallLatLng.lng];

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden">
      <MapContainer
        center={centerCoord}
        zoom={9}
        className="w-full h-full z-10"
        zoomControl={false}
        attributionControl={false}
      >
        <MapRecenter center={centerCoord} />
        <MapClickHandler
          isCustom={scenarioId === 'custom'}
          onMapClick={(lat, lng) => setCustomLandfall({ lat, lng })}
        />

        {/* Base Map Tile Layer */}
        {mapLayerToggles.satelliteBasemap ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={17}
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={18}
          />
        )}

        {/* Cone of Uncertainty */}
        <Polygon
          positions={conePolygonCoords}
          pathOptions={{
            color: '#38bdf8',
            weight: 1,
            dashArray: '4, 4',
            fillColor: '#0284c7',
            fillOpacity: 0.12,
          }}
        />

        {/* Synthetic Track Polyline */}
        <Polyline
          positions={trackLineCoords}
          pathOptions={{
            color: '#06b6d4',
            weight: 3.5,
            opacity: 0.85,
          }}
        />

        {/* Inundation Grid Overlay (Screening Flood Depth) */}
        {mapLayerToggles.floodOverlay &&
          floodSimResult.grid.map((row, y) =>
            row.map((cell, x) => {
              if (!cell.isFlooded || cell.isSea) return null;

              // Color based on flood depth
              let fillColor = '#06b6d4'; // 0 - 0.5m: cyan
              let fillOpacity = 0.4;
              if (cell.floodDepthM >= 3.0) {
                fillColor = '#4338ca'; // indigo
                fillOpacity = 0.85;
              } else if (cell.floodDepthM >= 2.0) {
                fillColor = '#1d4ed8'; // blue
                fillOpacity = 0.75;
              } else if (cell.floodDepthM >= 1.0) {
                fillColor = '#2563eb';
                fillOpacity = 0.65;
              } else if (cell.floodDepthM >= 0.5) {
                fillColor = '#0284c7';
                fillOpacity = 0.55;
              }

              const halfStep = 0.36 / (floodSimResult.grid.length - 1) / 2;
              const bounds: [[number, number], [number, number]] = [
                [cell.lat - halfStep, cell.lng - halfStep],
                [cell.lat + halfStep, cell.lng + halfStep],
              ];

              return (
                <Rectangle
                  key={`cell_${x}_${y}`}
                  bounds={bounds}
                  pathOptions={{
                    stroke: false,
                    fillColor,
                    fillOpacity,
                  }}
                />
              );
            })
          )}

        {/* Rainfall Drainage Pooling Overlay */}
        {mapLayerToggles.rainfallPooling &&
          floodSimResult.grid.map((row, y) =>
            row.map((cell, x) => {
              if (cell.isSea || cell.rainfallAccumulationMm < 300) return null;
              const halfStep = 0.36 / (floodSimResult.grid.length - 1) / 2;
              return (
                <Rectangle
                  key={`rain_pool_${x}_${y}`}
                  bounds={[
                    [cell.lat - halfStep, cell.lng - halfStep],
                    [cell.lat + halfStep, cell.lng + halfStep],
                  ]}
                  pathOptions={{
                    color: '#6366f1',
                    weight: 1,
                    dashArray: '2, 2',
                    fillColor: '#4f46e5',
                    fillOpacity: 0.35,
                  }}
                />
              );
            })
          )}

        {/* Holland Wind Radii Circles */}
        {mapLayerToggles.windRadii && (
          <>
            {windRadii.r34KtKm > 0 && (
              <Circle
                center={[currentPoint.lat, currentPoint.lng]}
                radius={windRadii.r34KtKm * 1000}
                pathOptions={{
                  color: '#eab308',
                  weight: 1.5,
                  dashArray: '4, 4',
                  fillColor: '#ca8a04',
                  fillOpacity: 0.05,
                }}
              />
            )}
            {windRadii.r50KtKm > 0 && (
              <Circle
                center={[currentPoint.lat, currentPoint.lng]}
                radius={windRadii.r50KtKm * 1000}
                pathOptions={{
                  color: '#f97316',
                  weight: 1.5,
                  dashArray: '4, 4',
                  fillColor: '#ea580c',
                  fillOpacity: 0.08,
                }}
              />
            )}
            {windRadii.r64KtKm > 0 && (
              <Circle
                center={[currentPoint.lat, currentPoint.lng]}
                radius={windRadii.r64KtKm * 1000}
                pathOptions={{
                  color: '#ef4444',
                  weight: 2,
                  fillColor: '#dc2626',
                  fillOpacity: 0.12,
                }}
              />
            )}
          </>
        )}

        {/* Cascading Dependency Lines (Substations -> Dependent facilities) */}
        {mapLayerToggles.cascades &&
          cascadeSimResult.dependencyLines.map((line, idx) => (
            <Polyline
              key={`dep_line_${idx}`}
              positions={[line.from, line.to]}
              pathOptions={{
                color: line.isFailed ? '#ef4444' : '#059669',
                weight: line.isFailed ? 2.5 : 1.5,
                dashArray: line.isFailed ? '4, 6' : '2, 4',
                opacity: line.isFailed ? 0.9 : 0.4,
              }}
            />
          ))}

        {/* Critical Infrastructure Assets */}
        {cascadeSimResult.assets.map((asset) => (
          <Marker
            key={asset.id}
            position={[asset.lat, asset.lng]}
            icon={createAssetIcon(asset.type, asset.status, asset.status === 'failed')}
            eventHandlers={{
              click: () => selectAsset(asset),
            }}
          >
            <Popup className="dark-popup">
              <div className="p-1 space-y-1 text-xs font-sans">
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  <span>{asset.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${
                      asset.status === 'failed'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : asset.status === 'impacted'
                        ? 'bg-orange-950 text-orange-400'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                  <div>Type: {asset.type.toUpperCase()} · Elev: {asset.elevationM}m</div>
                  <div>Modeled Flood Depth: <span className="text-cyan-400 font-bold">{asset.floodDepthM}m</span></div>
                  <div>Wind Exposure: <span className="text-amber-400 font-bold">{asset.windExposureKt} kt</span></div>
                  <div>Vulnerability Index: <span className="text-rose-400 font-bold">{asset.vulnerabilityIndex}/100</span></div>
                  <div>Power: {asset.hasBackupPower ? 'Backup Genset Active' : 'Grid-Only (No Backup)'}</div>
                </div>
                <button
                  onClick={() => selectAsset(asset)}
                  className="w-full mt-1.5 px-2 py-1 text-[11px] font-medium rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  Inspect Dependencies & Cascade Score
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Cyclone Center Marker */}
        <Marker
          position={[currentPoint.lat, currentPoint.lng]}
          icon={createCycloneIcon()}
        />
      </MapContainer>

      {/* Floating Map Controls & Layer Toggles */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 p-2 rounded-lg text-xs font-mono shadow-xl">
        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800 text-[11px] text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAP LAYERS</span>
        </div>
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mapLayerToggles.floodOverlay}
            onChange={() => toggleLayer('floodOverlay')}
            className="accent-cyan-400 rounded"
          />
          <span>Surge Inundation Heat</span>
        </label>
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mapLayerToggles.rainfallPooling}
            onChange={() => toggleLayer('rainfallPooling')}
            className="accent-indigo-400 rounded"
          />
          <span>Rain Drainage Pooling (D8)</span>
        </label>
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mapLayerToggles.windRadii}
            onChange={() => toggleLayer('windRadii')}
            className="accent-amber-400 rounded"
          />
          <span>Wind Radii (34/50/64kt)</span>
        </label>
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mapLayerToggles.cascades}
            onChange={() => toggleLayer('cascades')}
            className="accent-red-400 rounded"
          />
          <span>Cascade Failure Links</span>
        </label>
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none pt-1 border-t border-slate-800">
          <input
            type="checkbox"
            checked={mapLayerToggles.satelliteBasemap}
            onChange={() => toggleLayer('satelliteBasemap')}
            className="accent-emerald-400 rounded"
          />
          <span>Satellite Imagery Basemap</span>
        </label>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono shadow-xl space-y-2 select-none">
        <div>
          <div className="text-[10px] text-slate-400 mb-1">MODELED FLOOD DEPTH (m)</div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-2.5 rounded bg-cyan-400" title="0 - 0.5m" />
            <span className="w-5 h-2.5 rounded bg-sky-500" title="0.5 - 1.0m" />
            <span className="w-5 h-2.5 rounded bg-blue-600" title="1.0 - 2.0m" />
            <span className="w-5 h-2.5 rounded bg-blue-800" title="2.0 - 3.0m" />
            <span className="w-5 h-2.5 rounded bg-indigo-900" title="3.0m+" />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>0m</span>
            <span>1m</span>
            <span>2m</span>
            <span>3m+</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> At Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> Impacted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Failed
          </span>
        </div>
      </div>
    </div>
  );
};
