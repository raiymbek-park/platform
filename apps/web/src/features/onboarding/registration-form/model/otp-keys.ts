export const otpKeys = {
  all: ['otp'] as const,
  send: () => [...otpKeys.all, 'send'] as const,
}
