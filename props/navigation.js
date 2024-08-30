import { get_access_right_cookie } from "../helper/authCookie";

const common_prefix = "ils_right_";

export const get_navigation = () => {
  return [{
    name: 'Inference',
    href: ["/inference", "/"],
    description: "Upload an image to get an inference result from our image classification model.",
    show: "true" == get_access_right_cookie(common_prefix + "inference")
  },
  {
    name: 'Evaluation',
    href: ["/evaluation"],
    description: "Update a zipped set of images with ground truth labels to evaluate the model.",
    show: "true" == get_access_right_cookie(common_prefix + "training")
  },
  {
    name: 'Records',
    href: ["/records"],
    description: "View records of past predictions.",
    show: "true" == get_access_right_cookie(common_prefix + "individual_records") || "true" == get_access_right_cookie(common_prefix + "all_records")
  },
  {
    name: 'Training',
    href: ["/training"],
    description: "Upload a zipped set of images with ground truth labels to train the model.",
    show: "true" == get_access_right_cookie(common_prefix + "training")
  },
  {
    name: 'Validation',
    href: ["/validation"],
    description: "View information about validation features extraction of images and text features of class names.",
    show: "true" == get_access_right_cookie(common_prefix + "training")
  },
  {
    name: 'Visualisation',
    href: ["/visualisation"],
    description: "PCA visualisation of centroids and training images.",
    show: "true" == get_access_right_cookie(common_prefix + "visualise")
  },
  {
    name: 'Administration',
    href: ["/admin"],
    description: "Manage users of ILS application.",
    show: "true" == get_access_right_cookie(common_prefix + "administration")
  }]
}

export const get_navigation_profile = () => {
  return {
    name: 'Profile',
    href: ["/profile"],
    description: "View and edit your user info.",
    show: "true" == get_access_right_cookie(common_prefix + "individual_admin")
  }
}