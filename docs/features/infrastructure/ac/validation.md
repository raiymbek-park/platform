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

## Scenario 3: CORS restricted to the Pages origin

  Given: the `api` function has CORS configured
  When:  a request arrives from the GitHub Pages origin
  Then:  the request is allowed
  And when: a request arrives from any other origin
  Then:  the request is rejected by CORS

## Scenario 4: Secrets never reach the web bundle

  Given: the web app is built for production
  When:  the bundle is inspected
  Then:  no Firebase service-account or provider (Twilio) credentials are present
         only `VITE_*` public config (API URL, base path) is embedded
