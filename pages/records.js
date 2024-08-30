
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { allRecordsURL, individualRecordsURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Records = () => {
  const getRecords = (pageProp) => {
    return pageProp.name == "Records"
  }
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const [predictionRecords, setPredictionRecords] = useState([]);

  const [showLoading, setShowLoading] = useState(true);
  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [currentPageNum, setCurrentPageNum] = useState(0);
  const [totalPageNum, setTotalPageNum] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const handleResponse = (res) => {
    if (res.status == 200) {
      res.json().then((data) => {
        const sorted_results = data.results.sort((a, b) => {
          if (String(a["timestamp_ms"]).includes("_") && String(b["timestamp_ms"]).includes("_")) {
            const split_a = a["timestamp_ms"].split("_")
            const split_b = b["timestamp_ms"].split("_")

            if (split_a[0] == split_b[0]) {
              return split_b[1] - split_a[1]
            } else {
              return split_b[0] - split_a[0]
            }
          } else {
            let a_;
            let b_;
            if (String(a["timestamp_ms"]).includes("_")) {
              a_ = a["timestamp_ms"].split("_")[0]
            } else {
              a_ = a["timestamp_ms"]
            }
            if (String(b["timestamp_ms"]).includes("_")) {
              b_ = b["timestamp_ms"].split("_")[0]
            } else {
              b_ = b["timestamp_ms"]
            }
            return b_ - a_
          }
        });
        setPredictionRecords(sorted_results);
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

  useEffect(() => {
    const username = get_username_cookie();

    if (username == "") {
      router.push("/login");
    } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
    } else if (get_access_right_cookie("ils_right_individual_records") != "true" && get_access_right_cookie("ils_right_all_records") != "true") {
      router.push("/401");
    } else {
      const navigation = get_navigation();
      setPageProps(navigation.filter(getRecords)[0]);
      setVerified(true);
      getAllRecords(currentPageNum);
    }
  }, [router]);

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

  const getAllRecords = (newPageNum) => {
    setShowLoading(true);
    const headers = makeHeader();
    const formData = new FormData();
    formData.append("record_type", "inference");

    // Load records for all users.
    if (get_access_right_cookie("ils_right_all_records") == "true") {
      formData.append("offset", newPageNum * pageLimit);
      formData.append("limit", pageLimit);

      fetch(allRecordsURL, {
        method: "POST",
        headers: headers,
        body: formData,
      }).then((res) => {
        handleResponse(res);
      })

      // Load records for specific user.
    } else if (get_access_right_cookie("ils_right_individual_records") == "true") {
      formData.append("offset", newPageNum * pageLimit);
      formData.append("limit", pageLimit);

      fetch(individualRecordsURL, {
        method: "POST",
        headers: headers,
        body: formData,
      }).then((res) => {
        handleResponse(res);
      })
    }
  };

  return (verified &&
    <Layout>
      <Header
        title={pageProps.name}
        description={pageProps.description}
      />
      <Body>
        <div className="shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            {!showLoading && <button
              className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == 0}
              onClick={() => {
                getAllRecords(currentPageNum - 1);
              }}
            >
              Previous
            </button>}
            {!showLoading && <button
              className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == totalPageNum - 1}
              onClick={() => {
                getAllRecords(currentPageNum + 1);
              }}
            >
              Next
            </button>}
            {!showLoading && <p className="inline-flex">
              Showing page {currentPageNum + 1} of {totalPageNum}
            </p>}
            {!showLoading && <select
              className="inline-flex ml-2 w-1/12 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={currentPageNum}
              onChange={(e) => {
                getAllRecords(parseInt(e.target.value));
              }}
            >
              {/* loop based on given number */}
              {Array.from(Array(totalPageNum).keys()).map((pageNum) => (
                <option key={pageNum} value={pageNum}>{pageNum + 1}</option>
              ))}
            </select>}
            {showLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
            {!showLoading && <table className="table-auto border">
              <thead>
                <tr className="border">
                  <th className="border">User ID</th>
                  <th className="border">Timestamp</th>
                  <th className="border">Image</th>
                  <th className="border">Predictions</th>
                  <th className="border">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {predictionRecords.map((record) => (
                  <tr key={record["userID"] + "_" + record["timestamp_ms"]} className="border">
                    <td className="border"><p className="px-2 py-2">{record["userID"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{format_timestamp_ms(record["timestamp_ms"])}</p></td>
                    <td className="border">
                      {/*eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={record["userID"] + "_" + record["timestamp_ms"] + "_image"}
                        src={"data:image/jpeg;base64," + record["img64"]}
                        className="object-cover w-32 h-32 inline-block align-bottom px-2 py-2"
                      />
                    </td>
                    <td className="border">
                      {Object.keys(record["predictions"]).map((predicted_class) => (
                        <li
                          key={record["userID"] + "_" + record["timestamp_ms"] + predicted_class}
                          className="px-2"
                        >
                          {predicted_class}: {(record["predictions"][predicted_class] * 100).toFixed(2)}%
                        </li>
                      ))}
                    </td>
                    <td>
                      {record["feedback_correct"] != null && <li
                        key={record["userID"] + "_" + record["timestamp_ms"] + "_feedback_correct"}
                        className="px-2"
                      >
                        {record["feedback_correct"] && "Correct"}
                        {!record["feedback_correct"] && "Incorrect"}
                      </li>}
                      {record["feedback_remarks"] != "" && record["feedback_remarks"] != null && <li
                        key={record["userID"] + "_" + record["timestamp_ms"] + "_feedback_remarks"}
                        className="px-2"
                      >
                        Suggested Class: {record["feedback_remarks"]}
                      </li>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
            {!showLoading && <button
              className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == 0}
              onClick={() => {
                getAllRecords(currentPageNum - 1);
              }}
            >
              Previous
            </button>}
            {!showLoading && <button
              className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == totalPageNum - 1}
              onClick={() => {
                getAllRecords(currentPageNum + 1);
              }}
            >
              Next
            </button>}
            {!showLoading && <p className="inline-flex">
              Showing page {currentPageNum + 1} of {totalPageNum}
            </p>}
            {!showLoading && <select
              className="inline-flex ml-2 w-1/12 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={currentPageNum}
              onChange={(e) => {
                getAllRecords(parseInt(e.target.value));
              }}
            >
              {/* loop based on given number */}
              {Array.from(Array(totalPageNum).keys()).map((pageNum) => (
                <option key={pageNum} value={pageNum}>{pageNum + 1}</option>
              ))}
            </select>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Records;