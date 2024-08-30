import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { textFeaturesURL, validationURL, allRecordsURL, individualRecordsURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Validation = () => {
  const getValidation = (pageProp) => {
    return pageProp.name == "Validation"
  }
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
    } else if (get_access_right_cookie("ils_right_training") != "true") {
      router.push("/401");
    } else {
      const navigation = get_navigation();
      setPageProps(navigation.filter(getValidation)[0]);
      setVerified(true);
    }
  }, [router]);

  const [textFeatures, setTextFeatures] = useState([]);
  const [showTextFeaturesLoading, setShowTextFeaturesLoading] = useState(true);
  const [submitTextFeaturesError, setSubmitTextFeaturesError] = useState(false);
  const [submitTextFeaturesErrorMessage, setSubmitTextFeaturesErrorMessage] = useState("");

  const [currentTextFeaturesPageNum, setCurrentTextFeaturesPageNum] = useState(0);
  const [totalTextFeaturesPageNum, setTotalTextFeaturesPageNum] = useState(0);
  const [pageTextFeaturesLimit, setTextFeaturesPageLimit] = useState(5);

  const handleTextFeaturesResponse = (res) => {
    if (res.status == 200) {
      res.json().then((data) => {
        const sorted_results = data.results.sort(function (a, b) {
          return a["class_name"].localeCompare(b["class_name"])
        });
        console.log(sorted_results);
        setTextFeatures(sorted_results);
        setSubmitTextFeaturesError(false);
        setSubmitTextFeaturesErrorMessage("");
        setShowTextFeaturesLoading(false);
        setCurrentTextFeaturesPageNum(data["current_page"] - 1);
        setTotalTextFeaturesPageNum(data["num_pages"]);
      });
    } else {
      setSubmitTextFeaturesError(true);
      setSubmitTextFeaturesErrorMessage(handleErrorMessage(res));
      setShowTextFeaturesLoading(false);
      setCurrentTextFeaturesPageNum(0);
      setTotalTextFeaturesPageNum(0);
    }
  }
  const getAllTextFeatures = (newPageNum) => {
    setShowTextFeaturesLoading(true);
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }

    const formData = new FormData();
    formData.append("offset", newPageNum * pageLimit);
    formData.append("limit", pageLimit);

    fetch(textFeaturesURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleTextFeaturesResponse(res);
    })
  };

  useEffect(() => {
    getAllTextFeatures(currentTextFeaturesPageNum);
  }, []);

  const download_text_features = (class_name) => {
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    };
    let detailsURL = textFeaturesURL + "?class_name=" + class_name;

    fetch(detailsURL, {
      method: "GET",
      headers: headers,
    }).then((res) => {
      if (res.status == 200) {
        res.blob().then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "text_features_" + class_name + ".json";
          a.click();
        });
        setSubmitTextFeaturesError(false);
        setSubmitTextFeaturesErrorMessage("");
      } else {
        setSubmitTextFeaturesError(true);
        setSubmitTextFeaturesErrorMessage(handleErrorMessage(res));
      }
    });
  };

  const [records, setRecords] = useState([]);
  const [showRecordsLoading, setShowRecordsLoading] = useState(true);
  const [submitRecordsError, setSubmitRecordsError] = useState(false);
  const [submitRecordsErrorMessage, setSubmitRecordsErrorMessage] = useState("");

  const [currentPageNum, setCurrentPageNum] = useState(0);
  const [totalPageNum, setTotalPageNum] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);

  const handleRecordsResponse = (res) => {
    if (res.status == 200) {
      res.json().then((data) => {
        const sorted_results = data.results.sort(function (a, b) {
          return b["timestamp"] - a["timestamp"]
        })
        setRecords(sorted_results);
        setSubmitRecordsError(false);
        setSubmitRecordsErrorMessage("");
        setShowRecordsLoading(false);
        setCurrentPageNum(data["current_page"] - 1);
        setTotalPageNum(data["num_pages"]);
      });
    } else {
      setSubmitRecordsError(true);
      setSubmitRecordsErrorMessage(handleErrorMessage(res));
      setShowRecordsLoading(false);
      setCurrentPageNum(0);
      setTotalPageNum(0);
    }
  }
  const getAllRecords = (newPageNum) => {
    setShowRecordsLoading(true);
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }

    let recordsURL;
    if (get_access_right_cookie("ils_right_all_records") == "true") {
      recordsURL = allRecordsURL;
    } else {
      recordsURL = individualRecordsURL;
    }

    const formData = new FormData();
    formData.append("record_type", "validation_features_extraction");
    formData.append("offset", newPageNum * pageLimit);
    formData.append("limit", pageLimit);

    fetch(recordsURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleRecordsResponse(res);
    })
  };

  useEffect(() => {
    getAllRecords(currentPageNum);
  }, []);

  const download_full_info = (userID, timestamp) => {
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }
    const record_type = "validation_features_extraction";
    let recordsURL;
    if (get_access_right_cookie("ils_right_all_records") == "true") {
      recordsURL = allRecordsURL + "?username=" + userID + "&record_type=" + record_type + "&timestamp=" + timestamp;
    } else {
      recordsURL = validationURL + "?record_type=" + record_type + "&timestamp=" + timestamp;
    }

    fetch(recordsURL, {
      method: "GET",
      headers: headers,
    }).then((res) => {
      if (res.status == 200) {
        res.blob().then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "batch_training_" + timestamp + ".json";
          a.click();
        });
        setSubmitRecordsError(false);
        setSubmitRecordsErrorMessage("");
      } else {
        setSubmitRecordsError(true);
        setSubmitRecordsErrorMessage(handleErrorMessage(res));
      }
    });
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
            <label className="block text-lg font-medium text-gray-700">Text Features of Class Names</label>
            {showTextFeaturesLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
            {!showTextFeaturesLoading && <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                setCurrentPageNum(0);
                getAllTextFeatures(currentPageNum);
              }}
            >
              Refresh Table
            </button>}
            {!showTextFeaturesLoading && <table className="table-auto border mt-6">
              <thead>
                <tr className="border">
                  <th className="border px-2 py-2" width="20%">Class Name</th>
                  <th className="border px-2 py-2" width="10%"></th>
                </tr>
              </thead>
              <tbody>
                {textFeatures.map((record) => (
                  <tr key={record["class_name"]} className="border">
                    <td className="border"><p className="px-2 py-2">{record["class_name"]}</p></td>
                    <td className="border">
                      <button
                        className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          download_text_features(record["class_name"])
                        }}
                      >
                        Download Text Features
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
            {!showTextFeaturesLoading && <button
              className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentTextFeaturesPageNum == 0}
              onClick={() => {
                getAllTextFeatures(currentTextFeaturesPageNum - 1);
              }}
            >
              Previous
            </button>}
            {!showTextFeaturesLoading && <button
              className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentTextFeaturesPageNum == totalTextFeaturesPageNum - 1}
              onClick={() => {
                getAllTextFeatures(currentTextFeaturesPageNum + 1);
              }}
            >
              Next
            </button>}
            {!showTextFeaturesLoading && <p className="inline-flex">
              Showing page {currentTextFeaturesPageNum + 1} of {totalTextFeaturesPageNum}
            </p>}
            {!showTextFeaturesLoading && <select
              className="inline-flex ml-2 w-1/12 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={currentTextFeaturesPageNum}
              onChange={(e) => {
                getAllTextFeatures(parseInt(e.target.value));
              }}
            >
              {/* loop based on given number */}
              {Array.from(Array(totalTextFeaturesPageNum).keys()).map((pageNum) => (
                <option key={"TextFeatures" + pageNum} value={pageNum}>{pageNum + 1}</option>
              ))}
            </select>}
            {submitTextFeaturesError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitTextFeaturesErrorMessage}</p>}
            <hr className="mt-6 mb-6" />
            <label className="block text-lg font-medium text-gray-700">Past Validation Features Extraction Jobs</label>
            {showRecordsLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
            {!showRecordsLoading && <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                setCurrentPageNum(0);
                getAllRecords(currentPageNum);
              }}
            >
              Refresh Table
            </button>}
            {!showRecordsLoading && <table className="table-auto border mt-6">
              <thead>
                <tr className="border">
                  <th className="border px-2 py-2" width="10%">User ID</th>
                  <th className="border px-2 py-2" width="10%">Timestamp Raw ID</th>
                  <th className="border px-2 py-2" width="10%">Timestamp</th>
                  <th className="border px-2 py-2" width="8%">Status</th>
                  <th className="border px-2 py-2">Classes Involved</th>
                  <th className="border px-2 py-2" width="10%">No. Features Extracted</th>
                  <th className="border px-2 py-2" width="10%">No. Features Skipped</th>
                  <th className="border px-2 py-2" width="8%"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record["timestamp"]} className="border">
                    <td className="border"><p className="px-2 py-2">{record["username"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["timestamp"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{format_timestamp_ms(record["timestamp"])}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["status"]}</p></td>
                    <td className="border">
                      {record["classes"].map((class_name) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_" + class_name}
                          className="px-2"
                        >
                          {class_name}
                        </li>
                      ))}
                    </td>
                    <td className="border"><p className="px-2 py-2">{record["num_features_extracted"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["num_features_skipped"]}</p></td>
                    <td className="border">
                      <button
                        className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          download_full_info(record["username"], record["timestamp"])
                        }}
                      >
                        Download Full Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
            {!showRecordsLoading && <button
              className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == 0}
              onClick={() => {
                getAllRecords(currentPageNum - 1);
              }}
            >
              Previous
            </button>}
            {!showRecordsLoading && <button
              className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={currentPageNum == totalPageNum - 1}
              onClick={() => {
                getAllRecords(currentPageNum + 1);
              }}
            >
              Next
            </button>}
            {!showRecordsLoading && <p className="inline-flex">
              Showing page {currentPageNum + 1} of {totalPageNum}
            </p>}
            {!showRecordsLoading && <select
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
            {submitRecordsError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitRecordsErrorMessage}</p>}
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Validation;