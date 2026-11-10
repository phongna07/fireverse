import {
  AuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FC, useState } from "react";

import { toast } from "../store/toast";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth } from "../shared/firebase";

const SignIn: FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSignIn = (provider: AuthProvider) => {
    setLoading(true);

    signInWithPopup(auth, provider)
      .catch((err: { code?: string }) => {
        if (
          err.code === "auth/popup-closed-by-user" ||
          err.code === "auth/cancelled-popup-request"
        )
          return;
        toast.error(
          err.code === "auth/popup-blocked"
            ? "Allow popups in your browser and try again."
            : err.code === "auth/network-request-failed"
              ? "Check your connection and try again."
              : "Unable to sign in. Please try again or choose another provider.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div className="mx-[5vw] my-5 flex justify-center lg:my-10">
        <div className="w-full max-w-[1100px]">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <img
                loading="lazy"
                decoding="async"
                className="h-8 w-8"
                src="/icon.svg"
                alt=""
              />
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

          <div className="flex flex-col-reverse gap-12 md:mt-5 md:flex-row md:gap-15 lg:mt-10">
            <div className="flex-1">
              <img
                loading="lazy"
                decoding="async"
                className="h-auto w-full"
                src="/welcome.jpg"
                alt=""
              />
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
                <img
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-6"
                  src="/google.svg"
                  alt=""
                />

                <span>Sign In With Google</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleSignIn(new FacebookAuthProvider())}
                className="flex min-w-[250px] cursor-pointer items-center gap-3 rounded-md bg-primary p-3 text-white transition duration-300 hover:brightness-90 disabled:cursor-default! disabled:brightness-75!"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-6"
                  src="/facebook.svg"
                  alt=""
                />

                <span>Sign In With Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const isInternalPath = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\/(?![\/\\])/.test(value) &&
  !/[\\\u0000-\u0020]/.test(value);

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    isInternalPath(search.redirect) ? { redirect: search.redirect } : {},
  beforeLoad: ({ context, search }) => {
    if (context.user) throw redirect({ to: search.redirect || "/" });
  },
  component: SignIn,
});
