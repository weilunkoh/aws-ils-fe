import { useReducer, useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { inferenceURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleFileSelect } from "../helper/dropzone";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';

const Inference = () => {
  const getInference = (pageProp) => {
    return pageProp.name == "Inference"
  };
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const [training_right, setTrainingRight] = useState(false);
  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
    } else if (get_access_right_cookie("ils_right_inference") != "true") {
      router.push("/401");
    } else {
      const navigation = get_navigation();
      setPageProps(navigation.filter(getInference)[0]);
      setVerified(true);
      setTrainingRight(get_access_right_cookie("ils_right_training") == "true");
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
      // case "ADD_FILES":
      // return { ...state, fileList: state.fileList.concat(action.files) };
      // return { ...state, fileList: action.files };
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
  const [inferenceResult, setInferenceResult] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [inferenceTimestamp, setInferenceTimestamp] = useState(null);
  const getInferenceResult = () => {
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

    setShowLoading(true);
    // Upload the files as a POST request to the server using fetch
    fetch(inferenceURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setInferenceResult(data.results["predictions"]);
          setInferenceTimestamp(data.results["timestamp_ms"]);
          setSubmitError(false);
          setSubmitErrorMessage("");
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
      setShowLoading(false);
    });
  }

  const [feedbackCorrect, setFeedbackCorrect] = useState(null);
  const [feedbackRemarks, setFeedbackRemarks] = useState("");
  const [feedbackResult, setFeedbackResult] = useState(null);

  const updateInferenceResult = () => {
    const userID = get_username_cookie();
    const password = get_password_cookie();

    // Note: See if there is a problem when the cookie expires
    // immediately after submitting inference record, making the
    // user unable to submit feedback after that.
    // Cookie expired. Log out user.
    if (userID == "") {
      router.push("/login");
    }

    const feedbackCorrectStr = feedbackCorrect ? "true" : "false"

    // initialize formData object
    const formData = new FormData();
    // formData.append("userID", userID);
    formData.append("timestamp", inferenceTimestamp)
    formData.append("feedback_correct", feedbackCorrectStr)
    if (feedbackCorrect) {
      formData.append("feedback_remarks", null);
    } else {
      formData.append("feedback_remarks", feedbackRemarks);
    }

    // Make headers for auth
    const headers = {
      "username": userID,
      "password": password
    }

    // Upload the files as a POST request to the server using fetch
    fetch(inferenceURL, {
      method: "PUT",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setFeedbackResult(data.results);
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
    setInferenceResult(null);
    setInferenceTimestamp(null);
    setFeedbackCorrect(null);
    setFeedbackRemarks("");
    setFeedbackResult(null);
    setSubmitError(false);
    setSubmitErrorMessage("");
  }

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
              <label className="block text-lg font-medium text-gray-700">Upload Image</label>
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
                      <span>Click to upload an image file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".png, .jpg, .jpeg"
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e, data, dispatch, true)}
                      />
                    </label>
                    {/* <p className="pl-1">or drag and drop</p> */}
                  </div>
                  <p className="text-xs text-gray-500">Only .png, .jpg and .jpeg allowed</p>
                </div>
              </div>}
            </div>
            {data.file != null && <>
              <div>
                { /* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={data.file.name}
                  src={fileDataURL} className="max-h-52 inline-block align-bottom"
                />
                <button
                  type="button"
                  className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  onClick={() => removeFile()}
                >
                  Remove
                </button>
                <p className="text-sm">{data.file.name}</p>
              </div>
              {training_right && <div className="sm:col-span-4">
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
                  disabled={inferenceResult != null}
                />
              </div>}
              {inferenceResult == null && <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={() => getInferenceResult()}
                disabled={showLoading}
              >
                Submit
              </button>}
            </>}
            {showLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
            {inferenceResult != null && <>
              <div>
                <p className="text-lg font-medium">Result:</p>
                <ol>
                  {Object.keys(inferenceResult).map((predicted_class) => (
                    <li
                      key={predicted_class}
                    >
                      {predicted_class}: {(inferenceResult[predicted_class] * 100).toFixed(2)}%
                    </li>
                  ))}
                </ol>
              </div>
              {feedbackResult == null && <div>
                <p className="block text-sm font-medium text-gray-700">Please give us your feedback.</p>
                <div className="grid grid-cols-6 gap-1 border-2 border-dashed md:border-none">
                  <div className="px-2 py-2 md:border-y-2 md:border-l-2 border-dashed col-span-6 md:col-span-1">
                    <p className="text-sm">Is this result correct?</p>
                  </div>
                  <div className="px-2 py-2 md:border-y-2 md:border-r-2 border-dashed col-span-6 md:col-span-2">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="feedback-yes"
                          name="feedback"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          onChange={() => setFeedbackCorrect(true)}
                        />
                        <label htmlFor="feedback-yes" className="ml-3 block text-sm text-gray-700">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="feedback-no"
                          name="feedback"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          onChange={() => setFeedbackCorrect(false)}
                        />
                        <label htmlFor="feedback-no" className="ml-3 block text-sm text-gray-700">
                          No
                        </label>
                      </div>
                      {feedbackCorrect == false && <div className="overflow-hidden">
                        <label htmlFor="feedback-correction" className="block text-sm text-gray-700">
                          Please tell us what the correct result should be.
                        </label>
                        <input
                          id="feedback-correction"
                          name="feedback"
                          type="text"
                          className="py-1 px-2 mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                          placeholder="e.g. cheesecake"
                          value={feedbackRemarks}
                          onChange={(e) => setFeedbackRemarks(e.target.value)}
                        />
                      </div>}
                      <button
                        className="inline-flex justify-center py-1 px-2 border border-transparent shadow-sm text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={!(feedbackCorrect == true || (feedbackCorrect == false && feedbackRemarks != ""))}
                        onClick={() => updateInferenceResult()}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                </div>
              </div>}
              {feedbackResult != null && <div className="grid grid-cols-6 gap-1 border-2 border-dashed md:border-none">
                <div className="px-2 py-2 md:border-2 border-dashed col-span-6 md:col-span-2">
                  <p className="text-sm">Thank you for your feedback!</p>
                </div>
              </div>}
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => removeFile()}
              >
                Upload Another Image
              </button>
            </>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Inference;