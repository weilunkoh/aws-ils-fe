import { get_username_cookie, get_access_right_cookie, get_password_change_required_cookie } from "../helper/authCookie";

export const routeDefault = (router) => {
  if (get_username_cookie() == "") {
    router.push("/login");
  } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
  } else {
    // Default page for all user roles except admin
    if (get_access_right_cookie("ils_right_inference") == "true") {
      router.push("/inference");
    }

    // Default page for admin
    if (get_access_right_cookie("ils_right_administration") == "true") {
      router.push("/admin");
    }
  }
}