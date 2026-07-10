# Content Translation — Validation

## Scenario 1: A repeated tap on Translate while a request is in flight sends no duplicate request
  Given: a comment's "Translate" tap has been sent and the response has not yet arrived
  When:  the viewer taps "Translate" again before the response arrives
  Then:  no second translation request is sent
  When:  the original request resolves
  Then:  the comment shows that single translation result
