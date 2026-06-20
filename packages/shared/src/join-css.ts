export const joinCss = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ')
