import { Auth } from "..";
import { JsonError, SERVER_ERROR_MAP } from "./errors";
import { AUTH_ERROR_FACTORY, AuthError } from "../core/errors";
import { FirebaseError } from "@firebase/util";

// TODO: pass this in for emulator
export const PRODUCTION_URL = 'https://identitytoolkit.googleapis.com';

export enum HttpMethod {
  POST = 'POST'
}

export enum Endpoint {
  SIGN_UP = '/v1/accounts:signUp',
  SIGN_IN_WITH_PASSWORD = '/v1/accounts:signInWithPassword',
  SEND_VERIFICATION_CODE = '/v1/accounts:sendVerificationCode',
  SEND_OOB_CODE = '/v1/accounts:sendOobCode'
}

export async function performApiRequest<T,V>(
  auth: Auth,
  method: HttpMethod,
  path: Endpoint,
  request: T
): Promise<V> {
  try {
    const response = await fetch(
      `${PRODUCTION_URL}${path}?key=${auth.config.apiKey}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(request)
      }
    );
    if(response.ok) {
      return response.json();
    } else {
      const json: JsonError = await response.json();
      const authError = SERVER_ERROR_MAP[json.error.message];
      if(authError) {
        throw AUTH_ERROR_FACTORY.create(authError, { appName: auth.name });
      } else {
        // TODO probably should handle improperly formatted errors as well
        // If you see this, add an entry to SERVER_ERROR_MAP for the corresponding error
        throw new Error(`Unexpected API error: ${json.error.message}`);
      }
    }
  } catch (e) {
    if(e instanceof FirebaseError) {
      throw e;
    }
    throw AUTH_ERROR_FACTORY.create(AuthError.NETWORK_REQUEST_FAILED, { appName: auth.name });
  }
}