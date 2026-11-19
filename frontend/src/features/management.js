import api from "../utils/axios";

/**
 * Fetch the complete nested file and folder tree for a project
 * @param {string} projectId 
 */
export const getTree = async (projectId) => {
    const { data } = await api.get(`/api/management/tree/${projectId}`);
    return data;
};

/**
 * Fetch a single file by its ID (including full text content)
 * @param {string} fileId 
 */
export const getFile = async (fileId) => {
    const { data } = await api.get(`/api/management/file/${fileId}`);
    return data;
};

/**
 * Create the root folder for a project (used when initializing an empty project)
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.projectName
 */
export const createRootFolder = async ({ projectId, projectName }) => {
    const { data } = await api.post("/api/management/createRootFolder", {
        projectId,
        projectName
    });
    return data;
};

/**
 * Create a new subfolder under a parent folder
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.parentId
 * @param {string} params.name
 */
export const createFolder = async ({ projectId, parentId, name }) => {
    const { data } = await api.post("/api/management/createFolder", {
        projectId,
        parentId,
        name
    });
    return data;
};

/**
 * Create a new file inside a folder
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.parentId
 * @param {string} params.name
 * @param {string} [params.content=""]
 * @param {string} [params.language="plainText"]
 */
export const createFile = async ({ projectId, parentId, name, content = "", language = "plainText" }) => {
    const { data } = await api.post("/api/management/createFile", {
        projectId,
        parentId,
        name,
        content,
        language
    });
    return data;
};

/**
 * Update an existing file's content, name, or language
 * @param {string} fileId 
 * @param {Object} payload 
 * @param {string} [payload.name]
 * @param {string} [payload.content]
 * @param {string} [payload.language]
 */
export const updateFile = async (fileId, payload) => {
    const { data } = await api.put(`/api/management/updateFile/${fileId}`, payload);
    return data;
};

/**
 * Soft delete a file
 * @param {string} fileId 
 */
export const deleteFile = async (fileId) => {
    const { data } = await api.delete(`/api/management/deleteFile/${fileId}`);
    return data;
};

/**
 * Soft delete a folder and all its recursive contents
 * @param {string} folderId 
 */
export const deleteFolder = async (folderId) => {
    const { data } = await api.delete(`/api/management/deleteFolder/${folderId}`);
    return data;
};

/**
 * Trigger synchronization between the local terminal workspace disk and MongoDB
 * Scans for newly created files/folders (e.g. package.json, npm scripts) and registers them
 * @param {string} projectId 
 * @param {string} [userId]
 */
export const syncTerminalDisk = async (projectId, userId) => {
    try {
        const { data } = await api.post('/api/terminal/sync', { projectId, userId });
        return data;
    } catch (err) {
        // Fallback directly to terminal service port if gateway route is unavailable
        try {
            const terminalUrl = import.meta.env.VITE_TERMINAL_URL || 'http://localhost:8005';
            const res = await fetch(`${terminalUrl}/sync-disk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(userId ? { 'x-user-id': String(userId) } : {})
                },
                body: JSON.stringify({ projectId, userId })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (directErr) {
            console.warn('Direct terminal sync fallback failed:', directErr);
        }
        return null;
    }
};

