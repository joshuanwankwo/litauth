"use client";
import { GoogleProvider } from "@lit-protocol/lit-auth-client";
import { ProviderType } from "@lit-protocol/constants";
import { useEffect, useState } from "react";
import {
  authenticateWithGoogle,
  getPKPs,
  mintPKP,
  getRedirectUri,
} from "../utils/lit";
import { litAuthClient } from "../utils/litConfig";
import Image from "next/image";
import Google from "../public/google.png";

export default function Home() {
  const [pkps, setPkps] = useState([
    {
      publicKey: "",
      ethAddress: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  async function signInWithGoogle(redirectUri: string) {
    const googleProvider = litAuthClient.initProvider<GoogleProvider>(
      ProviderType.Google,
      { redirectUri }
    );
    await googleProvider.signIn();
  }

  async function handleGoogleLogin() {
    const redirectUri = getRedirectUri();
    setLoading(true);
    await signInWithGoogle(redirectUri);
  }

  useEffect(() => {
    async function handleAuthRedirect() {
      const redirectUri = getRedirectUri();

      const authMethod = await authenticateWithGoogle(redirectUri);

      if (authMethod) {
        const requestType = localStorage.getItem("requestType");

        if (requestType === "mint") {
          setLoading(true);
          const account = await mintPKP(authMethod);
          setPkps([{ ...account }]);
        } else {
          setLoading(true);

          const accounts = await getPKPs(authMethod);
          accounts.map((account) =>
            setPkps([
              ...accounts,
              {
                publicKey: account.publicKey,
                ethAddress: account.ethAddress,
              },
            ])
          );
        }
        setLoaded(true);
        setLoading(false);
      }
    }

    handleAuthRedirect();
    setLoading(false);
  }, []);

  return (
    <div className="container">
      <div className="wrapper">
        <h1>LitAuth</h1>
        <p className="text-sm">
          Mint a new PKP with your Gmail or list PKPs associated with your
          Google account
        </p>
        <div className="buttons-container">
          <div className="social-container">
            <button
              type="button"
              className={`btn btn--outline ${loading && "btn--loading"}`}
              onClick={() => {
                localStorage.setItem("requestType", "mint");
                handleGoogleLogin();
              }}
            >
              <div className="btn__icon">
                <Image src={Google} alt="Google logo" sizes="10"></Image>
              </div>
              {!loading && <span className="btn__label">Mint PKP</span>}
            </button>
            <button
              type="button"
              className={`btn btn--outline ${loading && "btn--loading"}`}
              onClick={() => {
                localStorage.setItem("requestType", "list");
                handleGoogleLogin();
              }}
            >
              {!loading && <span className="btn__label">List PKPs</span>}
            </button>
          </div>
        </div>
        {loading
          ? ""
          : loaded && (
              <>
                {pkps[0].publicKey === ""
                  ? "You currently don't have nay PKP available, pplease mint one!"
                  : pkps.map((pkp) => (
                      <div className="pkp_list_item" key={pkp.ethAddress}>
                        <p className="text-sm font-semibold leading-6 text-gray-900">
                          <b>EthAddress:</b> {pkp.ethAddress}
                        </p>
                        <p className="mt-1 truncate text-ellipsis text-xs leading-5 text-gray-500 ">
                          <b>PublicKey:</b> {`${pkp.publicKey.slice(0, 65)}...`}
                        </p>
                      </div>
                    ))}
              </>
            )}
      </div>
    </div>
  );
}
