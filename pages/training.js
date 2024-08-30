import { useReducer, useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { trainingURL, allRecordsURL, individualRecordsURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleFileSelect } from "../helper/dropzone";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Training = () => {
  const getTraining = (pageProp) => {
    return pageProp.name == "Training"
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
      setPageProps(navigation.filter(getTraining)[0]);
      setVerified(true);
    }
  }, [router]);

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  // reducer function to handle state changes
  const trainingReducer = (state, action) => {
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
  const [trainingData, trainingDispatch] = useReducer(trainingReducer, {
    inDropZone: false,
    file: null,
  });

  const [trainingFileDataURL, setTrainingFileDataURL] = useState(null);

  useEffect(() => {
    let trainingFileReader, isCancel = false;
    if (trainingData.file) {
      trainingFileReader = new FileReader();
      trainingFileReader.onload = (e) => {
        const { result } = e.target;
        if (result && !isCancel) {
          setTrainingFileDataURL(result)
        }
      }
      trainingFileReader.readAsDataURL(trainingData.file);
    }
    return () => {
      isCancel = true;
      if (trainingFileReader && trainingFileReader.readyState === 1) {
        trainingFileReader.abort();
      }
    }

  }, [trainingData.file]);

  const [trainingTimestamp, setTrainingTimestamp] = useState(null);

  // reducer function to handle state changes
  const validationReducer = (state, action) => {
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
  const [validationData, validationDispatch] = useReducer(validationReducer, {
    inDropZone: false,
    file: null,
  });

  const [validationFileDataURL, setValidationFileDataURL] = useState(null);

  useEffect(() => {
    let validationFileReader, isCancel = false;
    if (validationData.file) {
      validationFileReader = new FileReader();
      validationFileReader.onload = (e) => {
        const { result } = e.target;
        if (result && !isCancel) {
          setValidationFileDataURL(result)
        }
      }
      validationFileReader.readAsDataURL(validationData.file);
    }
    return () => {
      isCancel = true;
      if (validationFileReader && validationFileReader.readyState === 1) {
        validationFileReader.abort();
      }
    }

  }, [validationData.file]);

  const [validationTimestamp, setValidationTimestamp] = useState(null);

  const getSubmissionResult = () => {
    const userID = get_username_cookie();
    const password = get_password_cookie();

    // Cookie expired. Log out user.
    if (userID == "") {
      router.push("/login");
    }

    // initialize formData object
    const formData = new FormData();

    // WL: For single file
    // Check if files are null before appending
    if (trainingData.file != null) {
      formData.append("training_file", trainingData.file);
    }
    if (validationData.file != null) {
      formData.append("validation_file", validationData.file);
    }

    // WL: Reference for multiple files
    // trainingData.files.forEach((file) => formData.append("files", file));

    // Make headers for auth
    const headers = {
      "username": userID,
      "password": password
    }

    // Upload the files as a POST request to the server using fetch
    fetch(trainingURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          if (data.results["training_timestamp_ms"] != null) {
            setTrainingTimestamp(data.results["training_timestamp_ms"]);
          }
          if (data.results["validation_timestamp_ms"] != null) {
            setValidationTimestamp(data.results["validation_timestamp_ms"]);
          }
          setSubmitError(false);
          setSubmitErrorMessage("");
        });
      } else if (res.status == 400) {
        res.json().then((data) => {
          console.log(data);
          setSubmitError(true);
          if ("class_name_counts" in data) {
            setSubmitErrorMessage(`${data["message"]}: ${JSON.stringify(data["class_name_counts"])}`);
          } else {
            setSubmitErrorMessage(data["message"]);
          }
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
    });
  };

  const removeFiles = () => {
    removeTrainingFile();
    removeValidationFile();
  }

  const removeTrainingFile = () => {
    trainingDispatch({ type: "REMOVE" });
    setTrainingTimestamp(null);
    setSubmitError(false);
    setSubmitErrorMessage("");
  }

  const removeValidationFile = () => {
    validationDispatch({ type: "REMOVE" });
    setValidationTimestamp(null);
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
    formData.append("record_type", "batch_training");
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
    const record_type = "batch_training";
    let recordsURL;
    if (get_access_right_cookie("ils_right_all_records") == "true") {
      recordsURL = allRecordsURL + "?username=" + userID + "&record_type=" + record_type + "&timestamp=" + timestamp;
    } else {
      recordsURL = trainingURL + "?record_type=" + record_type + "&timestamp=" + timestamp;
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

  const convert_to_str = (bool) => {
    if (bool == true || bool == false) {
      return bool.toString();
    } else {
      return bool;
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
            <div>
              <label className="block text-lg font-medium text-gray-700">Upload a Zip File of Training Images</label>
              <p className="text-sm text-gray-700">Zip file should contain folders of images in .png, .jpg or .jpeg format. For new classes, each folder in the zip file should have at least 100 images.</p>
              {/* TODO 2.1.0: Allow multiple files in v2.1.0  */}
              <p className="text-sm text-gray-700">In the current version of the application (i.e. v2.0.3), only 1 folder in the zip file is allowed. (i.e. train one class at a time)</p>
              {trainingData.file == null && <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                onDrop={(e) => handleDrop(e, trainingData, trainingDispatch, true)}
                onDragOver={(e) => handleDragOver(e, trainingDispatch)}
                onDragEnter={(e) => handleDragEnter(e, trainingDispatch)}
                onDragLeave={(e) => handleDragLeave(e, trainingDispatch)}
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
                      htmlFor="training-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <span>Click to upload a file of training images</span>
                      <input
                        id="training-file-upload"
                        name="training-file-upload"
                        type="file"
                        accept=".zip"
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e, trainingData, trainingDispatch, true)}
                      />
                    </label>
                    {/* <p className="pl-1">or drag and drop</p> */}
                  </div>
                  <p className="text-xs text-gray-500">Only .zip allowed.</p>
                </div>
              </div>}
              {trainingData.file != null && <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="zip_file" className="block text-sm font-medium text-gray-700">
                    Training Zip File
                  </label>
                  <input
                    id="zip_file"
                    name="zip_file"
                    type="text"
                    className="mt-1 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    value={trainingData.file.name}
                    disabled={true}
                  />
                </div>
                {trainingTimestamp == null && <div className="sm:col-span-4">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    onClick={() => removeTrainingFile()}
                  >
                    Remove Zip File
                  </button>
                </div>}
              </div>}
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700">Upload a Zip File of Validation Images (Optional)</label>
              <p className="text-sm text-gray-700">Same rules for Zip file apply except for the number of images. There is no minimum number of images required.</p>
              <p className="text-sm text-gray-700">You can choose to upload validation images only if there are already existing training images for the validation class.</p>
              {validationData.file == null && <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                onDrop={(e) => handleDrop(e, validationData, validationDispatch, true)}
                onDragOver={(e) => handleDragOver(e, validationDispatch)}
                onDragEnter={(e) => handleDragEnter(e, validationDispatch)}
                onDragLeave={(e) => handleDragLeave(e, validationDispatch)}
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
                      htmlFor="validation-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <span>Click to upload a file of validation images</span>
                      <input
                        id="validation-file-upload"
                        name="validation-file-upload"
                        type="file"
                        accept=".zip"
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e, validationData, validationDispatch, true)}
                      />
                    </label>
                    {/* <p className="pl-1">or drag and drop</p> */}
                  </div>
                  <p className="text-xs text-gray-500">Only .zip allowed.</p>
                </div>
              </div>}
              {validationData.file != null && <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="zip_file" className="block text-sm font-medium text-gray-700">
                    Validation Zip File
                  </label>
                  <input
                    id="zip_file"
                    name="zip_file"
                    type="text"
                    className="mt-1 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    value={validationData.file.name}
                    disabled={true}
                  />
                </div>
                {validationTimestamp == null && <div className="sm:col-span-4">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    onClick={() => removeValidationFile()}
                  >
                    Remove Zip File
                  </button>
                </div>}
              </div>}
            </div>
            {trainingTimestamp == null && validationTimestamp == null && <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={trainingData.file == null && validationData.file == null}
              onClick={() => getSubmissionResult()}
            >
              Submit Zip File(s)
            </button>}
            {(trainingTimestamp != null || validationTimestamp != null) && <>
              <div>
                {trainingTimestamp != null && <p className="text-lg font-medium">Batch training job ({trainingTimestamp}) successfully triggered.</p>}
                {validationTimestamp != null && <p className="text-lg font-medium">Validation feature extraction job ({validationTimestamp}) successfully triggered.</p>}
              </div>
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => removeFiles()}
              >
                Upload More Zip File(s)
              </button>
            </>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
            <hr className="mt-6 mb-6" />
            <label className="block text-lg font-medium text-gray-700">Past Batch Training Jobs</label>
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
                  <th className="border px-2 py-2" width="12%">User ID</th>
                  <th className="border px-2 py-2" width="10%">Timestamp Raw ID</th>
                  <th className="border px-2 py-2" width="10%">Timestamp</th>
                  <th className="border px-2 py-2" width="8%">Status</th>
                  <th className="border px-2 py-2" >Classes Involved</th>
                  <th className="border px-2 py-2" width="33%">Job Details</th>
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
                    <td className="border"><p className="px-2 py-2">{
                      Object.keys(record).map((key) => (
                        (!["username", "timestamp", "timestamp_ms", "status", "classes"].includes(key)) && <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_" + key}
                          className="px-2"
                        // style={{ 'textTransform': 'capitalize' }}
                        >
                          {key.replaceAll("_", " ").replaceAll("num ", "number of ")}: {(!["centroids_computed", "classifier_fitted", "manual_review_date"].includes(key)) ? record[key] : key == "manual_review_date" ? format_timestamp_ms(record[key]) : convert_to_str(record[key])}
                        </li>
                      ))
                    }</p></td>
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

export default Training;