import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { userAdminURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { handleErrorMessage } from "../helper/errorHandler";
import UserManagement from "../components/usersManagement";


const Admin = () => {
  const getAdmin = (pageProp) => {
    return pageProp.name == "Administration"
  }
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
    } else if (get_access_right_cookie("ils_right_administration") != "true") {
      router.push("/401");
    } else {
      const navigation = get_navigation();
      setPageProps(navigation.filter(getAdmin)[0]);
      setVerified(true);
    }
  }, [router]);

  const [emailAddress, setEmailAddress] = useState("");
  const [roleType, setRoleType] = useState("");

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");

  const failEmailAddress = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return !email.match(emailRegex);
  }

  const checkAndSubmitNewUser = () => {
    if (emailAddress == "" || roleType == "") {
      setSubmitError(true);
      setSubmitErrorMessage("Please fill in all fields");
    } else if (failEmailAddress(emailAddress)){
      setSubmitError(true);
      setSubmitErrorMessage("Email Address is not valid");
    } else {
      const userID = get_username_cookie();
      const password = get_password_cookie();
    
      // Make headers for auth
      const headers = {
        "username": userID,
        "password": password
      }

      // Make formData object
      const formData = new FormData();
      formData.append("username", emailAddress);
      formData.append("role", roleType);

      // Make create new user request to backend
      fetch(userAdminURL, {
        method: "POST",
        headers: headers,
        body: formData,
      }).then((res) => {
        if (res.status == 200) {
          setSubmitSuccess(true);
          setSubmitSuccessMessage(`Successfully added new user "${emailAddress}".`);
          setSubmitError(false);
          setSubmitErrorMessage("");
        } else {
          setSubmitError(true);
          setSubmitErrorMessage(handleErrorMessage(res));
          setSubmitSuccess(false);
          setSubmitSuccessMessage("");
        }
      });
    }
  }

  const resetNewUser = () => {
    setEmailAddress("");
    setRoleType("");
    setSubmitError(false);
    setSubmitErrorMessage("");
    setSubmitSuccess(false);
    setSubmitSuccessMessage("");
  };

  return (verified && 
    <Layout>
      <Header
        title={pageProps.name}
        description={pageProps.description}
      />
      <Body>
        <div className="shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white sm:p-6">
            {!submitSuccess && <>
              <label className="block text-lg font-medium text-gray-700 pb-2">Add New User</label>
              <div className="col-span-6 sm:col-span-3 mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="flex items-center">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    value={emailAddress}
                    onChange={(event) => setEmailAddress(event.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-6 sm:col-span-3 mt-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="flex items-center">
                  <select
                    id="role"
                    name="role"
                    autoComplete="role-name"
                    className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setRoleType(event.target.value)}
                  >
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="trainer">Trainer</option>
                    <option value="trainer_supervisor">Trainer Supervisor</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>
              </div>
              <button
                className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={() => checkAndSubmitNewUser()}
                disabled={emailAddress == "" || roleType == ""}
              >
                Submit
              </button>
            </>}
            {submitSuccess && <p className="mt-6 rounded-md bg-green-300 py-2 px-2">{submitSuccessMessage}</p>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
            {submitSuccess && <button
              className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => resetNewUser()}
            >
              Add Another User
            </button>}
            <hr className="mt-6 mb-6"/>
            <UserManagement />
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Admin;