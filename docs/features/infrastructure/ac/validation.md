# Infrastructure — Security & Access Validation

## Scenario 1: Firestore denies direct client access

  Given: Firestore security rules are deployed
  When:  a client attempts to read or write `residents/*`, `otpSessions/*`, `sessions/*`, or
         `content/*` directly with the client SDK
  Then:  the operation is denied
         data is reachable only through the `api` function (Admin SDK)

## Scenario 2: Storage rules enforce the path convention

  Given: Storage security rules are deployed
  When:  access is attempted under each path
  Then:  `assets/**` is publicly readable and not client-writable
         `users/{uid}/**` is readable and writable only by the matching authenticated owner
         any other path is denied

## Scenario 3: CORS scoped to the Pages origin

  Given: the `api` function has CORS configured
  When:  a browser makes a cross-origin request from the GitHub Pages origin, including the
         preflight `OPTIONS`
  Then:  the response carries `Access-Control-Allow-Origin` for that origin and the preflight
         succeeds
  And when: a request originates from any other web origin
  Then:  no permissive CORS headers are returned, so the browser blocks the response

## Scenario 4: Secrets never reach the web bundle

  Given: the web app is built for production
  When:  the bundle is inspected
  Then:  no Firebase service-account or provider (Twilio) credentials are present
         only `VITE_*` public config (API URL, base path) is embedded
