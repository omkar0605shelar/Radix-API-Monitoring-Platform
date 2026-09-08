import jwt from 'jsonwebtoken';
import prisma from '../config/client.js';
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token || token === 'undefined' || token === 'null') {
        res.status(401).json({ message: 'Not authorized, no token provided' });
        return;
    }
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    }
    catch (error) {
        console.warn('JWT Verification Failed:', error.message);
        res.status(401).json({ message: `Not authorized, token failed: ${error.message}` });
        return;
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            console.warn(`Auth User Lookup: No user found for id ${decoded.id}`);
            res.status(401).json({ message: 'Not authorized, user not found' });
            return;
        }
        req.user = user;
        next();
        return;
    }
    catch (dbError) {
        console.error('Database Error in Auth protect middleware:', dbError);
        res.status(500).json({ message: 'Internal error checking authentication' });
        return;
    }
};
