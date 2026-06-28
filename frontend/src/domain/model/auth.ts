/**
 * Auth value objects. The login *strategy* is provider-driven so the UI renders
 * it generically: NCM yields a scan-this-QR flow, an OAuth provider yields a
 * open-this-url redirect flow. Credentials persist as an opaque `AuthSession`.
 */

/** The persisted credential a provider attaches to authenticated requests
 *  (an NCM session cookie, an OAuth access token, …). Opaque to the UI. */
export type AuthSession = { token: string };

/** Progress of an in-flight login (QR scan state, or redirect completion). */
export type LoginStatus =
  | { state: "pending" } // QR shown, not yet scanned
  | { state: "scanned" } // scanned on the phone, awaiting confirm
  | { state: "authorized" } // success — the provider has stored the credential
  | { state: "expired" }; // the QR / request lapsed, restart

/** A login the UI drives generically off `kind`. */
export type LoginFlow =
  | { kind: "qr"; image: string; poll: () => Promise<LoginStatus> }
  | {
      kind: "redirect";
      authorizeUrl: string;
      complete: (code: string) => Promise<LoginStatus>;
    };
