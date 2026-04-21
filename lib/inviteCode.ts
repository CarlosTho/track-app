export const INVITE_CODE_LENGTH = 6

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

