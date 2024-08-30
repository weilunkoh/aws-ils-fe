import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/layout";
import Header from "../components/header";
import Body from "../components/body";
import { get_navigation } from "../props/navigation";
import { visualisationURL, allRecordsURL, textFeaturesURL, imageURL, trainingClassURL, centroidURL, trainingURL } from "../props/urls";
import { get_username_cookie, get_access_right_cookie, get_password_cookie, get_password_change_required_cookie } from "../helper/authCookie";
import { format_timestamp_ms } from "../helper/misc";
import { handleErrorMessage } from "../helper/errorHandler";
import { DotsHorizontalIcon } from '@heroicons/react/outline';
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, })

const Visualisation = () => {
  const getVisualisation = (pageProp) => {
    return pageProp.name == "Visualisation"
  };
  const [pageProps, setPageProps] = useState();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else if (get_password_change_required_cookie() == "true") {
      router.push("/profile");
    } else if (get_access_right_cookie("ils_right_visualise") != "true") {
      router.push("/401");
    } else {
      const navigation = get_navigation();
      setPageProps(navigation.filter(getVisualisation)[0]);
      setVerified(true);
    }
  }, [router]);

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [centroidsList, setCentroidsList] = useState([]);
  const [usedTrainingImagesList, setUsedTrainingImagesList] = useState([]);
  const [unusedTrainingImagesList, setUnusedTrainingImagesList] = useState([]);
  const [validationImagesList, setValidationImagesList] = useState([]);
  const [classNamesList, setClassNamesList] = useState([]);
  const [visualisationTimestamp, setVisualisationTimestamp] = useState(null);
  const getVisualisationResult = () => {
    const userID = get_username_cookie();
    const password = get_password_cookie();

    // Cookie expired. Log out user.
    if (userID == "") {
      router.push("/login");
    }

    // initialize formData object
    const formData = new FormData();
    for (let idx in centroidsList) {
      formData.append("centroids", centroidsList[idx]);
    }
    for (let idx in usedTrainingImagesList) {
      formData.append("used_training_images", usedTrainingImagesList[idx]);
    }
    for (let idx in unusedTrainingImagesList) {
      formData.append("unused_training_images", unusedTrainingImagesList[idx]);
    }
    for (let idx in validationImagesList) {
      formData.append("validation_images", validationImagesList[idx]);
    }
    for (let idx in classNamesList) {
      formData.append("class_names", classNamesList[idx]);
    }

    // Make headers for auth
    const headers = {
      "username": userID,
      "password": password
    }

    // Upload the files as a POST request to the server using fetch
    fetch(visualisationURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setVisualisationTimestamp(data.results["timestamp_ms"]);
          setSubmitError(false);
          setSubmitErrorMessage("");
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
    });
  }

  const resetForm = () => {
    setCentroidsList([]);
    setUsedTrainingImagesList([]);
    setUnusedTrainingImagesList([]);
    setVisualisationTimestamp(null);
  };

  // const [centroidOptions, setCentroidOptions] = useState([]);
  // const [trainingClassOptions, setTrainingClassOptions] = useState([]);
  const [textFeaturesOptions, setTextFeaturesOptions] = useState([]);

  useEffect(() => {
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }

    const formData = new FormData();
    formData.append("offset", 0);
    formData.append("limit", 10000);
    fetch(textFeaturesURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          const text_features_options = data.results;
          setTextFeaturesOptions(text_features_options);
          setSubmitError(false);
          setSubmitErrorMessage("");
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
    });
  }, []);

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

    const formData = new FormData();
    formData.append("record_type", "pca");
    formData.append("offset", newPageNum * pageLimit);
    formData.append("limit", pageLimit);

    fetch(allRecordsURL, {
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

    const downloadURL = visualisationURL + "?username=" + userID + "&timestamp=" + timestamp + "&return_type=file";

    fetch(downloadURL, {
      method: "GET",
      headers: headers,
    }).then((res) => {
      if (res.status == 200) {
        res.blob().then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "batch_visualisation_" + timestamp + ".json";
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

  const [pca_userID, setPCAUserID] = useState(null);
  const [batchTraininguserID, setBatchTrainingUserID] = useState(null);
  const [batchTrainingTimestamp, setBatchTrainingTimestamp] = useState(null);

  const defaultAction = "Update Image(s) and Retrain";
  const recNewClass = "Ignore New Class";
  const recNewExisting = "Use Recommendations to Update Image(s) and Retrain";
  const editNewClass = "Retrain Model with New Class";
  const editNewExisting = "Use Modified Selection to Update Image(s) and Retrain";
  const [actionMessage, setActionMessage] = useState(defaultAction);
  const [actionMode, setActionMode] = useState("adhoc");

  const [showAction, setShowAction] = useState(false);
  const [showPlot, setShowPlot] = useState(false);
  const [showPlotLoading, setShowPlotLoading] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [plotLayout, setPlotLayout] = useState({});
  const plot_visualisation = (userID, timestamp, status) => {
    setPCAUserID(userID);
    setFixedTypoClassName("");
    setShowPlotLoading(true);
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }

    const downloadURL = visualisationURL + "?username=" + userID + "&timestamp=" + timestamp + "&return_type=json";

    fetch(downloadURL, {
      method: "GET",
      headers: headers,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          const results = data.results;

          // Possible settings for system triggerred PCA plots for robustness checks
          if (results.batch_training_userID !== undefined) {
            setBatchTrainingUserID(results.batch_training_userID);
            setBatchTrainingTimestamp(timestamp);
          } else {
            setBatchTrainingUserID(null);
            setBatchTrainingTimestamp(null);
          }
          if (userID.includes("system-new")) {
            setActionMessage(recNewClass);
            setActionMode("new_class");

            const recUnused = [];
            for (let className in results.new_class_image_dict) {
              for (let idx in results.new_class_image_dict[className].meta) {
                const timestamp_raw_id = results.new_class_image_dict[className].meta[idx].timestamp_raw_id;
                recUnused.push(`pending_images/${className}/${timestamp_raw_id}`);
              }
            }
            setRecUnused(recUnused);
            setCurrentClassName(Object.keys(results.new_class_image_dict)[0]);
          } else if (userID.includes("system-existing")) {
            setActionMessage(recNewExisting)
            setActionMode("new_existing");

            const recUsed = [];
            for (let className in results.passed_new_image_dict) {
              for (let idx in results.passed_new_image_dict[className].meta) {
                const timestamp_raw_id = results.passed_new_image_dict[className].meta[idx].timestamp_raw_id;
                recUsed.push(`pending_images/${className}/${timestamp_raw_id}`);
              }
            }
            setRecUsed(recUsed);

            const recUnused = [];
            for (let className in results.failed_new_image_dict) {
              for (let idx in results.failed_new_image_dict[className].meta) {
                const timestamp_raw_id = results.failed_new_image_dict[className].meta[idx].timestamp_raw_id;
                recUnused.push(`pending_images/${className}/${timestamp_raw_id}`);
              }
            }
            setRecUnused(recUnused);
            setCurrentClassName(Object.keys(results.failed_new_image_dict)[0]);
          } else {
            setActionMessage(defaultAction);
            setActionMode("adhoc");
            setCurrentClassName("");
          }


          // Make a set of keys
          const centroid_keys = Object.keys(results.centroid_dict);
          const used_keys = Object.keys(results.used_training_image_dict);
          const unused_keys = Object.keys(results.unused_training_image_dict);
          const validation_keys = Object.keys(results.validation_image_dict);
          const class_name_keys = Object.keys(results.class_name_dict);
          const new_class_images_keys = Object.keys(results.new_class_image_dict);
          const failed_validation_images_keys = Object.keys(results.failed_validation_image_dict);
          const passed_new_images_keys = Object.keys(results.passed_new_image_dict);
          const failed_new_images_keys = Object.keys(results.failed_new_image_dict);
          const all_keys = new Set([...centroid_keys, ...used_keys, ...unused_keys, ...validation_keys, ...class_name_keys]);

          // Sort each set so that graph displays in a consistent order
          centroid_keys.sort();
          used_keys.sort();
          unused_keys.sort();
          validation_keys.sort();
          class_name_keys.sort();

          // Map each key to a colour
          const colour_map = {};
          const colour_list = ["blue", "orange", "green", "red", "purple"];
          let colour_index = 0;
          all_keys.forEach((key) => {
            colour_map[key] = colour_list[colour_index];
            colour_index = (colour_index + 1) % colour_list.length;
          });

          // Make a list of traces
          const traces = [];
          centroid_keys.forEach((key) => {
            const trace = {
              x: results.centroid_dict[key].pca_x,
              y: results.centroid_dict[key].pca_y,
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'circle' },
              name: key + " centroid"
            };
            traces.push(trace);
          });
          used_keys.forEach((key) => {
            const trace = {
              x: results.used_training_image_dict[key].pca_x,
              y: results.used_training_image_dict[key].pca_y,
              text: results.used_training_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "used_for_centroid: %{text.used_for_centroid}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 15, symbol: 'circle-open' },
              name: key + " used"
            };
            traces.push(trace);
          });
          unused_keys.forEach((key) => {
            const trace = {
              x: results.unused_training_image_dict[key].pca_x,
              y: results.unused_training_image_dict[key].pca_y,
              text: results.unused_training_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "used_for_centroid: %{text.used_for_centroid}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 12, symbol: 'diamond-open' },
              name: key + " unused"
            };
            traces.push(trace);
          });
          validation_keys.forEach((key) => {
            const trace = {
              x: results.validation_image_dict[key].pca_x,
              y: results.validation_image_dict[key].pca_y,
              text: results.validation_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'triangle-down' },
              name: key + " validation"
            };
            traces.push(trace);
          });
          class_name_keys.forEach((key) => {
            const trace = {
              x: results.class_name_dict[key].pca_x,
              y: results.class_name_dict[key].pca_y,
              text: results.class_name_dict[key].meta,
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'square' },
              name: key + " class name"
            };
            traces.push(trace);
          });
          new_class_images_keys.forEach((key) => {
            const trace = {
              x: results.new_class_image_dict[key].pca_x,
              y: results.new_class_image_dict[key].pca_y,
              text: results.new_class_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'star' },
              name: key + " new class image"
            };
            traces.push(trace);
          });
          failed_validation_images_keys.forEach((key) => {
            const trace = {
              x: results.failed_validation_image_dict[key].pca_x,
              y: results.failed_validation_image_dict[key].pca_y,
              text: results.failed_validation_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'cross' },
              name: key + " image"
            };
            traces.push(trace);
          });
          passed_new_images_keys.forEach((key) => {
            const trace = {
              x: results.passed_new_image_dict[key].pca_x,
              y: results.passed_new_image_dict[key].pca_y,
              text: results.passed_new_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'cross' },
              name: key + " passed new image"
            };
            traces.push(trace);
          });
          failed_new_images_keys.forEach((key) => {
            const trace = {
              x: results.failed_new_image_dict[key].pca_x,
              y: results.failed_new_image_dict[key].pca_y,
              text: results.failed_new_image_dict[key].meta,
              hovertemplate: "original_filename:  %{text.original_filename}<br>" +
                "timestamp_raw_id: %{text.timestamp_raw_id}<br>" +
                "userID: %{text.userID}<br>" +
                "<extra></extra>",
              type: 'scatter',
              mode: 'markers',
              marker: { color: colour_map[key], size: 10, symbol: 'x' },
              name: key + " failed new image"
            };
            traces.push(trace);
          });

          // Make a layout
          const layout = {
            title: "Plot for Visualisation Job " + timestamp,
            xaxis: {
              title: "PCA X",
              showline: false,
              showgrid: false,
              zeroline: false,
            },
            yaxis: {
              title: "PCA Y",
              showline: false,
              showgrid: false,
              zeroline: false,
            },
            legend: {
              x: 1,
              y: 1
            },
          };

          setPlotData(traces);
          setPlotLayout(layout);
        });

        setShowAction(status == "completed");
        setShowPlot(true);
        setShowPlotLoading(false);
        setShowHovered("none");
        setShowSelected("none");

        setSelectedUsed([]);
        setDisplayUsed([]);
        setUsedCurrentPageNum(0);
        setUsedTotalPageNum(0)

        setSelectedUnused([]);
        setDisplayUnused([]);
        setUnusedCurrentPageNum(0);
        setUnusedTotalPageNum(0);

        setRetrainMessage(null);
        setSubmitRetrainError(false);
        setSubmitRetrainErrorMessage("");

      } else {
        setShowPlot(false);
        setShowPlotLoading(false);
        setShowHovered("none");
        setShowSelected("none");

        setSelectedUsed([]);
        setDisplayUsed([]);
        setUsedCurrentPageNum(0);
        setUsedTotalPageNum(0)

        setSelectedUnused([]);
        setDisplayUnused([]);
        setUnusedCurrentPageNum(0);
        setUnusedTotalPageNum(0);

        setRetrainMessage(null);
        setSubmitRetrainError(true);
        setSubmitRetrainErrorMessage(handleErrorMessage(res));
      }
    });
  };

  const [showHovered, setShowHovered] = useState("none");
  const [selectedPoint, setSelectedPoint] = useState(null);

  const fillHoverDisplay = (point) => {
    const hoverImageContent = document.getElementById("hoverImageContent");
    const hoverTextContent = document.getElementById("hoverTextContent");

    if (point.text.pending !== undefined) {
      const className = point.data.name.replace("new class image", "").replace("passed new image", "").replace("failed new image", "").trim();
      hoverImageContent.src = imageURL + "?folder=pending_images" + "&image_class=" + className + "&timestamp=" + point.text.timestamp_raw_id;
      hoverTextContent.innerHTML = "original_filename: " + point.text.original_filename + "<br>" +
        "timestamp_raw_id: " + point.text.timestamp_raw_id + "<br>" +
        "pending: " + point.text.pending + "<br>" +
        "userID: " + point.text.userID + "<br>";
      setSelectedPoint(point);
    } else if (point.text.used_for_centroid !== undefined) {
      const className = point.data.name.replace("unused", "").replace("used", "").trim();
      hoverImageContent.src = imageURL + "?folder=training_images" + "&image_class=" + className + "&timestamp=" + point.text.timestamp_raw_id;
      hoverTextContent.innerHTML = "original_filename: " + point.text.original_filename + "<br>" +
        "timestamp_raw_id: " + point.text.timestamp_raw_id + "<br>" +
        "used_for_centroid: " + point.text.used_for_centroid + "<br>" +
        "userID: " + point.text.userID + "<br>";
      setSelectedPoint(point);
    } else {
      const className = point.text.original_filename.split("/")[0];
      hoverImageContent.src = imageURL + "?folder=validation_images" + "&image_class=" + className + "&timestamp=" + point.text.timestamp_raw_id;
      hoverTextContent.innerHTML = "original_filename: " + point.text.original_filename + "<br>" +
        "timestamp_raw_id: " + point.text.timestamp_raw_id + "<br>" +
        "userID: " + point.text.userID + "<br>";
      setSelectedPoint(point);
    }
  }

  const handlePlotlyHover = (data) => {
    const found_image = false;
    for (let idx in data.points) {
      if ("text" in data.points[idx]) {
        found_image = true;
        fillHoverDisplay(data.points[idx]);
      }
    }
    if (!found_image) {
      setShowHovered("none");
    } else {
      setShowHovered("");
    }
  };

  const [showSelected, setShowSelected] = useState("none");
  const [selectedUsed, setSelectedUsed] = useState([]);
  const [selectedUnused, setSelectedUnused] = useState([]);
  const [recUsed, setRecUsed] = useState([]);
  const [recUnused, setRecUnused] = useState([]);

  const [displayUsed, setDisplayUsed] = useState([]);
  const [usedCurrentPageNum, setUsedCurrentPageNum] = useState(0);
  const [usedTotalPageNum, setUsedTotalPageNum] = useState(0);
  const [usedPageLimit, setUsedPageLimit] = useState(5);

  const [displayUnused, setDisplayUnused] = useState([]);
  const [unusedCurrentPageNum, setUnusedCurrentPageNum] = useState(0);
  const [unusedTotalPageNum, setUnusedTotalPageNum] = useState(0);
  const [unusedPageLimit, setUnusedPageLimit] = useState(5);

  useEffect(() => {
    if (actionMode == "new_class") {
      if (selectedUsed.length > 0) {
        setActionMessage(editNewClass);
      } else {
        setActionMessage(recNewClass);
      }
    }
  }, [selectedUsed, actionMode]);

  useEffect(() => {
    if (actionMode == "new_existing") {
      if (selectedUsed.length > 0 || selectedUnused.length > 0) {
        setActionMessage(editNewExisting);
      } else {
        setActionMessage(recNewExisting);
      }
    }
  }, [selectedUsed, selectedUnused, actionMode]);

  const handlePlotlyClick = (data) => {
    const point = data.points[0];
    if ("text" in point) {
      addPointToList(point);
    }
  };

  const getStoragePath = (point) => {
    if (point.text.pending !== undefined) {
      return "pending_images/" + point.data.name.replace("new class image", "").replace("passed new image", "").replace("failed new image", "").trim() + "/" + point.text.timestamp_raw_id;
    } else {
      return "training_images/" + point.data.name.replace("unused", "").replace("used", "").trim() + "/" + point.text.timestamp_raw_id;
    }
  };

  const handlePlotlySelected = (data) => {
    // Check if data is defined
    if (data != undefined) {
      if ("points" in data) {
        // Create temp values
        const tempSelectedUnused = [...selectedUnused];
        const tempSelectedUsed = [...selectedUsed];

        for (let idx in data.points) {
          const point = data.points[idx];
          if ("text" in point) {
            setShowSelected("");

            // Ignore validation images 
            if (point.text.used_for_centroid !== undefined) {
              // Only pending images can be selected for action mode new_class or new_existing
              // In adhoc mode, all training images can be selected. No pending images are available in adhoc.
              if ((point.text.pending !== undefined && actionMode != "adhoc") || actionMode == "adhoc") {
                const storagePath = getStoragePath(point);
                if (point.text.used_for_centroid) {
                  if (!selectedUnused.includes(storagePath)) {
                    tempSelectedUnused = [...tempSelectedUnused, storagePath];
                  }
                } else {
                  if (!selectedUsed.includes(storagePath)) {
                    tempSelectedUsed = [...tempSelectedUsed, storagePath];
                  }
                }
              }
            }
          }
        }

        // Compute new values
        const newUnusedCurrentPageNum = Math.floor((tempSelectedUnused.length - 1) / unusedPageLimit);
        const newUnusedTotalPageNum = Math.ceil(tempSelectedUnused.length / unusedPageLimit);
        const newDisplayUnused = tempSelectedUnused.slice(newUnusedCurrentPageNum * unusedPageLimit, (newUnusedCurrentPageNum + 1) * unusedPageLimit);

        const newUsedCurrentPageNum = Math.floor((tempSelectedUsed.length - 1) / usedPageLimit);
        const newUsedTotalPageNum = Math.ceil(tempSelectedUsed.length / usedPageLimit);
        const newDisplayUsed = tempSelectedUsed.slice(newUsedCurrentPageNum * usedPageLimit, (newUsedCurrentPageNum + 1) * usedPageLimit);

        // Update actual values
        setSelectedUnused(tempSelectedUnused);
        setUnusedCurrentPageNum(newUnusedCurrentPageNum);
        setUnusedTotalPageNum(newUnusedTotalPageNum);
        setDisplayUnused(newDisplayUnused);

        setSelectedUsed(tempSelectedUsed);
        setUsedCurrentPageNum(newUsedCurrentPageNum);
        setUsedTotalPageNum(newUsedTotalPageNum);
        setDisplayUsed(newDisplayUsed);
      }
    }
  };

  const addPointToList = (point) => {
    setShowSelected("");
    const storagePath = getStoragePath(point);
    // Ignore validation images 
    if (point.text.used_for_centroid !== undefined) {
      // Only pending images can be selected for action mode new_class or new_existing
      // In adhoc mode, all training images can be selected. No pending images are available in adhoc.
      if ((point.text.pending !== undefined && actionMode != "adhoc") || actionMode == "adhoc") {
        if (point.text.used_for_centroid) {
          if (!selectedUnused.includes(storagePath)) {
            // Create temp values
            const tempSelectedUnused = [...selectedUnused, storagePath];
            const newUnusedCurrentPageNum = Math.floor((tempSelectedUnused.length - 1) / unusedPageLimit);
            const newUnusedTotalPageNum = Math.ceil(tempSelectedUnused.length / unusedPageLimit);
            const newDisplayUnused = tempSelectedUnused.slice(newUnusedCurrentPageNum * unusedPageLimit, (newUnusedCurrentPageNum + 1) * unusedPageLimit);

            // Update actual values
            setSelectedUnused(arr => [...arr, storagePath]);
            setUnusedCurrentPageNum(newUnusedCurrentPageNum);
            setUnusedTotalPageNum(newUnusedTotalPageNum);
            setDisplayUnused(newDisplayUnused);
          }
        } else {
          if (!selectedUsed.includes(storagePath)) {
            // Create temp values
            const tempSelectedUsed = [...selectedUsed, storagePath];
            const newUsedCurrentPageNum = Math.floor((tempSelectedUsed.length - 1) / usedPageLimit);
            const newUsedTotalPageNum = Math.ceil(tempSelectedUsed.length / usedPageLimit);
            const newDisplayUsed = tempSelectedUsed.slice(newUsedCurrentPageNum * usedPageLimit, (newUsedCurrentPageNum + 1) * usedPageLimit);

            // Update actual values
            setSelectedUsed(arr => [...arr, storagePath]);
            setUsedCurrentPageNum(newUsedCurrentPageNum);
            setUsedTotalPageNum(newUsedTotalPageNum);
            setDisplayUsed(newDisplayUsed);
          }
        }
      }
    }
  };

  const [currentClassName, setCurrentClassName] = useState("");
  const [fixedTypoClassName, setFixedTypoClassName] = useState("");
  const [submitRetrainError, setSubmitRetrainError] = useState(false);
  const [submitRetrainErrorMessage, setSubmitRetrainErrorMessage] = useState("");
  const [retrainMessage, setRetrainMessage] = useState(null);
  const triggerTrainingUpdate = (useAll) => {
    const username = get_username_cookie();
    const password = get_password_cookie();
    const headers = {
      "username": username,
      "password": password
    }

    const formData = new FormData();

    if (actionMode == "adhoc") {
      console.log("adhoc update triggered");
      for (let idx in selectedUsed) {
        formData.append("update_to_used", selectedUsed[idx]);
      }
      for (let idx in selectedUnused) {
        formData.append("update_to_unused", selectedUnused[idx]);
      }
    } else {
      console.log("system update triggered");
      console.log(batchTraininguserID);
      console.log(batchTrainingTimestamp);
      // Get the final list of images (i.e. rec used minus selected unused and rec unused minus selected used)
      const finalUsed = [];
      const finalUnused = [];
      if (useAll) {
        for (let idx in recUsed) {
          formData.append("update_to_used", recUsed[idx]);
        }
        for (let idx in recUnused) {
          formData.append("update_to_used", recUnused[idx]);
        }
        formData.append("target_class_name", fixedTypoClassName);
      } else {
        for (let idx in recUsed) {
          if (!selectedUnused.includes(recUsed[idx])) {
            finalUsed.push(recUsed[idx]);
          }
        }
        for (let idx in selectedUsed) {
          finalUsed.push(selectedUsed[idx]);
        }

        for (let idx in recUnused) {
          if (!selectedUsed.includes(recUnused[idx])) {
            finalUnused.push(recUnused[idx]);
          }
        }
        for (let idx in selectedUnused) {
          finalUnused.push(selectedUnused[idx]);
        }

        for (let idx in finalUsed) {
          formData.append("update_to_used", finalUsed[idx]);
        }
        for (let idx in finalUnused) {
          formData.append("update_to_unused", finalUnused[idx]);
        }
      }

      formData.append("original_userID", batchTraininguserID);
      formData.append("original_timestamp_ms", batchTrainingTimestamp);
    }

    fetch(trainingURL, {
      method: "PUT",
      headers: headers,
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          if (actionMode != "adhoc") {
            const formData = new FormData();
            formData.append("pca_userID", pca_userID);
            formData.append("pca_timestamp_ms", batchTrainingTimestamp);

            fetch(visualisationURL, {
              method: "PUT",
              headers: headers,
              body: formData,
            }).then((res) => {
              if (res.status == 200) {
                res.json().then((data) => {
                  if (useAll) {
                    const message = `Alternative remedial action for batch training job ${batchTrainingTimestamp} successfully triggered. Also updated PCA job status about manual review.`
                    setRetrainMessage(message);
                    setSubmitRetrainError(false);
                    setSubmitRetrainErrorMessage("");
                  } else {
                    const message = `Update images and batch training job ${batchTrainingTimestamp} successfully triggered. Also updated PCA job status about manual review.`
                    setRetrainMessage(message);
                    setSubmitRetrainError(false);
                    setSubmitRetrainErrorMessage("");
                  }
                });
              } else {
                setSubmitRetrainError(true);
                setSubmitRetrainErrorMessage(handleErrorMessage(res));
              }
            });
          } else {
            const message = `Update images and batch training job ${data.results["timestamp_ms"]} successfully triggered.`
            setRetrainMessage(message);
            setSubmitRetrainError(false);
            setSubmitRetrainErrorMessage("");
          }
        });
      } else {
        setSubmitRetrainError(true);
        setSubmitRetrainErrorMessage(handleErrorMessage(res));
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
            <label className="block text-lg font-medium text-gray-700">New Visualisation Job</label>
            {visualisationTimestamp == null && <>
              <div className="flex flex-row">
                <div className="flex flex-col mr-5">
                  <label htmlFor="centroids_list" className="block text-sm font-medium text-gray-700">
                    Centroids
                  </label>
                  <div className="flex items-center">
                    <select
                      id="centroids_list"
                      name="centroids_list"
                      autoComplete="centroids_list"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      onChange={(e) => {
                        setCentroidsList(Array.from(e.target.selectedOptions, option => option.value));
                      }}
                      multiple
                    >
                      {textFeaturesOptions.map((className) => (
                        <option key={className["class_name"] + "_centroid"} value={className["class_name"]}>{className["class_name"]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mr-5">
                  <label htmlFor="used_list" className="block text-sm font-medium text-gray-700">
                    Used Training Images
                  </label>
                  <div className="flex items-center">
                    <select
                      id="used_list"
                      name="used_list"
                      autoComplete="used_list"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      onChange={(e) => {
                        setUsedTrainingImagesList(Array.from(e.target.selectedOptions, option => option.value));
                      }}
                      multiple
                    >
                      {textFeaturesOptions.map((className) => (
                        <option key={className["class_name"] + "_used_option"} value={className["class_name"]}>{className["class_name"]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mr-5">
                  <label htmlFor="unused_list" className="block text-sm font-medium text-gray-700">
                    Unused Training Images
                  </label>
                  <div className="flex items-center">
                    <select
                      id="unused_list"
                      name="unused_list"
                      autoComplete="used_list"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      onChange={(e) => {
                        setUnusedTrainingImagesList(Array.from(e.target.selectedOptions, option => option.value));
                      }}
                      multiple
                    >
                      {textFeaturesOptions.map((className) => (
                        <option key={className["class_name"] + "_used_option"} value={className["class_name"]}>{className["class_name"]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mr-5">
                  <label htmlFor="val_list" className="block text-sm font-medium text-gray-700">
                    Validation Images
                  </label>
                  <div className="flex items-center">
                    <select
                      id="val_list"
                      name="val_list"
                      autoComplete="val_list"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      onChange={(e) => {
                        setValidationImagesList(Array.from(e.target.selectedOptions, option => option.value));
                      }}
                      multiple
                    >
                      {textFeaturesOptions.map((className) => (
                        <option key={className["class_name"] + "_val_option"} value={className["class_name"]}>{className["class_name"]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label htmlFor="text_features_list" className="block text-sm font-medium text-gray-700">
                    Text Features
                  </label>
                  <div className="flex items-center">
                    <select
                      id="text_features_list"
                      name="text_features_list"
                      autoComplete="text_features_list"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      onChange={(e) => {
                        setClassNamesList(Array.from(e.target.selectedOptions, option => option.value));
                      }}
                      multiple
                    >
                      {textFeaturesOptions.map((className) => (
                        <option key={className["class_name"] + "_text_option"} value={className["class_name"]}>{className["class_name"]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button
                className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={centroidsList.length == 0 && usedTrainingImagesList.length == 0 && unusedTrainingImagesList.length == 0}
                onClick={() => getVisualisationResult()}
              >Submit Visualisation Job</button>
            </>}
            {visualisationTimestamp != null && <>
              <div>
                <p className="text-lg font-medium">Batch visualisation job ({visualisationTimestamp}) successfully triggered.</p>
              </div>
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => resetForm()}
              >
                Submit Another Job
              </button>
            </>}
            {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
            <hr className="mt-6 mb-6" />
            <label className="block text-lg font-medium text-gray-700">Past Batch Visualisation Jobs</label>
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
                  <th className="border px-2 py-2" width="12.5%">User ID</th>
                  <th className="border px-2 py-2" width="12.5%">Timestamp Raw ID</th>
                  <th className="border px-2 py-2" width="10%">Timestamp</th>
                  <th className="border px-2 py-2" width="10%">Status</th>
                  <th className="border px-2 py-2" colSpan={2}>Job Details</th>
                  <th className="border px-2 py-2" width="15%"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record["timestamp"]} className="border">
                    <td className="border"><p className="px-2 py-2">{record["username"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["timestamp"]}</p></td>
                    <td className="border"><p className="px-2 py-2">{format_timestamp_ms(record["timestamp"])}</p></td>
                    <td className="border"><p className="px-2 py-2">{record["status"]}</p></td>
                    <td className="border" width="20%" style={{ 'verticalAlign': 'top' }}>
                      {record["centroids"].length > 0 && <p className="px-2 py-2">Centroids:</p>}
                      {record["centroids"].map((centroid) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_centroid_" + centroid}
                          className="px-2"
                        >
                          {centroid}
                        </li>
                      ))}
                      {record["unused_training_images"].length > 0 && <p className="px-2 py-2">Unused Training Images:</p>}
                      {record["unused_training_images"].map((training_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_unused_training_image_" + training_image}
                          className="px-2"
                        >
                          {training_image}
                        </li>
                      ))}
                      {record["validation_images"].length > 0 && <p className="px-2 py-2">Validation Images:</p>}
                      {record["validation_images"].map((training_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_validation_image_" + training_image}
                          className="px-2"
                        >
                          {training_image}
                        </li>
                      ))}
                      {record["new_class_images"].length > 0 && <p className="px-2 py-2">New Class Images:</p>}
                      {record["new_class_images"].map((training_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_new_class_image_" + training_image}
                          className="px-2"
                        >
                          {training_image}
                        </li>
                      ))}
                      {record["failed_validation_images"].length > 0 && <p className="px-2 py-2">Failed Validation Images:</p>}
                      {record["failed_validation_images"].map((validation_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_failed_validation_image_" + validation_image}
                          className="px-2"
                        >
                          {validation_image}
                        </li>
                      ))}
                      {record["passed_new_images"].length > 0 && <p className="px-2 py-2">Passed New Images:</p>}
                      {record["passed_new_images"].map((training_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_passed_new_image_" + training_image}
                          className="px-2"
                        >
                          {training_image}
                        </li>
                      ))}
                      {record["failed_new_images"].length > 0 && <p className="px-2 py-2">Failed New Images:</p>}
                      {record["failed_new_images"].map((new_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_failed_new_image_" + new_image}
                          className="px-2"
                        >
                          {new_image}
                        </li>
                      ))}
                      {record["display_message"] != null && record["display_message"] != "" && <p className="px-2 pt-2">System Message:</p>}
                      {record["display_message"] != null && record["display_message"] != "" && <p className="px-2">{record["display_message"]}</p>}
                    </td>
                    <td className="border" width="20%" style={{ 'verticalAlign': 'top' }}>
                      {record["used_training_images"].length > 0 && <p className="px-2 py-2">Used Training Images:</p>}
                      {record["used_training_images"].map((training_image) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_used_training_image_" + training_image}
                          className="px-2"
                        >
                          {training_image}
                        </li>
                      ))}
                      {record["class_names"].length > 0 && <p className="px-2 py-2">Text Features:</p>}
                      {record["class_names"].map((class_name) => (
                        <li
                          key={record["username"] + "_" + record["timestamp_ms"] + "_text_feature_" + class_name}
                          className="px-2"
                        >
                          {class_name}
                        </li>
                      ))}
                      {record["batch_training_userID"] != null && <p className="px-2 pt-2">Batch Training User ID:</p>}
                      {record["batch_training_userID"] != null && <p className="px-2">{record["batch_training_userID"]}</p>}
                    </td>
                    {record["status"] == "in progress" && <td className="border"></td>}
                    {record["status"].includes("completed") && <td className="border py-1 px-2">
                      <button
                        className="block w-full justify-center my-1 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          download_full_info(record["username"], record["timestamp"])
                        }}
                      >
                        Download Full Info
                      </button>
                      <button
                        className="block w-full justify-center my-1 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          plot_visualisation(record["username"], record["timestamp"], record["status"])
                        }}
                      >
                        Plot Visualisation
                      </button>
                    </td>}
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
            <hr className="mt-6 mb-6" />
            <div>
              <label className="block text-lg font-medium text-gray-700">Visualisation Plot</label>
              <p className="text-sm text-gray-700 mt-0">Choose any job above to plot a visualisation.</p>
              {showPlotLoading && <DotsHorizontalIcon className="animate-bounce max-h-20 " />}
              {showPlot && !showPlotLoading && <Plot
                className="block w-full h-full"
                data={plotData}
                layout={plotLayout}
                config={{ displaylogo: false }}
                onHover={(data) => handlePlotlyHover(data)}
                onClick={(data) => handlePlotlyClick(data)}
                onSelected={(data) => handlePlotlySelected(data)}
              />}
              <div style={{ height: 225 }}>
                {showPlot && <p>Current Hovered Image:</p>}
                <div style={{ display: showHovered }}>
                  <div className="flex flex-row">
                    <div className="flex flex-col">
                      <img id="hoverImageContent" src="" style={{ maxHeight: 200, maxWidth: 300 }} />
                    </div>
                    <div className="flex flex-col mx-2">
                      <p className="" id="hoverTextContent"></p>
                      <button
                        className="inline-flex justify-center py-1 px-4 mt-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => { addPointToList(selectedPoint) }}
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {showPlot && showAction && <div className="mt-2">
                {retrainMessage == null && <div className="flex flex-row">
                  <div className="w-1/2 sm:w-full">
                    <p>Images to Add to Used List:</p>
                    <table className="table-auto border my-2">
                      <thead>
                        <tr className="border">
                          <th className="border px-2 py-2">Class</th>
                          <th className="border px-2 py-2">Timestamp</th>
                          <th className="border px-2 py-2">
                            <button
                              className="inline-flex justify-center py-1 px-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              disabled={selectedUsed.length == 0}
                              onClick={() => {
                                setSelectedUsed([]);
                                setDisplayUsed([]);
                              }}
                            >
                              Unselect All
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ display: showSelected }}>
                        {displayUsed.map((storagePath) => (
                          <tr key={storagePath} className="border">
                            <td className="border px-2 py-2">{storagePath.split("/")[1]}</td>
                            <td className="border px-2 py-2">{storagePath.split("/")[2]}</td>
                            <td className="border px-2 py-2">
                              <button
                                className="inline-flex justify-center py-1 px-2 border border-red-600 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
                                onClick={() => {
                                  const newSelectedUsed = selectedUsed.filter((item) => item != storagePath);
                                  setSelectedUsed(newSelectedUsed);
                                  setDisplayUsed(newSelectedUsed.slice(usedCurrentPageNum * usedPageLimit, (usedCurrentPageNum + 1) * usedPageLimit));
                                }}
                              >
                                Unselect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={usedCurrentPageNum == 0 || selectedUsed.length == 0}
                      onClick={() => {
                        setUsedCurrentPageNum(usedCurrentPageNum - 1);
                        setDisplayUsed(selectedUsed.slice((usedCurrentPageNum - 1) * usedPageLimit, usedCurrentPageNum * usedPageLimit));
                      }}
                    >
                      Previous
                    </button>
                    <button
                      className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={usedCurrentPageNum == usedTotalPageNum - 1 || selectedUsed.length == 0}
                      onClick={() => {
                        setUsedCurrentPageNum(usedCurrentPageNum + 1);
                        setDisplayUsed(selectedUsed.slice((usedCurrentPageNum + 1) * usedPageLimit, (usedCurrentPageNum + 2) * usedPageLimit));
                      }}
                    >
                      Next
                    </button>
                    {selectedUsed.length > 0 && <p className="inline-flex">
                      Showing page {usedCurrentPageNum + 1} of {usedTotalPageNum} ({selectedUsed.length} images)
                    </p>}
                    {selectedUsed.length > 0 && <select
                      className="inline-flex ml-2 w-1/6 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      value={usedCurrentPageNum}
                      onChange={(e) => {
                        setUsedCurrentPageNum(parseInt(e.target.value));
                        setDisplayUsed(selectedUsed.slice(parseInt(e.target.value) * usedPageLimit, (parseInt(e.target.value) + 1) * usedPageLimit));
                      }}
                    >
                      {/* loop based on given number */}
                      {Array.from(Array(usedTotalPageNum).keys()).map((pageNum) => (
                        <option key={pageNum} value={pageNum}>{pageNum + 1}</option>
                      ))}
                    </select>}
                  </div>
                  {actionMode != "new_class" && <div className="w-1/2 sm:w-full">
                    <p>Images to Add to Unused List:</p>
                    <table className="table-auto border my-2">
                      <thead>
                        <tr className="border">
                          <th className="border px-2 py-2">Class</th>
                          <th className="border px-2 py-2">Timestamp</th>
                          <th className="border px-2 py-2">
                            <button
                              className="inline-flex justify-center py-1 px-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              disabled={selectedUnused.length == 0}
                              onClick={() => {
                                setSelectedUnused([]);
                                setDisplayUnused([]);
                              }}
                            >
                              Unselect All
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ display: showSelected }}>
                        {displayUnused.map((storagePath) => (
                          <tr key={storagePath} className="border">
                            <td className="border px-2 py-2">{storagePath.split("/")[1]}</td>
                            <td className="border px-2 py-2">{storagePath.split("/")[2]}</td>
                            <td className="border px-2 py-2">
                              <button
                                className="inline-flex justify-center py-1 px-2 border border-red-600 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
                                onClick={() => {
                                  const newSelectedUnused = selectedUnused.filter((item) => item != storagePath);
                                  setSelectedUnused(newSelectedUnused);
                                  setDisplayUnused(newSelectedUnused.slice(unusedCurrentPageNum * unusedPageLimit, (unusedCurrentPageNum + 1) * unusedPageLimit));
                                }}
                              >
                                Unselect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="inline-flex justify-center py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={unusedCurrentPageNum == 0 || selectedUnused.length == 0}
                      onClick={() => {
                        setUnusedCurrentPageNum(unusedCurrentPageNum - 1);
                        setDisplayUnused(selectedUnused.slice((unusedCurrentPageNum - 1) * unusedPageLimit, unusedCurrentPageNum * unusedPageLimit));
                      }}
                    >
                      Previous
                    </button>
                    <button
                      className="inline-flex justify-center mx-2 py-1 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={unusedCurrentPageNum == unusedTotalPageNum - 1 || selectedUnused.length == 0}
                      onClick={() => {
                        setUnusedCurrentPageNum(unusedCurrentPageNum + 1);
                        setDisplayUnused(selectedUnused.slice((unusedCurrentPageNum + 1) * unusedPageLimit, (unusedCurrentPageNum + 2) * unusedPageLimit));
                      }}
                    >
                      Next
                    </button>
                    {selectedUnused.length > 0 && <p className="inline-flex">
                      Showing page {unusedCurrentPageNum + 1} of {unusedTotalPageNum} ({selectedUnused.length} images)
                    </p>}
                    {selectedUnused.length > 0 && <select
                      className="inline-flex ml-2 w-1/6 rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      value={unusedCurrentPageNum}
                      onChange={(e) => {
                        setUnusedCurrentPageNum(parseInt(e.target.value));
                        setDisplayUnused(selectedUnused.slice(parseInt(e.target.value) * unusedPageLimit, (parseInt(e.target.value) + 1) * unusedPageLimit));
                      }}
                    >
                      {/* loop based on given number */}
                      {Array.from(Array(unusedTotalPageNum).keys()).map((pageNum) => (
                        <option key={pageNum} value={pageNum}>{pageNum + 1}</option>
                      ))}
                    </select>}
                  </div>}
                </div>}
                {retrainMessage == null && <button
                  className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={selectedUnused.length == 0 && selectedUsed.length == 0 && actionMode == "adhoc"}
                  onClick={() => triggerTrainingUpdate(false)}
                >{actionMessage}</button>}
                {retrainMessage == null && actionMode != "adhoc" && <>
                  <label className="block text-lg font-medium text-gray-700 pt-5">Alternative Remedial Action</label>
                  <p className="text-sm text-gray-700 mt-0">Fix the potential typo in the current class name and use all images to train the renamed class.</p>
                  <div className="col-span-6 sm:col-span-3 mt-6">
                    <label htmlFor="fixedClassName" className="block text-sm font-medium text-gray-700">
                      Renamed Class Name
                    </label>
                    <div className="flex items-center">
                      <input
                        id="fixedClassName"
                        name="fixedClassName"
                        type="text"
                        className="mt-1 block md:w-1/3 w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        value={fixedTypoClassName}
                        onChange={(event) => setFixedTypoClassName(event.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={fixedTypoClassName == "" || fixedTypoClassName == currentClassName}
                    onClick={() => triggerTrainingUpdate(true)}
                  >Use All Images to Update New Class</button>
                </>}
                {retrainMessage != null && <div className="py-2">
                  <p className="text-lg font-medium">{retrainMessage}</p>
                </div>}
                {submitRetrainError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitRetrainErrorMessage}</p>}
              </div>}
            </div>
          </div>
        </div>
      </Body>
    </Layout>
  )
}

export default Visualisation;