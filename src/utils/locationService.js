import { safeLocalGet, safeLocalSet } from "./safeStorage";
import { fetchWithTimeout } from "./network";

const LOCATION_STORAGE_KEY = "pb_detected_location";
const REVERSE_GEOCODE_TIMEOUT_MS = 12000;

function formatCoord(value) {
  return Number(value).toFixed(5);
}

function buildFallbackLabel(latitude, longitude) {
  return `Lat ${formatCoord(latitude)}, Lng ${formatCoord(longitude)}`;
}

function buildAddressParts(address = {}) {
  return [
    address.road,
    address.suburb,
    address.neighbourhood,
    address.city || address.town || address.village,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);
}

export function loadSavedLocation() {
  const raw = safeLocalGet(LOCATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDetectedLocation(location) {
  safeLocalSet(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
      REVERSE_GEOCODE_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error("Reverse geocode failed");
    }

    const data = await response.json();
    const address = data.address || {};
    const fullParts = buildAddressParts(address);
    const shortLabel =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.state ||
      buildFallbackLabel(latitude, longitude);

    return {
      latitude,
      longitude,
      label: shortLabel,
      fullAddress: data.display_name || fullParts.join(", ") || buildFallbackLabel(latitude, longitude),
      area: [address.suburb, address.neighbourhood, address.city || address.town || address.village].filter(Boolean).join(", "),
      landmark: [address.road, address.state].filter(Boolean).join(", "),
      pincode: address.postcode || "",
    };
  } catch {
    return {
      latitude,
      longitude,
      label: buildFallbackLabel(latitude, longitude),
      fullAddress: buildFallbackLabel(latitude, longitude),
      area: buildFallbackLabel(latitude, longitude),
      landmark: "",
      pincode: "",
    };
  }
}

export function detectCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    // Check for HTTPS/secure context (required for geolocation in modern browsers)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      // Some browsers might still work on localhost over HTTP
      if (!window.location.hostname.includes("localhost") && window.location.protocol !== "https:") {
        reject(new Error("Location works only on a secure HTTPS site."));
        return;
      }
    }

    const timeout = options.timeout || 15000; // Increased timeout for Chrome compatibility
    let timeoutId = null;

    const timeoutFn = () => {
      reject(new Error("Location request timed out. Please try again or enable location manually."));
    };

    timeoutId = setTimeout(timeoutFn, timeout);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const location = await reverseGeocode(latitude, longitude);
        saveDetectedLocation(location);
        resolve(location);
      },
      (error) => {
        clearTimeout(timeoutId);
        let errorMsg = "Unable to detect location.";
        
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please enable location in your browser settings.";
        } else if (error.code === 2) {
          errorMsg = "Your location could not be determined. Please check your location settings.";
        } else if (error.code === 3) {
          errorMsg = "Location request timed out. Please try again.";
        }
        
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: false, // Set to false for Chrome compatibility, as high accuracy can be slower
        timeout: timeout,
        maximumAge: options.forceFresh ? 0 : 300000, // 5 min cache for better UX
      }
    );
  });
}
