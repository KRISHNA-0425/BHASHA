import express from 'express';
import {
    createRootFolder,
    createFolder,
    createFile,
    updateFile,
    deleteFile,
    deleteFolder,
    getFile,
    getTree,
    getAllProjectFiles
} from '../controllers/managment.controller.js';

const managmentRouter = express.Router();

// Root folder route
managmentRouter.post('/createRootFolder', createRootFolder);

// Folder routes
managmentRouter.post('/createFolder', createFolder);
managmentRouter.delete('/deleteFolder/:id', deleteFolder);

// File routes
managmentRouter.post('/createFile', createFile);
managmentRouter.put('/updateFile/:id', updateFile);
managmentRouter.patch('/updateFile/:id', updateFile);
managmentRouter.delete('/deleteFile/:id', deleteFile);
managmentRouter.get('/file/:id', getFile);

// Tree & Files routes
managmentRouter.get('/tree/:projectId', getTree);
managmentRouter.get('/all-files/:projectId', getAllProjectFiles);

export default managmentRouter;

