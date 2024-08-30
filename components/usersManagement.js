import { useState, useEffect } from "react";
import UserModal from "../components/modals/userModal";
import { userAdminURL } from "../props/urls";
import { get_username_cookie, get_password_cookie } from "../helper/authCookie";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';


const UserManagement = () => {

  // // For reference if userManagement is migrated out
  // // of the admin page to have separate create and manage pages
  // const getAdmin = (pageProp) => {
  //   return pageProp.name == "Administration"
  // }
  // const [pageProps, setPageProps] = useState();
  // const [verified, setVerified] = useState(false);
  // const router = useRouter();
  // useEffect(() => {
  //   if (get_username_cookie() == "") {
  //     router.push("/login");
  //   } else if (get_access_right_cookie("ils_right_administration") != "true") {
  //     router.push("/401");
  //   } else {
  //     const navigation = get_navigation();
  //     setPageProps(navigation.filter(getAdmin)[0]);
  //     setVerified(true);
  //   }
  // }, [router]);

  // For all users table
  const [userRecords, setUserRecords] = useState([]);

  // For user modal
  const [openModal, setOpenModal] = useState(false);
  const [activeUserRecord, setActiveUserRecord] = useState({});

  const [showLoading, setShowLoading] = useState(true);
  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [currentPageNum, setCurrentPageNum] = useState(0);
  const [totalPageNum, setTotalPageNum] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const handleResponse = (res) => {
    if (res.status == 200) {
      res.json().then((data) => {
        const sorted_results = data.results.sort(function (a, b) {
          return a["username"] - b["username"]
        })
        setUserRecords(sorted_results);
        setSubmitError(false);
        setSubmitErrorMessage("");
        setShowLoading(false);
        setCurrentPageNum(data["current_page"] - 1);
        setTotalPageNum(data["num_pages"]);
      });
    } else {
      setSubmitError(true);
      setSubmitErrorMessage(handleErrorMessage(res));
      setShowLoading(false);
      setCurrentPageNum(0);
      setTotalPageNum(0);
    }
  }

  const makeHeader = () => {
    const username = get_username_cookie();
    const password = get_password_cookie();

    // Make headers for auth
    const headers = {
      "username": username,
      "password": password
    }
    return headers;
  }

  const getAllUsers = (newPageNum) => {
    setShowLoading(true);
    const headers = makeHeader();

    const offset = newPageNum * pageLimit;
    const limit = pageLimit;
    const fetchURL = userAdminURL + "?offset=" + offset + "&limit=" + limit;

    fetch(fetchURL, {
      method: "GET",
      headers: headers,
    }).then((res) => {
      handleResponse(res);
    })
  };

  useEffect(() => {
    getAllUsers(currentPageNum);
  }, []);

  return (
    <>
      <UserModal
        showModal={openModal}
        setShowModal={setOpenModal}
        userRecord={activeUserRecord}
        getAllUsers={getAllUsers}
        makeHeader={makeHeader}
      />
      <label className="block text-lg font-medium text-gray-700 pb-2">Manage Users</label>
      {showLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
      {!showLoading && <table className="table-auto border mt-6">
        <thead>
          <tr className="border">
            <th className="border px-2 py-2">User ID</th>
            <th className="border px-2 py-2">Joined Date</th>
            <th className="border px-2 py-2">Role</th>
            <th className="border px-2 py-2">Blacklist</th>
            <th className="border px-2 py-2">Active</th>
            <th className="border px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {userRecords.map((record) => (
            <tr key={record["username"]} className="border">
              <td className="border"><p className="px-2 py-2">{record["username"]}</p></td>
              <td className="border"><p className="px-2 py-2">{format_timestamp_ms(record["timestamp_ms"])}</p></td>
              <td className="border"><p className="px-2 py-2">{record["role"]}</p></td>
              <td className="border"><p className="px-2 py-2">{record["blacklist"].toString()}</p></td>
              <td className="border"><p className="px-2 py-2">{record["active"].toString()}</p></td>
              <td className="border">
                <button
                  className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    setOpenModal(true);
                    setActiveUserRecord(record);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
      <button
        className="inline-flex justify-center my-5 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={currentPageNum == 0}
        onClick={() => {
          getAllUsers(currentPageNum - 1);
        }}
      >
        Previous
      </button>
      <button
        className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={currentPageNum == totalPageNum - 1}
        onClick={() => {
          getAllUsers(currentPageNum + 1);
        }}
      >
        Next
      </button>
      <p className="inline-flex">
        Showing page {currentPageNum + 1} of {totalPageNum}
      </p>
      <select
        className="inline-flex ml-2 w-1/12 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        value={currentPageNum}
        onChange={(e) => {
          getAllUsers(parseInt(e.target.value));
        }}
      >
        {/* loop based on given number */}
        {Array.from(Array(totalPageNum).keys()).map((pageNum) => (
          <option key={pageNum} value={pageNum}>{pageNum + 1}</option>
        ))}
      </select>
      {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
    </>
  );
}

export default UserManagement;