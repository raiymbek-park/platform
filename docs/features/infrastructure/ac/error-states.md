# Infrastructure — Error States

## Scenario 1: Firestore unavailable during a write

  Given: a register or mark-visit request carries a verified identity
  When:  the Firestore write is unreachable or returns an error
  Then:  the API surfaces an error to the client
         the resident document is left in a consistent state — each write is a single
         document set, so no intermediate partial state is committed

## Scenario 2: Firestore unavailable during a read

  Given: the home screen requests profile, contacts, or changes
  When:  the Firestore read is unreachable or returns an error
  Then:  the API surfaces an error response to the client rather than stale or fabricated data

## Scenario 3: Token verification fails

  Given: a request carries an expired, revoked, or malformed Firebase ID token
  When:  the API resolves the request context
  Then:  the request carries no identity (`uid` is null)
         any mutation requiring identity is rejected as `UNAUTHORIZED`

## Scenario 4: Verification-code delivery fails at Firebase Phone Auth

  Given: a resident requests a verification code
  When:  Firebase Phone Authentication rejects the request (e.g. quota exhausted or an
         invalid number)
  Then:  the client surfaces the failure to the resident
         no Firebase session is established and no API mutation is authorized
