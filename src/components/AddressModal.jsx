import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { detectCurrentLocation, loadSavedLocation, reverseGeocode } from "../utils/locationService";
import { getPhoneCountry, validateAndNormalizePhone } from "../utils/phoneValidation";

const defaultForm = {
  house: "",
  building: "",
  area: "",
  landmark: "",
  pincode: "",
  receiverName: "",
  receiverPhone: "",
  type: "Home",
  latitude: "",
  longitude: "",
  mapLabel: ""
};

const DEFAULT_MAP_CENTER = {
  latitude: 17.385044,
  longitude: 78.486671,
  zoom: 16,
};

const STATIC_MAP_SIZE = {
  width: 640,
  height: 320,
};

function buildStaticMapSources(latitude, longitude, zoom) {
  return [
    `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${STATIC_MAP_SIZE.width}x${STATIC_MAP_SIZE.height}&markers=${latitude},${longitude},red-pushpin`,
    `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${longitude},${latitude}&z=${zoom}&size=${STATIC_MAP_SIZE.width},${STATIC_MAP_SIZE.height}&l=map&pt=${longitude},${latitude},pm2rdm`,
  ];
}

function buildMapBrowserUrl(latitude, longitude, zoom) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
}

function isValidCoordinatePair(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function latLngToWorld(latitude, longitude, zoom) {
  const scale = 256 * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x, y, zoom) {
  const scale = 256 * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

function pixelToLatLng(centerLatitude, centerLongitude, zoom, pixelX, pixelY, width, height) {
  const centerWorld = latLngToWorld(centerLatitude, centerLongitude, zoom);
  const worldX = centerWorld.x + (pixelX - width / 2);
  const worldY = centerWorld.y + (pixelY - height / 2);
  return worldToLatLng(worldX, worldY, zoom);
}

const ADDRESS_TEXT_PATTERN = /^[A-Za-z0-9\s,.'/#()-]+$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function validateAddressText(value, { label, min = 2, max = 80, required = false, pattern = ADDRESS_TEXT_PATTERN }) {
  const trimmed = normalizeSpace(value);
  if (!trimmed) return required ? `Enter ${label.toLowerCase()}.` : "";
  if (trimmed.length < min) return `${label} is too short.`;
  if (trimmed.length > max) return `${label} is too long.`;
  if (!pattern.test(trimmed)) return `Enter a valid ${label.toLowerCase()}.`;
  return "";
}

export default function AddressModal({ isOpen, onClose, onSave, initialData, t: _t, region = "in" }) {
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [locationInfo, setLocationInfo] = useState(() => loadSavedLocation());
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapSaving, setMapSaving] = useState(false);
  const [coordinateLoading, setCoordinateLoading] = useState(false);
  const [coordinateInputs, setCoordinateInputs] = useState({ latitude: "", longitude: "" });
  const [mapImageIndex, setMapImageIndex] = useState(0);
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [mapSelection, setMapSelection] = useState(() => {
    const savedLocation = loadSavedLocation();
    return {
      latitude: savedLocation?.latitude ?? DEFAULT_MAP_CENTER.latitude,
      longitude: savedLocation?.longitude ?? DEFAULT_MAP_CENTER.longitude,
      zoom: DEFAULT_MAP_CENTER.zoom,
    };
  });
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? document.body.dataset.theme || "light" : "light"));
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const isDark = theme === "dark";
  const isMobileSheet = viewportWidth <= 560;
  const isCompactLayout = viewportWidth <= 640;
  const phoneCountry = useMemo(() => getPhoneCountry(region), [region]);
  const palette = isDark
    ? {
        overlay: "rgba(3, 8, 18, 0.72)",
        modalBg: "linear-gradient(180deg, rgba(13,24,40,0.98), rgba(17,31,50,0.98))",
        softBg: "linear-gradient(135deg, rgba(15,91,215,0.14), rgba(17,31,50,0.94))",
        panelBg: "#101b2d",
        border: "rgba(74,95,130,0.42)",
        text: "#f5f8ff",
        subtext: "#9eb0cb",
        chipText: "#c6d4eb",
      }
    : {
        overlay: "rgba(10,20,40,0.56)",
        modalBg: "white",
        softBg: "linear-gradient(135deg, #f8fbff, #eef5ff)",
        panelBg: "#fff",
        border: "#e2e8f0",
        text: "#253d4e",
        subtext: "#64748b",
        chipText: "#64748b",
      };

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultForm, ...initialData });
    } else {
      setFormData(defaultForm);
    }
    setFormErrors({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const source = initialData || locationInfo;
    setLocationError("");
    setMapSelection((prev) => ({
      latitude: Number(source?.latitude) || prev.latitude || DEFAULT_MAP_CENTER.latitude,
      longitude: Number(source?.longitude) || prev.longitude || DEFAULT_MAP_CENTER.longitude,
      zoom: prev.zoom || DEFAULT_MAP_CENTER.zoom,
    }));
    setCoordinateInputs({
      latitude: source?.latitude ? String(source.latitude) : "",
      longitude: source?.longitude ? String(source.longitude) : "",
    });
  }, [initialData, isOpen, locationInfo]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const syncTheme = () => setTheme(document.body.dataset.theme || "light");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    window.dispatchEvent(new CustomEvent("prime-address-overlay", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("prime-address-overlay", { detail: { open: false } }));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getFieldError = (field) => formErrors[field] || "";

  const validateField = (field, rawValue = formData[field]) => {
    const value = typeof rawValue === "string" ? rawValue : String(rawValue || "");
    const phoneDigits = value.replace(/\D/g, "");
    const pincodeDigits = value.replace(/\D/g, "");

    switch (field) {
      case "house":
        return validateAddressText(value, { label: "house or flat details", required: true, min: 2, max: 60 });
      case "building":
        return validateAddressText(value, { label: "building", min: 2, max: 60 });
      case "area":
        return validateAddressText(value, { label: "area, street, or locality", required: true, min: 3, max: 90 });
      case "landmark":
        return validateAddressText(value, { label: "landmark", min: 3, max: 80 });
      case "pincode":
        if (!pincodeDigits) return "Enter pincode.";
        if (region === "ke") return /^\d{5}$/.test(pincodeDigits) ? "" : "Enter a valid 5-digit postal code.";
        return /^\d{6}$/.test(pincodeDigits) ? "" : "Enter a valid 6-digit pincode.";
      case "receiverName": {
        const trimmed = normalizeSpace(value);
        if (!trimmed) return "Enter receiver name.";
        if (!NAME_PATTERN.test(trimmed)) return "Enter a valid receiver name.";
        return "";
      }
      case "receiverPhone": {
        if (!phoneDigits) return "Enter phone number.";
        const validation = validateAndNormalizePhone(region, phoneDigits);
        return validation.isValid ? "" : validation.error || "Enter a valid phone number.";
      }
      default:
        return "";
    }
  };

  const handleFieldBlur = (field) => {
    const error = validateField(field);
    setFormErrors((prev) => {
      if (!error) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      if (prev[field] === error) return prev;
      return { ...prev, [field]: error };
    });
  };

  const getFieldStyle = (field) => ({
    width: "100%",
    padding: "11px 12px",
    borderRadius: "12px",
    border: `1.5px solid ${getFieldError(field) ? "#dc2626" : palette.border}`,
    outline: "none",
    background: palette.panelBg,
    color: palette.text,
    boxShadow: getFieldError(field) ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
  });

  const handleSave = () => {
    const nextErrors = {};
    const fieldsToCheck = ["house", "building", "area", "landmark", "pincode", "receiverName", "receiverPhone"];
    const phoneValidation = validateAndNormalizePhone(region, String(formData.receiverPhone || "").replace(/\D/g, ""));

    fieldsToCheck.forEach((field) => {
      const error = validateField(field);
      if (error) nextErrors[field] = error;
    });

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setLocationError("Please complete the highlighted address details.");
      return;
    }

    setFormErrors({});
    setLocationError("");
    onSave({
      ...formData,
      house: normalizeSpace(formData.house),
      building: normalizeSpace(formData.building),
      area: normalizeSpace(formData.area),
      landmark: normalizeSpace(formData.landmark),
      pincode: String(formData.pincode || "").replace(/\D/g, ""),
      receiverName: normalizeSpace(formData.receiverName),
      receiverPhone: phoneValidation.normalized || String(formData.receiverPhone || "").replace(/\D/g, ""),
    });
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    setLocationError("");
    setFormErrors((prev) => {
      if (!prev.area && !prev.pincode) return prev;
      const next = { ...prev };
      delete next.area;
      delete next.pincode;
      return next;
    });
    try {
      const location = await detectCurrentLocation();
      setLocationInfo(location);
      setMapSelection((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      setCoordinateInputs({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      });
      setFormData((prev) => ({
        ...prev,
        area: prev.area || location.area || location.label,
        landmark: prev.landmark || location.landmark || location.fullAddress,
        pincode: prev.pincode || location.pincode || "",
        latitude: location.latitude,
        longitude: location.longitude,
        mapLabel: location.fullAddress || location.label,
      }));
    } catch (error) {
      setLocationError(error.message || "Unable to detect location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const applyCoordinateLocation = async (latitudeValue, longitudeValue) => {
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);

    if (!isValidCoordinatePair(latitude, longitude)) {
      throw new Error("Enter valid latitude and longitude values.");
    }

    const location = await reverseGeocode(latitude, longitude);
    setFormErrors((prev) => {
      if (!prev.area && !prev.pincode) return prev;
      const next = { ...prev };
      delete next.area;
      delete next.pincode;
      return next;
    });
    setLocationInfo(location);
    setMapSelection((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    setCoordinateInputs({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    setFormData((prev) => ({
      ...prev,
      area: location.area || prev.area || location.label,
      landmark: location.landmark || prev.landmark || location.fullAddress,
      pincode: location.pincode || prev.pincode || "",
      latitude: location.latitude,
      longitude: location.longitude,
      mapLabel: location.fullAddress || location.label,
    }));
    return location;
  };

  const handleCoordinateApply = async () => {
    setCoordinateLoading(true);
    setLocationError("");
    try {
      await applyCoordinateLocation(coordinateInputs.latitude, coordinateInputs.longitude);
    } catch (error) {
      setLocationError(error.message || "Unable to use the entered coordinates.");
    } finally {
      setCoordinateLoading(false);
    }
  };

  const handleMapSurfaceClick = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width) * STATIC_MAP_SIZE.width;
    const offsetY = ((event.clientY - bounds.top) / bounds.height) * STATIC_MAP_SIZE.height;
    const pickedLocation = pixelToLatLng(
      mapSelection.latitude,
      mapSelection.longitude,
      mapSelection.zoom,
      offsetX,
      offsetY,
      STATIC_MAP_SIZE.width,
      STATIC_MAP_SIZE.height
    );

    setMapSelection((prev) => ({
      ...prev,
      latitude: pickedLocation.latitude,
      longitude: pickedLocation.longitude,
    }));
  };

  const handleMapLocationSave = async () => {
    setMapSaving(true);
    setLocationError("");
    try {
      await applyCoordinateLocation(mapSelection.latitude, mapSelection.longitude);
      setIsMapOpen(false);
    } catch (error) {
      setLocationError(error.message || "Unable to save the selected map location.");
    } finally {
      setMapSaving(false);
    }
  };

  const mapSources = buildStaticMapSources(
    mapSelection.latitude,
    mapSelection.longitude,
    mapSelection.zoom
  );
  const currentMapSource = mapSources[Math.min(mapImageIndex, mapSources.length - 1)];

  const modalMarkup = (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: palette.overlay,
        display: "flex",
        alignItems: isMobileSheet ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(8px)",
        padding: isMobileSheet ? "0" : "12px"
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
        background: palette.modalBg,
        width: isMobileSheet ? "100%" : "min(560px, calc(100vw - 24px))",
        maxWidth: isMobileSheet ? "100%" : "min(560px, calc(100vw - 24px))",
        borderRadius: isMobileSheet ? "22px 22px 0 0" : "24px",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        animation: isMobileSheet ? "slideUp 0.24s ease-out" : "modalFade 0.18s ease-out",
        boxShadow: "0 30px 70px rgba(15,23,42,0.22)",
        maxHeight: isMobileSheet ? "min(90vh, 100vh)" : "calc(100vh - 24px)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${palette.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 800, color: palette.text }}>Enter Address Details</h3>
            <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: palette.subtext }}>Keep this compact and accurate for faster delivery.</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: palette.panelBg, border: `1px solid ${palette.border}`, width: 38, height: 38, borderRadius: 12, fontSize: "1.15rem", cursor: "pointer", color: palette.subtext }}
          >
            &times;
          </button>
        </div>

        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "16px 16px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px",
              borderRadius: "18px",
              background: palette.softBg,
              border: `1px solid ${palette.border}`,
              marginBottom: "14px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1d5ba0" }}>Current location</div>
              <div style={{ marginTop: "6px", fontSize: "0.84rem", color: palette.text, lineHeight: 1.5 }}>
                {locationInfo?.fullAddress || "Use your current location to fill the nearby address details faster."}
              </div>
            </div>
            <div className="address-location-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%", flexDirection: isCompactLayout ? "column" : "row" }}>
              <button
                type="button"
                className="address-detect-btn"
                onClick={handleDetectLocation}
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #0f5bd7, #2563eb)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  boxShadow: "0 14px 26px rgba(15,91,215,0.18)",
                  flex: 1,
                }}
              >
                <i className={`fas ${locationLoading ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`}></i>
                {locationLoading ? "Detecting..." : "Use my location"}
              </button>
              <button
                type="button"
                className="address-map-btn"
                onClick={() => {
                  setMapImageIndex(0);
                  setMapImageFailed(false);
                  setIsMapOpen(true);
                }}
                style={{
                  borderRadius: "14px",
                  padding: "12px 16px",
                  background: palette.panelBg,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  flex: 1,
                }}
              >
                <i className="fas fa-map-location-dot"></i>
                Pick on map
              </button>
            </div>
          </div>

          {locationError && (
            <div style={{ marginBottom: "14px", color: "#dc2626", fontSize: "0.82rem", fontWeight: 700 }}>
              {locationError}
            </div>
          )}

          <div
            style={{
              padding: "12px",
              borderRadius: "18px",
              background: palette.panelBg,
              border: `1px solid ${palette.border}`,
              marginBottom: "14px",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: palette.subtext }}>
              Use coordinates manually
            </div>
            <div style={{ marginTop: "6px", fontSize: "0.8rem", color: palette.subtext, lineHeight: 1.5 }}>
              Enter latitude and longitude to auto-fill the nearby area details.
            </div>
            <div className="address-coordinate-row" style={{ display: "grid", gridTemplateColumns: isCompactLayout ? "1fr" : "1fr 1fr auto", gap: "10px", marginTop: "12px" }}>
              <input
                type="text"
                placeholder="Latitude"
                value={coordinateInputs.latitude}
                onChange={(e) => setCoordinateInputs((prev) => ({ ...prev, latitude: e.target.value }))}
                style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: `1.5px solid ${palette.border}`, outline: "none", background: palette.panelBg, color: palette.text }}
              />
              <input
                type="text"
                placeholder="Longitude"
                value={coordinateInputs.longitude}
                onChange={(e) => setCoordinateInputs((prev) => ({ ...prev, longitude: e.target.value }))}
                style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: `1.5px solid ${palette.border}`, outline: "none", background: palette.panelBg, color: palette.text }}
              />
              <button
                type="button"
                className="address-map-btn"
                onClick={handleCoordinateApply}
                style={{
                  borderRadius: "12px",
                  padding: "11px 14px",
                  background: palette.panelBg,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {coordinateLoading ? "Locating..." : "Use"}
              </button>
            </div>
          </div>

          <div className="address-modal-grid" style={{ display: "grid", gridTemplateColumns: isCompactLayout ? "1fr" : "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>HOUSE / FLAT</label>
              <input
                type="text"
                placeholder="Flat 402"
                value={formData.house}
                onChange={(e) => setFieldValue("house", e.target.value)}
                onBlur={() => handleFieldBlur("house")}
                style={getFieldStyle("house")}
              />
              {getFieldError("house") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("house")}</div>}
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>BUILDING</label>
              <input
                type="text"
                placeholder="Sunshine Apartments"
                value={formData.building}
                onChange={(e) => setFieldValue("building", e.target.value)}
                onBlur={() => handleFieldBlur("building")}
                style={getFieldStyle("building")}
              />
              {getFieldError("building") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("building")}</div>}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>AREA / STREET / LOCALITY</label>
              <input
                type="text"
                placeholder="KPHB Phase 1"
                value={formData.area}
                onChange={(e) => setFieldValue("area", e.target.value)}
                onBlur={() => handleFieldBlur("area")}
                style={getFieldStyle("area")}
              />
              {getFieldError("area") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("area")}</div>}
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>LANDMARK</label>
              <input
                type="text"
                placeholder="Near metro / bank"
                value={formData.landmark}
                onChange={(e) => setFieldValue("landmark", e.target.value)}
                onBlur={() => handleFieldBlur("landmark")}
                style={getFieldStyle("landmark")}
              />
              {getFieldError("landmark") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("landmark")}</div>}
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>PINCODE</label>
              <input
                type="text"
                placeholder="500085"
                value={formData.pincode}
                inputMode="numeric"
                maxLength={region === "ke" ? 5 : 6}
                onChange={(e) => setFieldValue("pincode", e.target.value.replace(/\D/g, "").slice(0, region === "ke" ? 5 : 6))}
                onBlur={() => handleFieldBlur("pincode")}
                style={getFieldStyle("pincode")}
              />
              {getFieldError("pincode") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("pincode")}</div>}
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>RECEIVER NAME</label>
              <input
                type="text"
                placeholder="Nikhil"
                value={formData.receiverName}
                onChange={(e) => setFieldValue("receiverName", e.target.value)}
                onBlur={() => handleFieldBlur("receiverName")}
                style={getFieldStyle("receiverName")}
              />
              {getFieldError("receiverName") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("receiverName")}</div>}
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "6px", display: "block" }}>PHONE</label>
              <div className="address-phone-row" style={{ display: "flex", gap: "10px", alignItems: "stretch", flexDirection: "row" }}>
                <div style={{ minWidth: isCompactLayout ? "76px" : "84px", padding: "11px 12px", display: "flex", alignItems: "center", justifyContent: "center", background: palette.panelBg, border: `1.5px solid ${palette.border}`, borderRadius: "12px", color: palette.subtext, fontWeight: 700, whiteSpace: "nowrap" }}>{phoneCountry.dial}</div>
                <input
                  type="text"
                  placeholder={phoneCountry.code === "IN" ? "8519913550" : "712345678"}
                  value={formData.receiverPhone}
                  inputMode="tel"
                  maxLength={phoneCountry.code === "IN" ? 10 : 10}
                  onChange={(e) => setFieldValue("receiverPhone", e.target.value.replace(/\D/g, "").slice(0, phoneCountry.code === "IN" ? 10 : 10))}
                  onBlur={() => handleFieldBlur("receiverPhone")}
                  style={{ ...getFieldStyle("receiverPhone"), flex: 1, minWidth: 0 }}
                />
              </div>
              {getFieldError("receiverPhone") && <div style={{ marginTop: "6px", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{getFieldError("receiverPhone")}</div>}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: palette.subtext, marginBottom: "10px", display: "block" }}>SAVE ADDRESS AS</label>
              <div className="address-type-row" style={{ display: "flex", gap: "10px", flexDirection: isCompactLayout ? "column" : "row" }}>
                {[
                  { id: "Home", icon: "fa-home" },
                  { id: "Work", icon: "fa-briefcase" },
                  { id: "Other", icon: "fa-location-dot" }
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setFormData({ ...formData, type: item.id })}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "14px",
                      border: formData.type === item.id ? "2px solid #1d5ba0" : `1.5px solid ${palette.border}`,
                      background: formData.type === item.id ? (isDark ? "rgba(15,91,215,0.18)" : "#f0f5ff") : palette.panelBg,
                      color: formData.type === item.id ? "#1d5ba0" : palette.subtext,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="address-modal-actions" style={{ padding: "16px", borderTop: `1px solid ${palette.border}`, display: "flex", gap: "10px", flexShrink: 0, background: palette.modalBg, flexDirection: isCompactLayout ? "column" : "row" }}>
          <button
            type="button"
            className="address-secondary-btn"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "14px",
              background: palette.panelBg,
              color: palette.subtext,
              border: `1px solid ${palette.border}`,
              fontWeight: 800,
              cursor: "pointer",
              transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease"
            }}
          >
            Cancel
          </button>
          <button
            className="address-primary-btn"
            onClick={handleSave}
            style={{
              flex: 1.2,
              padding: "13px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0f5bd7, #2563eb)",
              color: "white",
              border: "none",
              fontWeight: 800,
              fontSize: "0.96rem",
              cursor: "pointer",
              boxShadow: "0 12px 26px rgba(29, 91, 160, 0.22)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease"
            }}
          >
            Save Address
          </button>
        </div>
      </div>
      {isMapOpen && (
        <div
          className="address-map-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.56)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2200,
            padding: "16px",
          }}
          onClick={() => setIsMapOpen(false)}
        >
          <div
            className="address-map-dialog"
            style={{
              width: isCompactLayout ? "100%" : "min(720px, calc(100vw - 24px))",
              background: palette.modalBg,
              borderRadius: "24px",
              border: `1px solid ${palette.border}`,
              boxShadow: "0 30px 70px rgba(15,23,42,0.28)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: isCompactLayout ? "calc(100vh - 16px)" : "calc(100vh - 24px)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${palette.border}`,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: palette.text }}>Choose delivery point</h3>
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: palette.subtext }}>
                  Tap anywhere on the map to move the pin, then save that location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                style={{ background: palette.panelBg, border: `1px solid ${palette.border}`, width: 38, height: 38, borderRadius: 12, fontSize: "1.05rem", cursor: "pointer", color: palette.subtext }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "16px", flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
              <div
                className="address-map-surface"
                onClick={handleMapSurfaceClick}
                style={{
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: `1px solid ${palette.border}`,
                  background: isDark ? "#0f1728" : "#f8fafc",
                  cursor: "crosshair",
                }}
              >
                {currentMapSource && !mapImageFailed ? (
                  <img
                    src={currentMapSource}
                    alt="Location picker map"
                    onLoad={() => setMapImageFailed(false)}
                    onError={() => {
                      if (mapImageIndex < mapSources.length - 1) {
                        setMapImageIndex((prev) => prev + 1);
                      } else {
                        setMapImageFailed(true);
                      }
                    }}
                    style={{ display: "block", width: "100%", height: "auto", aspectRatio: "2 / 1", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      aspectRatio: "2 / 1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "20px",
                      color: palette.subtext,
                      textAlign: "center",
                    }}
                  >
                    <strong style={{ color: palette.text }}>Map preview unavailable</strong>
                    <span style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
                      You can still enter coordinates manually below or open the live map in a new tab.
                    </span>
                    <a
                      href={buildMapBrowserUrl(mapSelection.latitude, mapSelection.longitude, mapSelection.zoom)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1d5ba0", fontWeight: 800 }}
                    >
                      Open map in browser
                    </a>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -100%)",
                    color: "#dc2626",
                    fontSize: "1.5rem",
                    textShadow: "0 8px 20px rgba(15,23,42,0.22)",
                    pointerEvents: "none",
                  }}
                >
                  <i className="fas fa-map-pin"></i>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                }}
              >
                <div style={{ color: palette.subtext, fontSize: "0.8rem", lineHeight: 1.55 }}>
                  <strong style={{ color: palette.text, display: "block", marginBottom: "4px" }}>Pinned coordinates</strong>
                  {mapSelection.latitude.toFixed(5)}, {mapSelection.longitude.toFixed(5)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setMapSelection((prev) => ({ ...prev, zoom: Math.max(12, prev.zoom - 1) }))}
                    style={{ width: 38, height: 38, borderRadius: "12px", border: `1px solid ${palette.border}`, background: palette.panelBg, color: palette.text, cursor: "pointer" }}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapSelection((prev) => ({ ...prev, zoom: Math.min(18, prev.zoom + 1) }))}
                    style={{ width: 38, height: 38, borderRadius: "12px", border: `1px solid ${palette.border}`, background: palette.panelBg, color: palette.text, cursor: "pointer" }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              <div className="address-coordinate-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", marginTop: "14px" }}>
                <input
                  type="text"
                  placeholder="Latitude"
                  value={coordinateInputs.latitude}
                  onChange={(e) => setCoordinateInputs((prev) => ({ ...prev, latitude: e.target.value }))}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: `1.5px solid ${palette.border}`, outline: "none", background: palette.panelBg, color: palette.text }}
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={coordinateInputs.longitude}
                  onChange={(e) => setCoordinateInputs((prev) => ({ ...prev, longitude: e.target.value }))}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: `1.5px solid ${palette.border}`, outline: "none", background: palette.panelBg, color: palette.text }}
                />
                <button
                  type="button"
                  className="address-map-btn"
                  onClick={async () => {
                    setCoordinateLoading(true);
                    setLocationError("");
                    try {
                      const location = await applyCoordinateLocation(coordinateInputs.latitude, coordinateInputs.longitude);
                      setMapSelection((prev) => ({
                        ...prev,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }));
                      setMapImageIndex(0);
                      setMapImageFailed(false);
                    } catch (error) {
                      setLocationError(error.message || "Unable to use the entered coordinates.");
                    } finally {
                      setCoordinateLoading(false);
                    }
                  }}
                  style={{
                    borderRadius: "12px",
                    padding: "11px 14px",
                    background: palette.panelBg,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {coordinateLoading ? "Updating..." : "Update map"}
                </button>
              </div>
            </div>

            <div className="address-map-actions" style={{ padding: "16px", borderTop: `1px solid ${palette.border}`, display: "flex", gap: "10px", flexShrink: 0, background: palette.modalBg }}>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "14px",
                  background: palette.panelBg,
                  color: palette.subtext,
                  border: `1px solid ${palette.border}`,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMapLocationSave}
                style={{
                  flex: 1.2,
                  padding: "13px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0f5bd7, #2563eb)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 26px rgba(29, 91, 160, 0.22)",
                }}
              >
                {mapSaving ? "Saving..." : "Use this location"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes modalFade {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-content input::placeholder {
          color: ${isDark ? "#7587a4" : "#94a3b8"};
        }
        .address-map-btn:hover,
        .address-detect-btn:hover,
        .address-primary-btn:hover,
        .address-secondary-btn:hover {
          transform: translateY(-1px);
        }
        .address-detect-btn:hover,
        .address-primary-btn:hover {
          box-shadow: 0 18px 30px rgba(15,91,215,0.24);
          filter: saturate(1.04);
        }
        .address-secondary-btn:hover {
          background: ${isDark ? "rgba(148,163,184,0.12)" : "#eef2f7"};
          box-shadow: 0 10px 18px rgba(148,163,184,0.14);
        }
        .address-map-btn:hover {
          background: ${isDark ? "rgba(148,163,184,0.12)" : "#eef2f7"};
          box-shadow: 0 10px 18px rgba(148,163,184,0.14);
        }
        .address-detect-btn:active,
        .address-primary-btn:active,
        .address-secondary-btn:active {
          transform: scale(0.985);
        }
        @media (max-width: 640px) {
          .address-primary-btn,
          .address-secondary-btn,
          .address-detect-btn,
          .address-map-btn {
            width: 100%;
            justify-content: center;
          }
          .address-map-dialog {
            width: 100% !important;
            max-height: calc(100vh - 16px);
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") return modalMarkup;
  return createPortal(modalMarkup, document.body);
}
