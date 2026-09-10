import passport from 'passport'
import { Strategy as GoogleTokenStrategy } from 'passport-google-oauth20'
import { OAuth2Client } from 'google-auth-library'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Client ID and Secret must be defined');
}


// SOCIAL STRATEGY
const SocialTokenStrategyCallback = (accessToken: string, refreshToken: string, profile: any, done: any) => done(null, {
    accessToken,
    refreshToken,
    profile,
})

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const verify = async (token: string) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return payload
}

passport.use(new GoogleTokenStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
}, SocialTokenStrategyCallback));

const authenticateGoogle = (req: any, res: any) => new Promise((resolve, reject) => {
    passport.authenticate('google-token', { session: false }, (err: any, data: any, info: any) => {
        if (err) reject(err);
        resolve({ data, info });
    })(req, res);
});

const authenticateGoogleOneTap = (token: string) => new Promise((resolve, reject) => {
    verify(token)
        .then(res => {
            resolve({ data: res })
        }).catch(reject)
});

export { authenticateGoogle, authenticateGoogleOneTap };