import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import proxy from 'express-http-proxy'
import { isAuth } from './middleware/isAuth.js'
import { currentUser } from './controllers/user.controller.js'
import { proxyReqOptDecorator } from './utils/proxyHeader.js'
dotenv.config();


// Constant variables
const port = process.env.PORT || 3000;
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
const authService = process.env.AUTH_SERVICE || 'http://localhost:8001';
const projectService = process.env.PROJECT_SERVICE || 'http://localhost:8002';
const managementService = process.env.MANAGEMENT_SERVICE || 'http://localhost:8003';
const paymentService = process.env.PAYMENT_SERVICE || 'http://localhost:8006';
const app = express();

// middlewares
app.use(cors({
    origin: frontendURL,
    credentials: true,
}));

app.use(cookieParser());
app.use(morgan('dev')); // creates logs of the requests

// Services

// Proxy auth requests with preserved path
app.use('/api/auth', proxy(authService, {
    proxyReqPathResolver: (req) => {
        return `/api/auth${req.url}`;
    }
}));

// Proxy project requests with preserved path
app.use('/api/project', isAuth, proxy(projectService, {
    proxyReqPathResolver: (req) => {
        return `/api/project${req.url}`;
    },
    proxyReqOptDecorator,
}));

// Proxy management requests with preserved path
app.use('/api/management', isAuth, proxy(managementService, {
    proxyReqPathResolver: (req) => {
        return `/api/management${req.url}`;
    },
    proxyReqOptDecorator,
}));

// Proxy payment webhook directly without isAuth (Razorpay server calls webhook with signature header)
app.use('/api/payment/webhook', proxy(paymentService, {
    proxyReqPathResolver: () => {
        return '/api/payment/webhook';
    },
    parseReqBody: false
}));

// Proxy public plans endpoint without isAuth so unauthenticated visitors can view pricing
app.use('/api/payment/plans', proxy(paymentService, {
    proxyReqPathResolver: () => {
        return '/api/payment/plans';
    },
    parseReqBody: false
}));

// Proxy authenticated payment requests (order creation, verification, history, subscription)
app.use('/api/payment', isAuth, proxy(paymentService, {
    proxyReqPathResolver: (req) => {
        return `/api/payment${req.url}`;
    },
    proxyReqOptDecorator,
    parseReqBody: false
}));

// isAuth middlware
app.get('/api/currentUser', isAuth, currentUser)

app.use(express.json());

// Routes
app.get('/', (_, res) => {
    res.send('hello from gateway');
});


app.listen(port, () => {
    console.log(`gateway started at port: ${port}`);
});
