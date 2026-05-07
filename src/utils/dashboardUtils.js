/**
 * Maps a user role string to the appropriate dashboard path.
 */
export function getDashboardPath(role) {
  if (!role) return "/";
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "/dashboard/admin";
    case "SELLER":
    case "VENDOR":
      return "/dashboard/seller";
    case "DELIVERY":
    case "DELIVERY_PARTNER":
      return "/dashboard/delivery";
    case "CUSTOMER":
    case "BUYER":
    default:
      return "/dashboard/customer";
  }
}

export function getProfilePath(role) {
  if (!role) return "/dashboard/customer-profile";
  switch (role.toUpperCase()) {
    case "SELLER":
    case "VENDOR":
      return "/dashboard/seller-profile";
    case "DELIVERY":
    case "DELIVERY_PARTNER":
      return "/dashboard/delivery-profile";
    case "CUSTOMER":
    case "BUYER":
    default:
      return "/dashboard/customer-profile";
  }
}
