// import React, { useState } from "react";
// import "./PhoneLoginModal.css";

// const API_BASE_URL =
//   process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// const PhoneLoginModal = ({
//   isOpen,
//   onClose,
//   apiBaseUrl,
//   onLoginSuccess,
//   redirectPath,
// }) => {
//   const [step, setStep] = useState("PHONE"); // PHONE or OTP
//   const [phone, setPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [devOtp, setDevOtp] = useState("");

//   const baseUrl = apiBaseUrl || API_BASE_URL;

//   const normalizePhoneInput = (value) => value.replace(/\D/g, "").slice(0, 10);

//   const handleSendOtp = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const cleanedPhone = normalizePhoneInput(phone);
//       if (cleanedPhone.length !== 10) {
//         throw new Error("Please enter a valid 10-digit mobile number.");
//       }

//       const response = await fetch(`${baseUrl}/api/auth/send-phone-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           phone: `+91${cleanedPhone}`,
//           purpose: "LOGIN",
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || data.error || `HTTP ${response.status}`,
//         );
//       }

//       // If dev mode, backend returns OTP in response
//       if (data.devOtp || data.otp) {
//         setDevOtp(data.devOtp || data.otp);
//       }

//       setStep("OTP");
//     } catch (err) {
//       if (err instanceof TypeError) {
//         setError(
//           "Cannot reach server. Start backend on port 8080, or set REACT_APP_API_BASE_URL to your live backend URL.",
//         );
//       } else {
//         setError(err.message || "Failed to send OTP. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const response = await fetch(`${baseUrl}/api/auth/verify-phone-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           phone: `+91${normalizePhoneInput(phone)}`,
//           otp: otp.trim(),
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || data.error || `HTTP ${response.status}`,
//         );
//       }

//       if (data?.user) {
//         localStorage.setItem("user", JSON.stringify(data.user));
//       }
//       if (data?.accessToken) {
//         localStorage.setItem("accessToken", data.accessToken);
//       }
//       if (data?.refreshToken) {
//         localStorage.setItem("refreshToken", data.refreshToken);
//       }

//       if (typeof onLoginSuccess === "function") {
//         onLoginSuccess(data);
//       }

//       if (redirectPath) {
//         window.location.assign(redirectPath);
//       }

//       // Close modal
//       onClose();

//       // Reset form
//       resetForm();
//     } catch (err) {
//       if (err instanceof TypeError) {
//         setError(
//           "Cannot reach server. Check backend URL/config and make sure backend is running.",
//         );
//       } else {
//         setError(err.message || "Invalid OTP. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setStep("PHONE");
//     setPhone("");
//     setOtp("");
//     setError("");
//     setDevOtp("");
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   const handleBackToPhone = () => {
//     setStep("PHONE");
//     setOtp("");
//     setError("");
//     setDevOtp("");
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="phone-login-overlay" onClick={handleClose}>
//       <div className="phone-login-modal" onClick={(e) => e.stopPropagation()}>
//         {/* Left side: Video */}
//         <div className="phone-login-video">
//           <video autoPlay loop muted playsInline className="modal-video">
//             <source src="/thelogovideo.mp4" type="video/mp4" />
//           </video>
//           <div className="video-overlay"></div>
//         </div>

//         {/* Right side: Form */}
//         <div className="phone-login-form-container">
//           <button className="modal-close-btn" onClick={handleClose}>
//             ×
//           </button>

//           <div className="phone-login-content">
//             <h3>{step === "PHONE" ? "Sign In" : "Verify OTP"}</h3>
//             {step === "PHONE" && (
//               <div className="phone-instruction">Mobile Number</div>
//             )}

//             {error && <div className="error-message">{error}</div>}
//             {devOtp && (
//               <div className="dev-otp-display">
//                 <strong>OTP:</strong> {devOtp}
//               </div>
//             )}

//             {step === "PHONE" ? (
//               <form onSubmit={handleSendOtp}>
//                 <div className="form-group">
//                   <input
//                     type="tel"
//                     value={phone}
//                     onChange={(e) =>
//                       setPhone(normalizePhoneInput(e.target.value))
//                     }
//                     onKeyDown={(e) => {
//                       const allowedKeys = [
//                         "Backspace",
//                         "Delete",
//                         "Tab",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Home",
//                         "End",
//                       ];
//                       if (allowedKeys.includes(e.key)) return;
//                       if (!/^\d$/.test(e.key)) {
//                         e.preventDefault();
//                       }
//                     }}
//                     placeholder="+91 XXXXXXXXXX"
//                     inputMode="numeric"
//                     pattern="[0-9]{10}"
//                     maxLength="10"
//                     required
//                     disabled={loading}
//                   />
//                 </div>

//                 <button type="submit" className="submit-btn" disabled={loading}>
//                   {loading ? "Sending..." : "Send OTP"}
//                 </button>
//               </form>
//             ) : (
//               <form onSubmit={handleVerifyOtp}>
//                 <div className="otp-sent-message">
//                   OTP sent to <strong>{phone}</strong>
//                 </div>

//                 <div className="form-group">
//                   <label>Enter OTP</label>
//                   <input
//                     type="text"
//                     value={otp}
//                     onChange={(e) =>
//                       setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
//                     }
//                     placeholder="6-digit code"
//                     maxLength="6"
//                     required
//                     disabled={loading}
//                     autoFocus
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   className="submit-btn"
//                   disabled={loading || otp.length !== 6}
//                 >
//                   {loading ? "Verifying..." : "Verify & Signin"}
//                 </button>

//                 <div className="otp-actions">
//                   <button
//                     type="button"
//                     className="link-btn"
//                     onClick={handleBackToPhone}
//                   >
//                     ← Change Number
//                   </button>
//                   <button
//                     type="button"
//                     className="link-btn"
//                     onClick={handleSendOtp}
//                     disabled={loading}
//                   >
//                     Resend OTP
//                   </button>
//                 </div>
//               </form>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PhoneLoginModal;
