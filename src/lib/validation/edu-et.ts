/** Ethiopian university email domains used at sign-in / registration. */
export const EDU_ET_PATTERN = /^.+@(.+\.)?(edu\.et|university\.edu\.et)$/i;

export function isEduEtEmail(email: string): boolean {
  return EDU_ET_PATTERN.test(email.trim());
}
