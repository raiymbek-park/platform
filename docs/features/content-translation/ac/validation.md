# Content Translation — Validation

## Scenario 1: Toggling a comment between translation and original makes no request
  Given: a comment displayed in the viewer's locale with a show-original toggle
  When:  the viewer taps the toggle repeatedly
  Then:  the message swaps between the stored translation and the stored original each tap
         no API request is made for any of the taps
