import axios from "axios";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

/**
 * Microsoft Identity Platform (Azure AD v2.0) "common" tenant OAuth flow.
 * We deliberately avoid `passport-microsoft` so we don't need an in-memory
 * `express-session` — the JWT cookie is the only session.
 */

const SCOPES = ["openid", "profile", "email", "User.Read"];

export function isMicrosoftConfigured(): boolean {
  return Boolean(env.microsoft.clientId && env.microsoft.clientSecret);
}

function authority() {
  return `https://login.microsoftonline.com/${env.microsoft.tenant || "common"}`;
}

export function buildAuthorizeUrl(state: string): string {
  if (!isMicrosoftConfigured()) {
    throw new HttpError(503, "Microsoft OAuth is not configured");
  }
  const url = new URL(`${authority()}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", env.microsoft.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env.microsoft.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeCodeForProfile(code: string): Promise<{
  microsoftId: string;
  email: string;
  name: string;
}> {
  if (!isMicrosoftConfigured()) {
    throw new HttpError(503, "Microsoft OAuth is not configured");
  }

  const tokenRes = await axios.post(
    `${authority()}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: env.microsoft.clientId,
      client_secret: env.microsoft.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: env.microsoft.redirectUri,
      scope: SCOPES.join(" "),
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      validateStatus: () => true,
    },
  );
  if (tokenRes.status >= 400) {
    throw new HttpError(401, `Microsoft token exchange failed: ${tokenRes.data?.error_description ?? tokenRes.statusText}`);
  }
  const accessToken = tokenRes.data?.access_token as string | undefined;
  if (!accessToken) throw new HttpError(401, "Microsoft token exchange returned no access_token");

  const meRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    validateStatus: () => true,
  });
  if (meRes.status >= 400) {
    throw new HttpError(401, "Failed to fetch Microsoft Graph profile");
  }
  const me = meRes.data as {
    id: string;
    mail?: string;
    userPrincipalName?: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
  };

  const email = (me.mail || me.userPrincipalName || "").toLowerCase();
  if (!email) throw new HttpError(401, "Microsoft account has no email");

  return {
    microsoftId: me.id,
    email,
    name: me.displayName || [me.givenName, me.surname].filter(Boolean).join(" ") || email,
  };
}
