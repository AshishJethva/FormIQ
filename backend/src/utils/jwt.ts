import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

// Create access token
export const signAccessToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'access_token_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN
        ? parseInt(process.env.JWT_EXPIRES_IN)
        : '15m',
    } // Short expiration for access token
  );
};

// Create refresh token
export const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'refresh_token_secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        ? parseInt(process.env.JWT_REFRESH_EXPIRES_IN)
        : '7d',
    } // Longer expiration for refresh token
  );
};

// Verify access token
export const verifyAccessToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'access_token_secret'
    ) as DecodedToken;

    return decoded;
  } catch {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'refresh_token_secret'
    ) as DecodedToken;

    return decoded;
  } catch {
    return null;
  }
};
