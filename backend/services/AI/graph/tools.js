import { tool } from '@langchain/core/tools';
import { createFile, createFolder, deleteFile, deleteFolder, getFile, getTree, updateFile } from '../utils/fetchFileApi.js';
import { z } from 'zod';

const compactTree = (items = []) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
        _id: item._id,
        parentId: item.parentId,
        name: item.name,
        type: item.type,
        language: item.language,
        extension: item.extension,
        children: compactTree(item.children || [])
    }));
};

export const fileTools = ({ projectId, userId }) => {
    // Tool 1: Get Project File Tree
    const getTreeTools = tool(
        async () => {
            try {
                if (!projectId) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing projectId.",
                        instruction: "Ensure the workspace has a valid projectId before querying the file tree."
                    });
                }

                console.log(`[Tool] get_tree called for project: ${projectId}`);
                const result = await getTree({ projectId, userId });
                const tree = compactTree(result);

                return JSON.stringify({
                    success: true,
                    operation: "get_tree",
                    tree
                });
            } catch (error) {
                console.error("[Tool Error] get_tree:", error?.response?.data || error.message);
                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: error?.response?.data?.message || error.message || "Failed to fetch project tree",
                    instruction: "Check if the management service is running or if the project has been initialized."
                });
            }
        },
        {
            name: 'get_tree',
            description: `
            Get the complete project file and folder tree hierarchy.

            IMPORTANT RULES:
            1. Use this tool when you need to understand the project structure.
            2. Do not repeatedly call get_tree if you already have the tree.
            3. type="folder" means it is a directory.
            4. type="file" means it is a file with readable content.
            5. Use folder _id as the parentId when creating new files or folders.
            6. NEVER call get_file with a folder ID.
            7. Use the exact _id values returned by this tool.
            `,
            schema: z.object({})
        }
    );

    // Tool 2: Get File Content & Metadata
    const getFileTools = tool(
        async ({ fileId }) => {
            try {
                if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing or invalid fileId parameter.",
                        instruction: "Provide a valid string fileId obtained from get_tree."
                    });
                }

                console.log(`[Tool] get_file called for fileId: ${fileId}`);
                const result = await getFile({ fileId: fileId.trim(), userId });

                if (!result) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `File with id "${fileId}" was not found.`,
                        instruction: "Call get_tree to verify that the file exists and retrieve its current _id."
                    });
                }

                if (result.type !== 'file') {
                    console.warn(`[Tool Warning] get_file blocked: target "${fileId}" is a folder.`);
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `The provided id "${fileId}" belongs to a folder ("${result.name}"), not a file.`,
                        instruction: "Do not call get_file on folders. Folders do not have content. Use folder IDs as parentId when creating files or subfolders."
                    });
                }

                return JSON.stringify({
                    success: true,
                    operation: "get_file",
                    file: {
                        _id: result._id,
                        name: result.name,
                        type: result.type,
                        language: result.language,
                        extension: result.extension,
                        content: result.content ?? '',
                        size: result.size ?? 0,
                        parentId: result.parentId
                    }
                });
            } catch (error) {
                console.error("[Tool Error] get_file:", error?.response?.data || error.message);
                const status = error?.response?.status;
                const errMsg = error?.response?.data?.message || error.message;

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: status === 404
                        ? "File not found. Check get_tree to find existing file IDs."
                        : "An error occurred while reading the file. Verify your fileId."
                });
            }
        },
        {
            name: 'get_file',
            description: `
            Read an EXISTING FILE before modifying it.
            STRICT RULES:

            1. fileId must belong to a file.
            2. NEVER pass a folder ID.
            3. Use exact file ID from get_tree.
            4. Call this before update_file.
            5. Do not call this for newly created files unless necessary.
            6. Do not call this repeatedly for the same file.

            The response contains the complete file content.
            `,
            schema: z.object({
                fileId: z.string().describe("The exact _id of the file to retrieve.")
            })
        }
    );

    // Tool 3: Create folder
    const createFolderTool = tool(
        async ({ name, parentId }) => {
            try {
                if (!name || typeof name !== "string" || !name.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing or invalid folder name.",
                        instruction: "Provide a non-empty name string for the new folder (e.g. 'components', 'utils')."
                    });
                }

                const cleanName = name.trim();

                // Path separator guard
                if (cleanName.includes("/") || cleanName.includes("\\")) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `Folder name "${cleanName}" contains path separators ('/' or '\\').`,
                        instruction: "Do not pass nested paths like 'src/components'. Create each folder one level at a time using the appropriate parentId."
                    });
                }

                if (!parentId || typeof parentId !== "string" || !parentId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing parentId.",
                        instruction: "parentId is required. Call get_tree to find the parent folder _id (or root folder _id where parentId=null)."
                    });
                }

                console.log(`[Tool] create_folder called for: "${cleanName}" under parentId: ${parentId}`);
                const folder = await createFolder({
                    name: cleanName,
                    parentId: parentId.trim(),
                    projectId,
                    userId
                });

                return JSON.stringify({
                    success: true,
                    operation: "create_folder",
                    folder: {
                        _id: folder._id,
                        name: folder.name,
                        type: folder.type,
                        parentId: folder.parentId,
                        projectId: folder.projectId
                    }
                });
            } catch (error) {
                console.error("[Tool Error] create_folder:", error?.response?.data || error.message);
                const errMsg = error?.response?.data?.message || error.message;

                if (errMsg.toLowerCase().includes("already exists")) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `A folder named "${name}" already exists under parentId "${parentId}".`,
                        instruction: "Call get_tree to find the existing folder's _id instead of creating a duplicate."
                    });
                }

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: "Failed to create folder. Verify that parentId is an existing folder _id."
                });
            }
        },
        {
            name: 'create_folder',
            description: `
            Create a new folder.

            RULES:
            1. Create parent folders first.
            2. Use exact parentId from get_tree.
            3. Never create duplicate folders.
            4. A folder directly inside another folder must use that folder's ID as parentId.
            5. Never put slashes in the folder name. Create folders one-by-one.
            6. After creation continue with the remaining files.
            7. Do not call get_tree again just to verify the folder.
            `,
            schema: z.object({
                name: z.string().describe("The name of the new folder to create (e.g. 'controllers', 'components')."),
                parentId: z.string().describe("The _id of the parent folder where this new folder will reside.")
            })
        }
    );

    // Tool 4: Create file 
    const createFileTool = tool(
        async ({ name, parentId, content = '', language }) => {
            try {
                if (!name || typeof name !== "string" || !name.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing or invalid file name.",
                        instruction: "Provide a valid file name including extension (e.g. 'App.jsx', 'index.js')."
                    });
                }

                const cleanName = name.trim();

                // Path separator guard
                if (cleanName.includes("/") || cleanName.includes("\\")) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `Filename "${cleanName}" contains path separators ('/' or '\\').`,
                        instruction: "Do not pass paths like 'src/App.jsx'. First create or locate the 'src' folder, obtain its _id, pass it as parentId, and pass name as 'App.jsx'."
                    });
                }

                // Extension recommendation check
                if (!cleanName.includes(".")) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `Filename "${cleanName}" is missing an extension.`,
                        instruction: "Always provide file extensions (e.g. '.js', '.jsx', '.css', '.html', '.json', '.md')."
                    });
                }

                if (!parentId || typeof parentId !== "string" || !parentId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing parentId.",
                        instruction: "parentId is required to create a file. Call get_tree to find the target folder _id."
                    });
                }

                console.log(`[Tool] create_file called for: "${cleanName}" under parentId: ${parentId}`);
                const file = await createFile({
                    name: cleanName,
                    parentId: parentId.trim(),
                    projectId,
                    content: typeof content === "string" ? content : String(content || ""),
                    language: language || 'plainText',
                    userId
                });

                return JSON.stringify({
                    success: true,
                    operation: "create_file",
                    file: {
                        _id: file._id,
                        name: file.name,
                        type: file.type,
                        language: file.language,
                        extension: file.extension,
                        content: file.content ?? '',
                        size: file.size,
                        parentId: file.parentId,
                        projectId: file.projectId
                    }
                });
            } catch (error) {
                console.error("[Tool Error] create_file:", error?.response?.data || error.message);
                const errMsg = error?.response?.data?.message || error.message;

                if (errMsg.toLowerCase().includes("already exists")) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: `File "${name}" already exists under parentId "${parentId}".`,
                        instruction: "If you want to edit an existing file, use update_file with its _id instead of calling create_file."
                    });
                }

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: "Failed to create file. Ensure parentId belongs to a valid folder."
                });
            }
        },
        {
            name: 'create_file',
            description: `
            Create a NEW FILE.

            RULES:
            1. Use get_tree first when project structure is unknown.
            2. Use exact folder ID as parentId.
            3. Never create duplicate files.
            4. Send complete file content in 'content'.
            5. Create folders before files inside them.
            6. Never use terminal commands to create files.
            7. Do not put slashes in the filename; specify the parent folder via parentId.
            8. Continue creating all required files without stopping after just one.
            `,
            schema: z.object({
                name: z.string().describe("The file name including its extension, e.g. 'index.js', 'App.jsx', 'package.json'."),
                parentId: z.string().describe("The _id of the parent folder where this file will be created."),
                content: z.string().default('').describe("The full initial code or text content for the file."),
                language: z.string().optional().describe("The programming language identifier, e.g. 'javascript', 'typescript', 'css', 'html', 'json', 'python'.")
            })
        }
    );

    // Tool 5: Update file
    const updateFileTool = tool(
        async ({ fileId, content, name, language }) => {
            try {
                if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing fileId parameter.",
                        instruction: "Provide the exact _id of the file to update."
                    });
                }

                if (content === undefined && name === undefined && language === undefined) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "No update parameters provided.",
                        instruction: "Provide at least 'content', 'name', or 'language' to update the file."
                    });
                }

                console.log(`[Tool] update_file called for fileId: ${fileId}`);
                const updatedFile = await updateFile({
                    fileId: fileId.trim(),
                    content,
                    name: name?.trim(),
                    language,
                    userId
                });

                return JSON.stringify({
                    success: true,
                    operation: "update_file",
                    file: {
                        _id: updatedFile._id,
                        name: updatedFile.name,
                        type: updatedFile.type,
                        language: updatedFile.language,
                        extension: updatedFile.extension,
                        content: updatedFile.content ?? '',
                        size: updatedFile.size,
                        parentId: updatedFile.parentId
                    }
                });
            } catch (error) {
                console.error("[Tool Error] update_file:", error?.response?.data || error.message);
                const errMsg = error?.response?.data?.message || error.message;

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: "Failed to update file. Ensure the fileId exists and belongs to a file, and provide the complete file content."
                });
            }
        },
        {
            name: 'update_file',
            description: `
            Update an EXISTING FILE.

            RULES:
            1. Call get_file before updating to read current content.
            2. fileId must be an actual file ID.
            3. NEVER use a folder ID.
            4. Send the COMPLETE updated file content (do not send partial snippets or placeholders).
            5. Do not update files that do not exist.
            `,
            schema: z.object({
                fileId: z.string().describe("The exact _id of the file to update."),
                content: z.string().optional().describe("The complete new code or text content for the file."),
                name: z.string().optional().describe("New file name with extension if renaming the file (e.g. 'App.jsx')."),
                language: z.string().optional().describe("Updated programming language identifier (e.g. 'javascript', 'typescript').")
            })
        }
    );

    // Tool 6: Delete file
    const deleteFileTool = tool(
        async ({ fileId }) => {
            try {
                if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing fileId parameter.",
                        instruction: "Provide the exact _id of the file to delete."
                    });
                }

                console.log(`[Tool] delete_file called for fileId: ${fileId}`);
                await deleteFile({ fileId: fileId.trim(), userId });

                return JSON.stringify({
                    success: true,
                    operation: "delete_file",
                    message: `File with id "${fileId}" deleted successfully`,
                    fileId
                });
            } catch (error) {
                console.error("[Tool Error] delete_file:", error?.response?.data || error.message);
                const errMsg = error?.response?.data?.message || error.message;

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: "Failed to delete file. Verify that fileId belongs to an active file."
                });
            }
        },
        {
            name: 'delete_file',
            description: `
            Delete an EXISTING FILE from the project.

            STRICT RULES:
            1. fileId must belong to an actual file.
            2. NEVER pass a folder ID to delete_file.
            3. Use the exact file ID from get_tree.
            4. Do not delete a file unless the user's request explicitly requires it.
            `,
            schema: z.object({
                fileId: z.string().describe("The exact _id of the file to delete.")
            })
        }
    );

    // Tool 7: Delete folder
    const deleteFolderTool = tool(
        async ({ folderId }) => {
            try {
                if (!folderId || typeof folderId !== "string" || !folderId.trim()) {
                    return JSON.stringify({
                        success: false,
                        operation: "tool_error",
                        error: "Missing folderId parameter.",
                        instruction: "Provide the exact _id of the folder to delete."
                    });
                }

                console.log(`[Tool] delete_folder called for folderId: ${folderId}`);
                const result = await deleteFolder({ folderId: folderId.trim(), userId });

                return JSON.stringify({
                    success: true,
                    operation: "delete_folder",
                    message: `Folder and all recursive contents deleted successfully`,
                    folderId,
                    deletedCount: result?.deletedCount
                });
            } catch (error) {
                console.error("[Tool Error] delete_folder:", error?.response?.data || error.message);
                const errMsg = error?.response?.data?.message || error.message;

                return JSON.stringify({
                    success: false,
                    operation: "tool_error",
                    error: errMsg,
                    instruction: "Cannot delete folder. Root project folder cannot be deleted. Verify the folderId."
                });
            }
        },
        {
            name: 'delete_folder',
            description: `
            Recursively delete a directory/folder and all files inside it.

            STRICT RULES:
            1. folderId must belong to a folder (type="folder").
            2. Never pass the root project workspace folder ID (root folder cannot be deleted).
            3. Deleting a folder recursively deletes all files and nested folders within it.
            `,
            schema: z.object({
                folderId: z.string().describe("The exact _id of the folder to recursively delete.")
            })
        }
    );

    // Return all initialized tools as an array for LangChain / LangGraph
    return [
        getTreeTools,
        getFileTools,
        createFolderTool,
        createFileTool,
        updateFileTool,
        deleteFileTool,
        deleteFolderTool
    ];
};
