import { useState, useEffect, useRef } from "react";

const PROVINCE_COLORS = {
  1: "#e84545",
  2: "#2ecc71",
  3: "#3498db",
  4: "#48dbfb",
  5: "#a3cb38",
  6: "#f9ca24",
  7: "#f0932b",
};

const PROVINCE_NAMES = {
  1: "Koshi Province",
  2: "Madhesh Province",
  3: "Bagmati Province",
  4: "Gandaki Province",
  5: "Lumbini Province",
  6: "Karnali Province",
  7: "Sudurpashchim Province",
};

// Province GeoJSON data - paste your provinceData variable here
// import provinceData from './nepal-province.js';

// District GeoJSON sets - paste your province_1 through province_7 here
// import { province_1, province_2, ... } from './district-data.js';

export default function NepalMap({
  provinceData,         // GeoJSON FeatureCollection for provinces
  districtData = {},    // Object: { 1: province_1, 2: province_2, ... }
  onDistrictClick,      // Optional: async (districtName) => districtInfo
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const provinceLayerRef = useRef(null);
  const districtLayerRef = useRef(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtInfo, setDistrictInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMapRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      touchZoom: true,
      doubleClickZoom: false,
      zoomControl: true,
      dragging: true,
    }).setView([28.3949, 84.124], 7);
    leafletMapRef.current = map;
  }, [leafletLoaded]);

  // Render province layer
  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map || !provinceData) return;

    if (provinceLayerRef.current) map.removeLayer(provinceLayerRef.current);

    const layer = L.geoJson(provinceData, {
      style: (feature) => ({
        weight: 2,
        opacity: 1,
        color: "#fff",
        dashArray: "1",
        fillOpacity: 0.7,
        fillColor: PROVINCE_COLORS[feature.properties.Province] || "#ccc",
      }),
      onEachFeature: (feature, lyr) => {
        const provNum = feature.properties.Province;
        lyr.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 3, color: "#333", fillOpacity: 0.85 });
            e.target.bringToFront();
          },
          mouseout: (e) => layer.resetStyle(e.target),
          click: (e) => {
            map.fitBounds(e.target.getBounds());
            setSelectedProvince(provNum);
            setSelectedDistrict(null);
            setDistrictInfo(null);
          },
        });
        lyr.bindTooltip(PROVINCE_NAMES[provNum] || `Province ${provNum}`, {
          sticky: true,
          className: "nepal-tooltip",
        });
      },
    }).addTo(map);

    provinceLayerRef.current = layer;
    map.fitBounds(layer.getBounds());
  }, [leafletLoaded, provinceData]);

  // Render district layer when a province is selected
  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    if (districtLayerRef.current) {
      map.removeLayer(districtLayerRef.current);
      districtLayerRef.current = null;
    }

    if (!selectedProvince) return;

console.log("Selected Province:", selectedProvince);
console.log("District Data:", districtData);

const json = districtData[selectedProvince];

console.log("GeoJSON:", json);

    const provColor = PROVINCE_COLORS[selectedProvince] || "#999";

    const dlayer = L.geoJson(json, {
      style: () => ({
        weight: 1.5,
        opacity: 1,
        color: "#fff",
        fillOpacity: 0.65,
        fillColor: provColor,
      }),
      onEachFeature: (feature, lyr) => {
        const distName =
          feature.properties.DISTRICT ||
          feature.properties.DIST_NAME ||
          feature.properties.name ||
          "Unknown";
        lyr.bindTooltip(distName, {
          permanent: true,
          direction: "center",
          className: "district-label",
        }).openTooltip();
        lyr.on({
          mouseover: (e) => {
            e.target.setStyle({ fillOpacity: 0.9, weight: 2, color: "#222" });
            e.target.bringToFront();
          },
          mouseout: (e) => dlayer.resetStyle(e.target),
          click: async (e) => {
            setSelectedDistrict(distName);
            setDistrictInfo(null);
            if (onDistrictClick) {
              setLoading(true);
              try {
                const info = await onDistrictClick(
                  feature.properties.DIST_NAME || distName
                );
                setDistrictInfo(info);
              } catch (err) {
                setDistrictInfo({ error: "Could not load district data." });
              } finally {
                setLoading(false);
              }
            }
          },
        });
      },
    }).addTo(map);

    districtLayerRef.current = dlayer;
  }, [selectedProvince, districtData]);

  const handleBackToProvinces = () => {
    const map = leafletMapRef.current;
    if (map && provinceLayerRef.current) {
      map.fitBounds(provinceLayerRef.current.getBounds());
    }
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setDistrictInfo(null);
  };

  return (
    <div style={{ fontFamily: "sans-serif", position: "relative" }}>
      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", background: "#f7f7f7",
        borderBottom: "1px solid #e0e0e0", fontSize: 14,
      }}>
        <span
          onClick={handleBackToProvinces}
          style={{
            cursor: selectedProvince ? "pointer" : "default",
            color: selectedProvince ? "#3498db" : "#333",
            fontWeight: 500,
          }}
        >
          🗺 Nepal
        </span>
        {selectedProvince && (
          <>
            <span style={{ color: "#aaa" }}>›</span>
            <span style={{
              color: selectedDistrict ? "#3498db" : "#333",
              cursor: selectedDistrict ? "pointer" : "default",
              fontWeight: 500,
            }}
              onClick={() => {
                if (selectedDistrict) {
                  setSelectedDistrict(null);
                  setDistrictInfo(null);
                }
              }}
            >
              {PROVINCE_NAMES[selectedProvince]}
            </span>
          </>
        )}
        {selectedDistrict && (
          <>
            <span style={{ color: "#aaa" }}>›</span>
            <span style={{ color: "#333", fontWeight: 500 }}>{selectedDistrict}</span>
          </>
        )}
      </div>

      <div style={{ display: "flex" }}>
        {/* Map */}
        <div ref={mapRef} style={{ flex: 1, height: 520 }} />

        {/* Info Panel */}
        {(selectedDistrict || selectedProvince) && (
          <div style={{
            width: 260, padding: 16, background: "#fff",
            borderLeft: "1px solid #e0e0e0", overflowY: "auto",
          }}>
            {selectedDistrict ? (
              <>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#222" }}>
                  {selectedDistrict}
                </h3>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>
                  {PROVINCE_NAMES[selectedProvince]}
                </p>
                {loading && (
                  <p style={{ fontSize: 13, color: "#999" }}>Loading...</p>
                )}
                {districtInfo && !districtInfo.error && (
                  <div style={{ fontSize: 14 }}>
                    {districtInfo.total_population && (
                      <div style={infoRow}>
                        <span style={infoLabel}>Total population</span>
                        <span style={infoVal}>
                          {Number(districtInfo.total_population).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {districtInfo.no_of_female && (
                      <div style={infoRow}>
                        <span style={infoLabel}>Female</span>
                        <span style={infoVal}>
                          {Number(districtInfo.no_of_female).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {districtInfo.no_of_male && (
                      <div style={infoRow}>
                        <span style={infoLabel}>Male</span>
                        <span style={infoVal}>
                          {Number(districtInfo.no_of_male).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {districtInfo.province && (
                      <div style={infoRow}>
                        <span style={infoLabel}>Province</span>
                        <span style={infoVal}>{districtInfo.province}</span>
                      </div>
                    )}
                  </div>
                )}
                {districtInfo?.error && (
                  <p style={{ fontSize: 13, color: "#e84545" }}>{districtInfo.error}</p>
                )}
                {!loading && !districtInfo && onDistrictClick && (
                  <p style={{ fontSize: 13, color: "#aaa" }}>
                    Click a district to load data.
                  </p>
                )}
                {!onDistrictClick && (
                  <p style={{ fontSize: 13, color: "#aaa" }}>
                    Pass an <code>onDistrictClick</code> prop to load live data.
                  </p>
                )}
              </>
            ) : selectedProvince ? (
              <>
                <div style={{
                  width: 32, height: 32, borderRadius: 6, marginBottom: 10,
                  background: PROVINCE_COLORS[selectedProvince],
                }} />
                <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "#222" }}>
                  {PROVINCE_NAMES[selectedProvince]}
                </h3>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
                  Click a district on the map to explore it.
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 36, left: 12,
        background: "rgba(255,255,255,0.92)", borderRadius: 8,
        padding: "8px 12px", fontSize: 12, zIndex: 1000,
        border: "1px solid #e0e0e0",
      }}>
        {Object.entries(PROVINCE_NAMES).map(([num, name]) => (
          <div key={num} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: PROVINCE_COLORS[num], flexShrink: 0,
            }} />
            <span style={{ color: "#444" }}>{name}</span>
          </div>
        ))}
      </div>

      <style>{`
        .nepal-tooltip { background: #fff; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px; font-weight: 500; padding: 4px 8px; border-radius: 4px; }
        .district-label { background: transparent !important; border: none !important; box-shadow: none !important; font-size: 10px; font-weight: 600; color: #333; white-space: nowrap; }
        .leaflet-tooltip-own-shadow .district-label { box-shadow: none; }
      `}</style>
    </div>
  );
}

const infoRow = {
  display: "flex", justifyContent: "space-between",
  padding: "6px 0", borderBottom: "1px solid #f0f0f0",
};
const infoLabel = { color: "#888" };
const infoVal = { color: "#222", fontWeight: 500 };
