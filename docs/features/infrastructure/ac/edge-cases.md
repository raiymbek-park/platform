# Infrastructure — Edge Cases

## Scenario 1: Cold-start latency within budget

  Given: the function has idled to zero instances
  When:  the first request after idle arrives
  Then:  it responds within 5 s
         subsequent warm requests respond within 500 ms

## Scenario 2: SPA deep-link refresh on GitHub Pages

  Given: the web app is served from GitHub Pages with a `404.html` fallback
  When:  a resident reloads or directly opens a deep route (e.g. `/platform/onboarding/verify`)
  Then:  the app shell loads and the router resolves the route
         GitHub Pages does not serve a raw 404

## Scenario 3: Lockout persists across cold start

  Given: a number is locked for 24 hours (server truth in `otpSessions/{phone}`)
  When:  the function cold-starts after idling to zero
  Then:  the lockout and its remaining time are restored from Firestore
         the lock is not reset by the restart

## Scenario 4: Refresh-token single-use honored across redeploy

  Given: a session refresh-token record exists in `sessions/{id}`
  When:  the function is redeployed and the same refresh token is presented twice
  Then:  the first renewal succeeds and marks the record used
         the second presentation of the spent token is rejected

## Scenario 5: Concurrent OTP requests for the same number

  Given: two requests for the same phone arrive close together
  When:  both update `otpSessions/{phone}`
  Then:  the send count and resend/lockout timestamps update atomically
         the resend ladder is not corrupted by the race
