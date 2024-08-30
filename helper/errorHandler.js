export const handleErrorMessage = (res) => {
  if (res.status == 401){
    return "Authorization Error";
  }
  if (res.status == 500){
    return "Internal Server Error";
  }

  return "";
}