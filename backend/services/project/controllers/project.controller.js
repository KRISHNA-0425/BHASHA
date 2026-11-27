import mongoose from "mongoose";
import redis from "../../../shared/redis/redis.js";
import Project from "../model/project.model.js";

const invalidateUserCache = async (userId) => {
    try {
        await Promise.all([
            redis.del(`projects-${userId}`),
            redis.del(`liked-${userId}`)
        ]);
    } catch (error) {
        console.error("Redis cache invalidation error:", error);
    }
};

export const createProject = async (req, res) => {
    try {
        const { name, description, liked } = req.body;
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'name is required' });
        }

        // Enforce 5-project limit for Starter / Free tier
        const currentCount = await Project.countDocuments({ owner: userId });
        if (currentCount >= 5) {
            let isPro = false;
            try {
                const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006';
                const response = await fetch(`${paymentServiceUrl}/api/payment/subscription`, {
                    headers: { 'x-user-id': userId },
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    const data = await response.json();
                    const sub = data?.subscription;
                    isPro = sub?.status?.toUpperCase() === 'ACTIVE' &&
                        (sub?.planId === 'PRO_MONTHLY' || sub?.planId === 'PRO_YEARLY');
                }
            } catch (subErr) {
                console.error("Subscription verification error:", subErr.message);
            }

            if (!isPro) {
                return res.status(403).json({
                    message: 'Starter plan workspace capacity reached (maximum 5 projects). Upgrade to Pro for unlimited cloud workspaces.',
                    code: 'PROJECT_LIMIT_EXCEEDED',
                    currentCount,
                    maxAllowed: 5
                });
            }
        }

        const project = await Project.create({
            name: name.trim(),
            description,
            liked: Boolean(liked),
            owner: userId
        });

        // invalidate user's cached project lists
        await invalidateUserCache(userId);

        return res.status(201).json(project);

    } catch (error) {
        console.error("createProject error:", error);
        return res.status(500).json({ message: 'internal server error in the create project controller' });
    }
};

export const getAllProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        const key = `projects-${userId}`;

        // if in cache get from it, else query database
        let result = await redis.get(key);

        if (result) {
            return res.status(200).json(JSON.parse(result));
        }

        // finding all the projects for this user, latest first
        const projects = await Project.find({ owner: userId }).sort({ updatedAt: -1, createdAt: -1 });

        await redis.set(key, JSON.stringify(projects), 'EX', 3600);

        return res.status(200).json(projects);

    } catch (error) {
        console.error("getAllProject error:", error);
        return res.status(500).json({ message: 'internal server error in the getAllProject controller' });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid id' });
        }

        const project = await Project.findOne({ _id: id, owner: userId });
        if (!project) {
            return res.status(404).json({ message: 'project not found' });
        }

        project.lastOpen = new Date();
        await project.save();

        return res.status(200).json(project);

    } catch (error) {
        console.error("getProjectById error:", error);
        return res.status(500).json({ message: 'internal server error in the getProjectById controller' });
    }
};

export const getProjectByLiked = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        const key = `liked-${userId}`;

        // check cache first
        let result = await redis.get(key);
        if (result) {
            return res.status(200).json(JSON.parse(result));
        }

        const projects = await Project.find({ owner: userId, liked: true }).sort({ updatedAt: -1, createdAt: -1 });

        await redis.set(key, JSON.stringify(projects), 'EX', 3600);

        return res.status(200).json(projects);

    } catch (error) {
        console.error("getProjectByLiked error:", error);
        return res.status(500).json({ message: 'internal server error in the getProjectByLiked controller' });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid id' });
        }

        const project = await Project.findOne({ _id: id, owner: userId });
        if (!project) {
            return res.status(404).json({ message: 'project not found' });
        }

        project.liked = !project.liked;
        await project.save();

        await invalidateUserCache(userId);

        return res.status(200).json(project);

    } catch (error) {
        console.error("toggleLike error:", error);
        return res.status(500).json({ message: 'internal server error in the toggleLike controller' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: 'user not authorized' });
        }

        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid id' });
        }

        const deletedProject = await Project.findOneAndDelete({ _id: id, owner: userId });
        if (!deletedProject) {
            return res.status(404).json({ message: 'project not found' });
        }

        await invalidateUserCache(userId);

        return res.status(200).json({ message: "project deleted" });

    } catch (error) {
        console.error("deleteProject error:", error);
        return res.status(500).json({ message: 'internal server error in the delete project controller' });
    }
};