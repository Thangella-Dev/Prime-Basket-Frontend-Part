const OTP_STORAGE_PREFIX = "pb_demo_otp_";
const USERS_STORAGE_KEY = "pb_demo_phone_users";
const OTP_TTL_MS = 5 * 60 * 1000;

function normalizePhone(rawPhone) {
  const raw = String(rawPhone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+254")) return `+${digits}`;
  if (raw.startsWith("+91")) return `+${digits}`;
  if (/^0[71]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^[71]\d{8}$/.test(digits)) return `+254${digits}`;
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && (digits.startsWith("254") || digits.startsWith("91"))) return `+${digits}`;
  return `+${digits}`;
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function randomToken(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function sendDemoPhoneOtp({
  phone,
  purpose = "LOGIN",
  profile = {},
}) {
  const normalizedPhone = normalizePhone(phone);
  const otp = randomOtp();
  const record = {
    otp,
    purpose,
    expiresAt: Date.now() + OTP_TTL_MS,
    profile,
  };

  sessionStorage.setItem(
    `${OTP_STORAGE_PREFIX}${normalizedPhone}`,
    JSON.stringify(record),
  );

  return {
    ok: true,
    message: `OTP sent to ${normalizedPhone}`,
    otp,
    phone: normalizedPhone,
  };
}

export async function verifyDemoPhoneOtp({ phone, otp }) {
  const normalizedPhone = normalizePhone(phone);
  const key = `${OTP_STORAGE_PREFIX}${normalizedPhone}`;
  const raw = sessionStorage.getItem(key);

  if (!raw) {
    throw new Error("OTP not found. Please request a new code.");
  }

  const record = JSON.parse(raw);
  if (Date.now() > record.expiresAt) {
    sessionStorage.removeItem(key);
    throw new Error("OTP expired. Please request a new code.");
  }

  if (String(otp || "").trim() !== String(record.otp)) {
    throw new Error("Invalid OTP. Please try again.");
  }

  sessionStorage.removeItem(key);

  const users = loadUsers();
  const existingUser = users[normalizedPhone];

  let user;
  if (record.purpose === "REGISTER") {
    user = {
      id: existingUser?.id || randomToken("usr"),
      phone: normalizedPhone,
      name: record.profile?.name || "Prime Basket User",
      email: record.profile?.email || "",
      role: record.profile?.role || "CUSTOMER",
      location: record.profile?.location || "",
    };
    users[normalizedPhone] = user;
    saveUsers(users);
  } else {
    user = existingUser || {
      id: randomToken("usr"),
      phone: normalizedPhone,
      name: "User",
      email: "",
      role: "CUSTOMER",
      location: "",
    };
    if (!existingUser) {
      users[normalizedPhone] = user;
      saveUsers(users);
    }
  }

  return {
    ok: true,
    user,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken: randomToken("access"),
    refreshToken: randomToken("refresh"),
  };
}
