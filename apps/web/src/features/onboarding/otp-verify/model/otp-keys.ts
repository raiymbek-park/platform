export const otpKeys = {
  all: ['otp'] as const,
  verify: () => [...otpKeys.all, 'verify'] as const,
  resend: () => [...otpKeys.all, 'send'] as const,
  register: () => ['resident', 'register'] as const,
}
