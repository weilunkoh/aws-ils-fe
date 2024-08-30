import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Image from "next/image";
import { LockClosedIcon } from '@heroicons/react/solid';
import CustomHead from '../components/head';
import { make_hashed_password, make_auth_cookie } from "../helper/authCookie";
import { routeDefault } from "../helper/routeDefault";
import { hostMsgURL, loginURL } from "../props/urls";
import { handleErrorMessage } from "../helper/errorHandler";

const Login = () => {
  const router = useRouter();
  useEffect(() => {
    routeDefault(router);
  }, [router]);

  const [hostMessage, setHostMessage] = useState("");

  useEffect(() => {
    fetch(hostMsgURL, {
      method: "GET",
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setHostMessage(data.host_message);
        });
      }
    });
  }, []);

  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleUsername = (username) => {
    setUsername(username);
    setSubmitError(false);
    setSubmitErrorMessage("");
  }

  const handlePassword = (password) => {
    setPassword(password);
    setSubmitError(false);
    setSubmitErrorMessage("");
  }

  const handleLogin = async () => {
    const hashed_password = await make_hashed_password(password);

    // initialize formData object
    const formData = new FormData();
    formData.append("userID", username);
    formData.append("password", hashed_password);

    fetch(loginURL, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (res.status == 200) {
        res.json().then((data) => {
          setSubmitError(false);
          setSubmitErrorMessage("");
          const password_change_required = data.results.password_change_required;
          const right_inference = data.results.inference;
          const right_training = data.results.training;
          const right_training_update = data.results.training_update;
          const right_visualise = data.results.visualise;
          const right_individual_records = data.results.individual_records;
          const right_all_records = data.results.all_records;
          const right_individual_admin = data.results.individual_admin;
          const right_administration = data.results.administration;
          make_auth_cookie(
            username,
            hashed_password,
            password_change_required,
            right_inference,
            right_training,
            right_training_update,
            right_visualise,
            right_individual_records,
            right_all_records,
            right_individual_admin,
            right_administration,
          );
          if (right_inference) {
            router.push("/inference");
          }
          if (right_administration) {
            router.push("/admin");
          }
        });
      } else {
        setSubmitError(true);
        setSubmitErrorMessage(handleErrorMessage(res));
      }
    });
  }

  return (
    <div>
      <CustomHead />
      <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="text-center">
              <Image
                src="/smu-logo.png"
                height={90}
                width={180}
                position="relative"
                objectPosition="center"
                alt="Singapore Management University"
              />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Interactive Learning with Safeguards (ILS)
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {hostMessage}
            </p>
          </div>
          <form className="mt-8 space-y-6">
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="on"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Username"
                  onChange={(e) => handleUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="on"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Password"
                  onChange={(e) => handlePassword(e.target.value)}
                />
              </div>
            </div>
          </form>
          <div>
            <button
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={username == "" || password == ""}
              onClick={() => handleLogin()}
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              Sign In
            </button>
          </div>
          {submitError && <p className="mt-6 rounded-md bg-red-300 py-2 px-2">{submitErrorMessage}</p>}
          <p className="mt-6 text-center text-xs py-2 px-2">Please email the administrator you contacted for account creation if you forget your password or encounter any login issues.</p>
        </div>
      </div>
    </div>
  )
}

export default Login;
