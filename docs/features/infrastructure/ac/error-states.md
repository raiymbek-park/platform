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

## Scenario 4: Verification-code delivery fails at the smsc.kz gateway

  Given: a resident requests a verification code
  When:  the smsc.kz gateway returns an error (e.g. insufficient balance or an invalid number)
  Then:  `otp.send` surfaces the failure to the client
         no custom token is minted and no Firebase session is established

## Scenario 5: Verify with an expired or exhausted code is rejected

  Given: `otps/{phone}` has expired, or its failed-attempt cap has been reached
  When:  the client calls `otp.verify`
  Then:  the request is rejected as an expired/invalid code
         no custom token is minted
         the resident must request a new code

## Scenario 6: Send rate limit returns a too-many-requests error

  Given: the per-phone send rate limit for `otp.send` has been reached
  When:  the client calls `otp.send` again for that phone
  Then:  the request is rejected with a too-many-requests error
         no new code is sent
