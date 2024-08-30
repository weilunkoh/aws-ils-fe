export const get_salt = () => {
  return "sg_mgmt_uni_mitb_2023"
}

export const make_hashed_password = async (password) => {
  const salted_password = password + get_salt();
  const utf8 = new TextEncoder().encode(salted_password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

// For successful login
export const make_auth_cookie = (
  username,
  password,
  password_change_required,
  right_inference,
  right_training,
  right_training_update,
  right_visualise,
  right_individual_records,
  right_all_records,
  right_individual_admin,
  right_administration
) => {
  const expire_time = new Date();
  expire_time.setTime(expire_time.getTime() + 60 * 60 * 1000);
  const expire_string = "expires=" + expire_time.toUTCString()
  const common_prefix = "ils_"
  document.cookie = common_prefix + "username=" + username + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "password=" + password + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "password_change_required=" + password_change_required + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_inference=" + right_inference + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_training=" + right_training + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_training_update=" + right_training_update + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_visualise=" + right_visualise + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_individual_records=" + right_individual_records + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_all_records=" + right_all_records + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_individual_admin=" + right_individual_admin + ";" + expire_string + ";path=/";
  document.cookie = common_prefix + "right_administration=" + right_administration + ";" + expire_string + ";path=/";
}

// For showing navigation tabs and pages
export const get_access_right_cookie = (right) => {
  let name = right + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return false;
}

export const get_username_cookie = () => {
  let name = "ils_username=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export const get_password_cookie = () => {
  let name = "ils_password=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export const get_password_change_required_cookie = () => {
  let name = "ils_password_change_required=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return false;
}

// For logout
export const delete_auth_cookie = () => {
  const common_prefix = "ils_"
  const common_suffix = "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  document.cookie = common_prefix + "username" + common_suffix;
  document.cookie = common_prefix + "password" + common_suffix;
  document.cookie = common_prefix + "password_change_required" + common_suffix;
  document.cookie = common_prefix + "right_inference" + common_suffix;
  document.cookie = common_prefix + "right_training" + common_suffix;
  document.cookie = common_prefix + "right_individual_records" + common_suffix;
  document.cookie = common_prefix + "right_all_records" + common_suffix;
  document.cookie = common_prefix + "right_individual_admin" + common_suffix;
  document.cookie = common_prefix + "right_administration" + common_suffix;
}