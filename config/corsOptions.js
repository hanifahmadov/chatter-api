/* eslint-disable */
const allowedOrigins = [ 
    process.env.CLIENT_DEV_ORIGIN,
    process.env.CLIENT_PRO_ORIGIN,
    "https://www.chatter.hanifahmadov.site",
    "https://chatter.hanifahmadov.site",
    "http://www.chatter.hanifahmadov.site",
    "http://chatter.hanifahmadov.site",
    "52.22.120.131",
    "http://52.22.120.131",
    "https://52.22.120.131",
]

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions 