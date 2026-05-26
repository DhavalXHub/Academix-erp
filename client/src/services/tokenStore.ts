let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    window.dispatchEvent(new CustomEvent('academix:access-token', { detail: { token } }));
};

export const clearAccessToken = () => setAccessToken(null);
