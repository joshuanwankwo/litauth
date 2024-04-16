import { AuthMethodScope, ProviderType } from "@lit-protocol/constants";
import { GoogleProvider } from "@lit-protocol/lit-auth-client";
import { AuthMethod, IRelayPKP } from "@lit-protocol/types";
import { litAuthClient } from "./litConfig";

export async function authenticateWithGoogle(
  redirectUri: string
): Promise<AuthMethod | undefined> {
  const googleProvider = litAuthClient.initProvider<GoogleProvider>(
    ProviderType.Google,
    { redirectUri }
  );
  try {
    const authMethod = await googleProvider.authenticate();
    return authMethod;
  } catch (error) {
    console.error("Error authenticating with Google:", error);
    return;
  }
}

export async function getPKPs(authMethod: AuthMethod) {
  try {
    const provider = litAuthClient.initProvider<GoogleProvider>(
      ProviderType.Google
    );
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    const pkps = await provider.fetchPKPsThroughRelayer(authMethod);
    return pkps;
  } catch (error) {
    console.error("Error fetching PKPs:", error);
    return [];
  }
}

export async function mintPKP(authMethod: AuthMethod): Promise<IRelayPKP> {
  const provider = litAuthClient.initProvider<GoogleProvider>(
    ProviderType.Google
  );
  // Set scope of signing any data
  const options = {
    permittedAuthMethodScopes: [[AuthMethodScope.SignAnything]],
  };

  let txHash: string;
  // Mint PKP through relay server
  txHash = await provider.mintPKPThroughRelayer(authMethod, options);

  const response = await provider.relay.pollRequestUntilTerminalState(txHash);
  if (response.status !== "Succeeded") {
    throw new Error("Minting failed");
  }
  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId ? response.pkpTokenId : "",
    publicKey: response.pkpPublicKey ? response.pkpPublicKey : "",
    ethAddress: response.pkpEthAddress ? response.pkpEthAddress : "",
  };
  return newPKP;
}

export function redirectToAppropriateUrl() {
  const hostname = window.location.hostname;
  const onLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // Check if running on localhost
  if (onLocalhost) {
    // Redirect to localhost:3000
    return "http://localhost:3000";
  } else {
    // Redirect to the home page
    return "https://your-deployed-domain.com"; // Change this URL to your domain
  }
}
