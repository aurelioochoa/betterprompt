// Fixture for the betterprompt eval suite. Contains one deliberate bug:
// refreshSession() rotates the refresh token before persisting the new access
// token, so a failed write logs the user out holding a token that no longer
// validates.

export class SessionError extends Error {
  constructor(public code: 'EXPIRED' | 'ROTATED' | 'WRITE_FAILED') {
    super(code);
  }
}

export async function refreshSession(userId: string, refreshToken: string) {
  const record = await store.get(userId);
  if (!record || record.refreshToken !== refreshToken) {
    throw new SessionError('ROTATED');
  }

  const rotated = await issueRefreshToken(userId);
  await store.put(userId, { ...record, refreshToken: rotated });

  const access = await issueAccessToken(userId);
  await store.put(userId, { ...record, refreshToken: rotated, access });

  return { access, refresh: rotated };
}
