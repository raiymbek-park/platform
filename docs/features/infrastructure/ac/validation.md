# Infrastructure — Auth, Security & Access Validation

## Scenario 1: Registration without a verified identity is rejected

  Given: a register request arrives with no token, or with a token that fails verification
  When:  the resident attempts to register
  Then:  the request is rejected as `UNAUTHORIZED`
         no `residents` document is written

## Scenario 2: Marking a visit without a verified identity is rejected

  Given: a mark-visit request arrives with no token, or with a token that fails verification
  When:  the resident attempts to mark a visit
  Then:  the request is rejected as `UNAUTHORIZED`
         no `lastVisit` is written

## Scenario 3: Identity is derived from the bearer token

  Given: a request carries `Authorization: Bearer <id-token>` and the token verifies
  When:  the API resolves the request context
  Then:  the context exposes the token's `uid` and phone number
         a request with a malformed or non-`Bearer` authorization header resolves to no
         identity (`uid` is null)

## Scenario 4: Stored profile reads back unchanged for the same uid

  Given: a resident profile was written under `uid` `U`
  When:  the same `uid` `U` is read on a fresh request
  Then:  the returned profile equals the stored name, block, apartment, role, and phone

## Scenario 5: Firestore denies direct client access

  Given: the deny-all Firestore security rules are deployed
  When:  an unauthenticated client uses the client SDK to read or write `residents/*`,
         `serviceContacts/*`, or `events/*` directly
  Then:  every such read and write is denied
         the data is reachable only through the `api` function via the Admin SDK

## Scenario 6: Storage rules enforce the path convention

  Given: the Storage security rules are deployed
  When:  access is attempted under each path
  Then:  `assets/**` is publicly readable and not client-writable
         `users/{uid}/**` is readable and writable only by the matching authenticated owner
         any other path is denied

## Scenario 7: CORS scoped to the Pages origin

  Given: the `api` function has CORS restricted to `https://raiymbek-park.github.io`
  When:  a browser makes a cross-origin request from that origin, including the preflight
         `OPTIONS`
  Then:  the response carries `Access-Control-Allow-Origin` for that origin and the preflight
         succeeds
  And when: a request originates from any other web origin
  Then:  no permissive CORS headers are returned, so the browser blocks the response

## Scenario 8: Secrets never reach the web bundle

  Given: the web app is built for production
  When:  the bundle is inspected
  Then:  no Firebase Admin service-account key and no local-dev refresh token are present
         only `VITE_*` public config and the public Firebase web config are embedded
