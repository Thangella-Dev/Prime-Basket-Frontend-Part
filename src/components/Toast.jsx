// src/components/Toast.jsx
import { forwardRef } from "react";

const Toast = forwardRef(function Toast(_, ref) {
  return (
    <div
      id="toast"
      ref={ref}
      style={{ opacity: 0, transform: "translateY(100px)", transition: "all 0.3s" }}
    >
      <i className="fas fa-check-circle"></i> Item added to cart!
    </div>
  );
});

export default Toast;
