import { useReducer, useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { evaluationURL, allRecordsURL, individualRecordsURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleFileSelect } from "../helper/dropzone";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Evaluation = () => {
  const getEvaluation = (pageProp) => {
    return pageProp.name == "Evaluation"
  };
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
      setPageProps(navigation.filter(getEvaluation)[0]);
      setVerified(true);
    }
  }, [router]);

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  // reducer function to handle state changes
  const reducer = (state, action) => {
    switch (action.type) {
      case "SET_IN_DROP_ZONE":
        return { ...state, inDropZone: action.inDropZone };
      case "ADD_FILE":
        return { ...state, file: action.file };
      case "REMOVE":
        return { ...state, file: null }
      default:
        return state;
    }
  };

  // destructuring state and dispatch, initializing fileList to empty array
  const [data, dispatch] = useReducer(reducer, {
    inDropZone: false,
    file: null,
  });

  const [fileDataURL, setFileDataURL] = useState(null);

  useEffect(() => {
    let fileReader, isCancel = false;
    if (data.file) {
      fileReader = new FileReader();
      fileReader.onload = (e) => {
        const { result } = e.target;
        if (result && !isCancel) {
          setFileDataURL(result)
        }
      }
      fileReader.readAsDataURL(data.file);
    }
    return () => {
      isCancel = true;
      if (fileReader && fileReader.readyState === 1) {
        fileReader.abort();
      }
    }

  }, [data.file]);

  const [topK, setTopK] = useState(1);
  const [evaluationTimestamp, setEvaluationTimestamp] = useState(null);
  const getEvaluationResult = () => {
    const userID = get_username_cookie();
    const password = get_password_cookie();

    // Cookie expired. Log out user.
    if (userID == "") {
      router.push("/login");
    }

    // initialize formData object
    const formData = new FormData();

    // WL: For single file
    formData.append("file", data.file);
    formData.append("top_k", topK);

    // WL: Reference for multiple files
    // data.files.forEach((file) => formData.append("files", file));

    // Make headers for auth
    const headers = {
      "username": userID,
      "password": password
    }

    // Upload the files as a POST request to the server using fetch
    fetch(evaluationURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setEvaluationTimestamp(data.results["timestamp_ms"]);
          setSubmitError(false);
          setSubmitErrorMessage("");
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
    });
  }

  const removeFile = () => {
    dispatch({ type: "REMOVE" });
    setEvaluationTimestamp(null);
    setSubmitError(false);
    setSubmitErrorMessage("");
  }

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
    formData.append("record_type", "batch_evaluation");
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
    const record_type = "batch_evaluation";
    let recordsURL;
    if (get_access_right_cookie("ils_right_all_records") == "true") {
      recordsURL = allRecordsURL + "?username=" + userID + "&record_type=" + record_type + "&timestamp=" + timestamp;
    } else {
      recordsURL = evaluationURL + "?record_type=" + record_type + "&timestamp=" + timestamp;
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
          a.download = "batch_evaluation_" + timestamp + ".json";
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
            <div>
              <label className="block text-lg font-medium text-gray-700">Upload a Zip File</label>
              <p className="text-sm text-gray-700">Zip file should contain folders of images in .png, .jpg or .jpeg format.</p>
              {data.file == null && <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                onDrop={(e) => handleDrop(e, data, dispatch, true)}
                onDragOver={(e) => handleDragOver(e, dispatch)}
                onDragEnter={(e) => handleDragEnter(e, dispatch)}
                onDragLeave={(e) => handleDragLeave(e, dispatch)}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <span>Click to upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".zip"
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e, data, dispatch, true)}
                      />
                    </label>
                    {/* <p className="pl-1">or drag and drop</p> */}
                  </div>
                  <p className="text-xs text-gray-500">Only .zip allowed.</p>
                </div>
              </div>}
            </div>
            {data.file != null && <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="zip_file" className="block text-sm font-medium text-gray-700">
                  Zip File
                </label>
                <input
                  id="zip_file"
                  name="zip_file"
                  type="text"
                  className="mt-1 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  value={data.file.name}
                  disabled={true}
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="top_k" className="block text-sm font-medium text-gray-700">
                  Top K
                </label>
                <input
                  id="top_k"
                  name="top_k"
                  type="number"
                  className="mt-1 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  value={topK}
                  step="1"
                  onChange={(event) => setTopK(parseInt(event.target.value))}
                  disabled={evaluationTimestamp != null}
                />
              </div>
              {evaluationTimestamp == null && <div className="sm:col-span-4">
                <button
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => getEvaluationResult()}
                >
                  Submit Zip File
                </button>
                <button
                  type="button"
                  className="ml-2 inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  onClick={() => removeFile()}
                >
                  Remove Zip File
                </button>
              </div>}
            </div>}
            {evaluationTimestamp != null && <>
              <div>
                <p className="text-lg font-medium">Batch evaluation job ({evaluationTimestamp}) successfully triggered.</p>
              </div>
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => removeFile()}
              >
                Upload Another Zip File
              </button>
            </>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
            <hr className="mt-6 mb-6" />
            <label className="block text-lg font-medium text-gray-700">Past Batch Evaluation Jobs</label>
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
                  <th className="border px-2 py-2">User ID</th>
                  <th className="border px-2 py-2">Timestamp Raw ID</th>
                  <th className="border px-2 py-2">Timestamp</th>
                  <th className="border px-2 py-2">Status</th>
                  <th className="border px-2 py-2">Top K</th>
                  <th className="border px-2 py-2">No. Correct</th>
                  <th className="border px-2 py-2">No. Wrong</th>
                  <th className="border px-2 py-2">No. Skipped</th>
                  <th className="border px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record["timestamp"]} className="border">
                    <td className="border"><p className="px-2 py-2">{record["username"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["timestamp"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{format_timestamp_ms(record["timestamp"])}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["status"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["top_k"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["num_correct"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["num_wrong"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["num_skipped"]}</p></td>
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

export default Evaluation;