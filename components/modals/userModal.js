import { useState } from "react";
import React from "react";
import { XIcon } from '@heroicons/react/outline';
import { pwChangeURL, userAdminURL } from "../../props/urls";
import { handleErrorMessage } from "../../helper/errorHandler";


const Modal = (props) => {
  const [viewMode, setViewMode] = useState(true);
  const [confirmMode, setConfirmMode] = useState(false);
  
  const [newRole, setNewRole] = useState("");
  const [newBlacklist, setNewBlacklist] = useState("");

  const [confirmAction, setConfirmAction] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");
  const handleResponse = (res, msg) => {
    if (res.status == 200){
      res.json().then((data) => {
        setSubmitError(false);
        setSubmitErrorMessage("");
        setSubmitSuccess(true);
        setSubmitSuccessMessage(msg);
        props.getAllUsers()
      });
    } else {
      setSubmitError(true);
      setSubmitErrorMessage(handleErrorMessage(res));
      setSubmitSuccess(false);
      setSubmitSuccessMessage("");
    }
  };

  const resetPassword = () => {
    const headers = props.makeHeader();

    // Make formData object
    const formData = new FormData();
    formData.append("username", props.userRecord["username"]);

    fetch(pwChangeURL, {
      method: "POST",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleResponse(res,"Changed password for user successfully!");
    })
  };

  const updateUser = () => {
    const headers = props.makeHeader();

    // Make formData object
    const formData = new FormData();
    formData.append("username", props.userRecord["username"]);
    if (newRole != ""){
      formData.append("role", newRole);
    };
    if (newBlacklist != ""){
      formData.append("blacklist", newBlacklist);
    };

    fetch(userAdminURL, {
      method: "PUT",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleResponse(res,"Updated user successfully!");
    })
  };

  const deactivateUser = () => {
    const headers = props.makeHeader();

    // Make formData object
    const formData = new FormData();
    formData.append("username", props.userRecord["username"]);
    formData.append("active", "false");

    fetch(userAdminURL, {
      method: "DELETE",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleResponse(res,"Deactivated user successfully!");
    })
  };

  const reactivateUser = () => {
    const headers = props.makeHeader();

    // Make formData object
    const formData = new FormData();
    formData.append("username", props.userRecord["username"]);
    formData.append("active", "true");

    fetch(userAdminURL, {
      method: "PUT",
      headers: headers,
      body: formData,
    }).then((res) => {
      handleResponse(res,"Reactivated user successfully!");
    })
  };

  const setConfirmFor = (action) => {
    setConfirmMode(true);
    setConfirmAction(action);
    if (action == "changeActiveStatus") {
      if (props.userRecord["active"]) {
        setConfirmMessage("Press confirm to deactivate this user."); 
      } else {
        setConfirmMessage("Press confirm to reactivate this user.");
      }
    } else {
      setConfirmMessage("Press confirm to reset password for this user.");
    }
  }

  const triggerConfirmAction = () => {
    if (confirmAction == "changeActiveStatus") {
      changeActiveStatus();
    } else {
      resetPassword();
    }
  }

  const changeActiveStatus = () => {
    if (props.userRecord["active"]) {
      deactivateUser();
    } else {
      reactivateUser();
    }
  };

  const resetModal = () => {
    props.setShowModal(false);
    setViewMode(true);
    setConfirmMode(false);
    setNewRole("");
    setNewBlacklist("");
    setConfirmAction("");
    setConfirmMessage("");
    setSubmitError(false);
    setSubmitErrorMessage("");
    setSubmitSuccess(false);
    setSubmitSuccessMessage("");
  };

  return (
    <>
      {props.showModal ? (
        <>
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-2xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between px-5 py-3 border-b border-solid border-gray-300 rounded-t ">
                  <label className="block text-lg font-medium text-gray-700 pb-2">User Info</label>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => resetModal()}
                  >
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="relative p-6 flex-auto">
                  {props.userRecord != "" &&<>
                    <p>Username: {props.userRecord["username"]}</p>
                    {!submitSuccess && <>
                      {/* Reset Password */}
                      {viewMode && !confirmMode && <button
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          setConfirmFor("resetPassword");
                        }}
                      >Reset Password</button>}

                      {/* View or Update User */}
                      {!confirmMode &&<div className="col-span-6 sm:col-span-3 mt-6">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role {!viewMode &&<>(Current: {props.userRecord["role"].toString()})</>}
                        </label>
                        <div className="flex items-center">
                          {viewMode && <input
                            id="role"
                            name="role"
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                            value={props.userRecord["role"]}
                            disabled={true}
                          />}
                          {!viewMode && <select
                            id="new_role"
                            name="new_role"
                            autoComplete="role-name"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            onChange={(event) => setNewRole(event.target.value)}
                          >
                            <option value="">Select New Role</option>
                            <option value="user">User</option>
                            <option value="trainer">Trainer</option>
                            <option value="trainer_supervisor">Trainer Supervisor</option>
                            <option value="administrator">Administrator</option>
                          </select>}
                        </div>
                      </div>}
                      {!confirmMode &&<div className="col-span-6 sm:col-span-3 mt-6">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Blacklist {!viewMode &&<>(Current: {props.userRecord["blacklist"].toString()})</>}
                        </label>
                        <div className="flex items-center">
                          {viewMode && <input
                            id="blacklist"
                            name="blacklist"
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                            value={props.userRecord["blacklist"]}
                            disabled={true}
                          />}
                          {!viewMode && <select
                            id="new_blacklist"
                            name="new_blacklist"
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            onChange={(event) => setNewBlacklist(event.target.value)}
                          >
                            <option value="">Select New Value</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>}
                        </div>
                      </div>}
                      {confirmMode &&
                        <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{confirmMessage}</p>
                      }

                      {/* View Buttons */}
                      {viewMode && !confirmMode && <button
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setViewMode(false)}
                      >Edit User </button>}
                      {viewMode && !confirmMode && props.userRecord["active"] && <button
                        className="ml-2 mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => {
                          setConfirmFor("changeActiveStatus");
                        }}
                      >Deactivate User</button>}
                      {viewMode && !confirmMode && !props.userRecord["active"] && <button
                        className="ml-2 mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => {
                          setConfirmFor("changeActiveStatus");
                        }}
                      >Reactivate User</button>}

                      {/* Confirm Buttons for Activate/Deactivate/ChangePassword*/}
                      {confirmMode && <button
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => triggerConfirmAction()}
                      >Confirm</button>}
                      
                      {/* Update Buttons for Editing User Info */}
                      {!viewMode && <button
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => updateUser()}
                      >Submit</button>}
                      
                      {/* Return Buttons */}
                      {(!viewMode || confirmMode) && <button
                        className="ml-2 mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => {
                          setViewMode(true);
                          setConfirmMode(false);
                        }}
                      >Back</button>}
                      </>}
                      {submitSuccess && <p className="mt-6 rounded-md bg-green-300 py-2 px-2">{submitSuccessMessage}</p>}
                      {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
                  </>}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Modal;