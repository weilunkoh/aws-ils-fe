import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation_profile } from "../props/navigation";
import { get_username_cookie, get_password_cookie, get_password_change_required_cookie, get_access_right_cookie } from "../helper/authCookie";
import { handleErrorMessage } from "../helper/errorHandler";
import { pwChangeURL } from "../props/urls";
import { make_hashed_password} from "../helper/authCookie";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Profile = () => {
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else if (get_access_right_cookie("ils_right_individual_admin") != "true") {
      router.push("/401");
    } else {
      setPageProps(get_navigation_profile());
      setVerified(true);
      setChangePassword(get_password_change_required_cookie() == "true");
    }
  }, [router]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [oldPasswordCheck, setOldPasswordCheck] = useState(true);
  const [newPasswordCheck, setNewPasswordCheck] = useState(true);

  const [showLoading, setShowLoading] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");

  const submitNewPassword = async () => {
    setShowLoading(true);

    const userID = get_username_cookie();
    const password = get_password_cookie();

    // Make headers for auth
    const headers = {
      "username": userID,
      "password": password
    }

    // Make formData object
    const formData = new FormData();
    formData.append("old_password", await make_hashed_password(oldPassword));
    formData.append("new_password", await make_hashed_password(newPassword));

    // Make create new user request to backend
    fetch(pwChangeURL, {
      method: "PUT",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        setSubmitSuccess(true);
        setSubmitSuccessMessage("Successfully changed password. Re-login with your new password to continue using ILS.");
        setSubmitError(false);
        setSubmitErrorMessage("");
        setShowLoading(false);
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
        setSubmitSuccess(false);
        setSubmitSuccessMessage("");
        setShowLoading(false);
      }
    });
  }

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
              {!changePassword && <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </button>}
              {changePassword && <>
                <label className="block text-lg font-medium text-gray-700 pb-2">Change Password</label>
                <div className="col-span-6 sm:col-span-3 mt-6">
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="flex items-center">
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                      onBlur={() => {setOldPasswordCheck((newPassword != oldPassword && newPassword != "") || newPassword == "" || oldPassword == "")}}
                    />
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-3 mt-6">
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="flex items-center">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      onBlur={() => {
                        setOldPasswordCheck((newPassword != oldPassword && oldPassword != "") || newPassword == "" || oldPassword == "");
                        setNewPasswordCheck((newPassword == newPasswordConfirm && newPasswordConfirm != "") || newPassword == "" || newPasswordConfirm == "");
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-3 mt-6">
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="flex items-center">
                    <input
                      id="newPasswordConfirm"
                      name="newPasswordConfirm"
                      type="password"
                      className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      value={newPasswordConfirm}
                      onChange={(event) => setNewPasswordConfirm(event.target.value)}
                      onBlur={() => {setNewPasswordCheck((newPassword == newPasswordConfirm && newPassword != "") || newPassword == "" || newPasswordConfirm == "")}}
                    />
                  </div>
                </div>
                {!oldPasswordCheck && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">New password cannot be the same as the old password.</p>}
                {!newPasswordCheck && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">New passwords do not match.</p>}
                <button
                  className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={() => submitNewPassword()}
                  disabled={oldPassword == "" || newPassword == "" || newPasswordConfirm == "" || newPassword != newPasswordConfirm || oldPassword == newPassword}
                >
                  Submit
                </button>
                <button
                className="ml-2 mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setChangePassword(false)}
              >
                Back
              </button>
              </>}
            </>}
            {showLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 "/>}
            {submitSuccess && <p className="mt-6 rounded-md bg-green-300 py-2 px-2">{submitSuccessMessage}</p>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Profile;