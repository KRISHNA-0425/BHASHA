import mongoose from "mongoose";
import File from "../models/managment.model.js";
import { buildTree } from "../utils/buildTree.js";

export const createRootFolder = async (req, res) => {
    try {
        const { projectId, projectName } = req.body;
        const userId = req.headers['x-user-id'];

        if (!projectId || !projectName) {
            return res.status(400).json({ message: 'Project name and Id are required' });
        }

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'invalid projectId' });
        }

        const existingRootFolder = await File.findOne({ 
            projectId, 
            parentId: null, 
            isDeleted: false 
        });

        if (existingRootFolder) {
            return res.status(400).json({ message: "Can't create new root folder" });
        }

        const rootFolder = await File.create({
            owner: userId,
            name: projectName.trim(),
            projectId,
            type: "folder",
            parentId: null
        });

        return res.status(201).json(rootFolder);

    } catch (error) {
        console.error("createRootFolder error:", error);
        return res.status(500).json({ message: 'internal server error in createRootFolder' });
    }
};

export const createFolder = async (req, res) => {
    try {
        const { name, parentId, projectId } = req.body;
        const userId = req.headers["x-user-id"];

        if (!name || typeof name !== 'string' || !name.trim() || !projectId) {
            return res.status(400).json({ message: 'Folder name and projectId are required' });
        }

        if (!parentId) {
            return res.status(400).json({ message: 'parentId is required' });
        }

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'invalid projectId or parentId' });
        }

        // Verify parent folder exists and belongs to the same project
        const parentFolder = await File.findOne({
            _id: parentId,
            projectId,
            type: "folder",
            isDeleted: false
        });

        if (!parentFolder) {
            return res.status(404).json({ message: 'parent folder not found' });
        }

        // Check if folder with same name already exists under the parent
        const existFolder = await File.findOne({
            projectId,
            name: name.trim(),
            parentId,
            isDeleted: false
        });

        if (existFolder) {
            return res.status(400).json({ message: 'folder already exists' });
        }

        const folder = await File.create({
            owner: userId,
            name: name.trim(),
            projectId,
            type: "folder",
            parentId
        });

        return res.status(201).json(folder);

    } catch (error) {
        console.error("createFolder error:", error);
        return res.status(500).json({ message: 'internal server error createFolder' });
    }
};

export const createFile = async (req, res) => {
    try {
        const { name, parentId, projectId, content = "", language = "plainText" } = req.body;
        const userId = req.headers["x-user-id"];

        if (!name || typeof name !== 'string' || !name.trim() || !projectId) {
            return res.status(400).json({ message: 'File name and projectId are required' });
        }

        if (!parentId) {
            return res.status(400).json({ message: 'parentId is required' });
        }

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'invalid projectId or parentId' });
        }

        // Verify parent folder exists and belongs to the same project
        const parentFolder = await File.findOne({
            _id: parentId,
            projectId,
            type: "folder",
            isDeleted: false
        });

        if (!parentFolder) {
            return res.status(404).json({ message: 'parent folder not found' });
        }

        // Check if file with same name already exists under the parent
        const existFile = await File.findOne({
            projectId,
            name: name.trim(),
            parentId,
            isDeleted: false
        });

        if (existFile) {
            return res.status(400).json({ message: 'file already exists' });
        }

        const trimmedName = name.trim();
        const extension = trimmedName.includes(".") ? trimmedName.split(".").pop() : "";
        const fileContent = typeof content === "string" ? content : String(content || "");

        const file = await File.create({
            owner: userId,
            name: trimmedName,
            projectId,
            type: "file",
            language,
            content: fileContent,
            extension,
            size: Buffer.byteLength(fileContent, "utf-8"),
            parentId
        });

        return res.status(201).json(file);

    } catch (error) {
        console.error("createFile error:", error);
        return res.status(500).json({ message: 'internal server error createFile' });
    }
};

export const updateFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, content, language } = req.body;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid file id' });
        }

        // Find existing file belonging to this user
        const file = await File.findOne({
            _id: id,
            owner: userId,
            isDeleted: false
        });

        if (!file) {
            return res.status(404).json({ message: 'file not found' });
        }

        // If renaming, check for name collision under the same parent
        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'name cannot be empty' });
            }
            const trimmedName = name.trim();

            if (trimmedName !== file.name) {
                const duplicate = await File.findOne({
                    _id: { $ne: file._id },
                    projectId: file.projectId,
                    parentId: file.parentId,
                    name: trimmedName,
                    isDeleted: false
                });

                if (duplicate) {
                    return res.status(400).json({ message: 'a file with this name already exists in this folder' });
                }

                file.name = trimmedName;
                if (file.type === 'file') {
                    file.extension = trimmedName.includes(".") ? trimmedName.split(".").pop() : "";
                }
            }
        }

        // Update content if provided
        if (content !== undefined && file.type === 'file') {
            const fileContent = typeof content === "string" ? content : String(content || "");
            file.content = fileContent;
            file.size = Buffer.byteLength(fileContent, "utf-8");
        }

        // Update language if provided
        if (language !== undefined && file.type === 'file') {
            file.language = language;
        }

        await file.save();

        return res.status(200).json(file);

    } catch (error) {
        console.error("updateFile error:", error);
        return res.status(500).json({ message: 'internal server error in updateFile' });
    }
};

export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid file id' });
        }

        const file = await File.findOne({
            _id: id,
            owner: userId,
            type: "file",
            isDeleted: false
        });

        if (!file) {
            return res.status(404).json({ message: 'file not found' });
        }

        file.isDeleted = true;
        await file.save();

        return res.status(200).json({ message: 'file deleted successfully', fileId: id });

    } catch (error) {
        console.error("deleteFile error:", error);
        return res.status(500).json({ message: 'internal server error in deleteFile' });
    }
};

export const deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid folder id' });
        }

        const folder = await File.findOne({
            _id: id,
            owner: userId,
            type: "folder",
            isDeleted: false
        });

        if (!folder) {
            return res.status(404).json({ message: 'folder not found' });
        }

        // Prevent deleting the root project folder directly
        if (folder.parentId === null) {
            return res.status(400).json({ message: "cannot delete root folder" });
        }

        // Recursively find all child folder and file IDs under this folder
        const allIdsToDelete = [folder._id];
        let currentLevelFolderIds = [folder._id];

        while (currentLevelFolderIds.length > 0) {
            const children = await File.find({
                parentId: { $in: currentLevelFolderIds },
                owner: userId,
                isDeleted: false
            }).select('_id type');

            if (children.length === 0) break;

            const childIds = children.map(child => child._id);
            allIdsToDelete.push(...childIds);

            // Filter out nested folders for next iteration depth
            currentLevelFolderIds = children
                .filter(child => child.type === 'folder')
                .map(child => child._id);
        }

        // Soft delete the folder and all its recursive contents
        await File.updateMany(
            { _id: { $in: allIdsToDelete } },
            { $set: { isDeleted: true } }
        );

        return res.status(200).json({ 
            message: 'folder and its contents deleted successfully', 
            deletedCount: allIdsToDelete.length,
            folderId: id 
        });

    } catch (error) {
        console.error("deleteFolder error:", error);
        return res.status(500).json({ message: 'internal server error in deleteFolder' });
    }
};

export const getFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'invalid file id' });
        }

        const file = await File.findOne({
            _id: id,
            owner: userId,
            isDeleted: false
        });

        if (!file) {
            return res.status(404).json({ message: 'file not found' });
        }

        return res.status(200).json(file);
    } catch (error) {
        console.error("getFile error:", error);
        return res.status(500).json({ message: 'internal server error in getFile' });
    }
};

export const getTree = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { projectId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'invalid projectId' });
        }

        // Fetch all active files and folders for this project and user
        const files = await File.find({
            projectId,
            owner: userId,
            isDeleted: false
        }).sort({ name: 1 });

        const tree = buildTree(files);

        return res.status(200).json(tree);

    } catch (error) {
        console.error("getTree error:", error);
        return res.status(500).json({ message: 'internal server error in getTree' });
    }
};

export const getAllProjectFiles = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { projectId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'user is not authorized' });
        }

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'invalid projectId' });
        }

        // Fetch all files and folders (including soft-deleted) for synchronization
        const files = await File.find({
            projectId,
            owner: userId
        }).select('_id name parentId type isDeleted content language extension').lean();

        return res.status(200).json(files);

    } catch (error) {
        console.error("getAllProjectFiles error:", error);
        return res.status(500).json({ message: 'internal server error in getAllProjectFiles' });
    }
};
