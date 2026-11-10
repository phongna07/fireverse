import {
  AuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FC, useState } from "react";

import Alert from "../components/Alert";
import { Navigate } from "react-router-dom";
import { auth } from "../shared/firebase";
import { useQueryParams } from "../hooks/useQueryParams";
import { useStore } from "../store";

const SignIn: FC = () => {
  const { redirect } = useQueryParams();

  const currentUser = useStore((state) => state.currentUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAlertOpened, setIsAlertOpened] = useState(false);

  const handleSignIn = (provider: AuthProvider) => {
    setLoading(true);

    signInWithPopup(auth, provider)
      .then((res) => {
        console.log(res.user);
      })
      .catch((err) => {
        setIsAlertOpened(true);
        setError(`Error: ${err.code}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (currentUser) return <Navigate to={redirect || "/"} />;

  return (
    <>
      <div className="mx-[5vw] my-5 flex justify-center lg:my-10">
        <div className="w-full max-w-[1100px]">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <img className="h-8 w-8" src="/icon.svg" alt="" />
              <span className="text-2xl">FireVerse</span>
            </div>
            <a
              href="https://github.com/napthedev/fireverse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xl"
            >
              <i className="bx bxl-github"></i>
              <span>Github</span>
            </a>
          </div>

          <div className="md:gap-15 flex flex-col-reverse gap-12 md:mt-5 md:flex-row lg:mt-10">
            <div className="flex-1">
              <img className="h-auto w-full" src="/welcome.jpg" alt="" />
            </div>

            <div className="mt-12 flex flex-1 flex-col items-center gap-4 md:items-start lg:mt-24">
              <h1 className="text-center text-3xl md:text-left md:text-4xl">
                The best place for messaging
              </h1>
              <p className="text-center text-xl md:text-left md:text-2xl">
                It's free, fast and secure. We make it easy and fun to stay
                close to your favourite people.
              </p>

              <button
                disabled={loading}
                onClick={() => handleSignIn(new GoogleAuthProvider())}
                className="flex min-w-[250px] cursor-pointer items-center gap-3 rounded-md bg-white p-3 text-black transition duration-300 hover:brightness-90 disabled:cursor-default! disabled:brightness-75!"
              >
                <img className="h-6 w-6" src="/google.svg" alt="" />

                <span>Sign In With Google</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleSignIn(new FacebookAuthProvider())}
                className="bg-primary flex min-w-[250px] cursor-pointer items-center gap-3 rounded-md p-3 text-white transition duration-300 hover:brightness-90 disabled:cursor-default! disabled:brightness-75!"
              >
                <img className="h-6 w-6" src="/facebook.svg" alt="" />

                <span>Sign In With Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Alert
        isOpened={isAlertOpened}
        setIsOpened={setIsAlertOpened}
        text={error}
        isError
      />
    </>
  );
};

export default SignIn;
