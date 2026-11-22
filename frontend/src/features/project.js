import api from "../utils/axios";

export const createProject = async (name, description, liked = false) => {
    const payload = typeof name === "object" && name !== null ? name : { name, description, liked };
    const { data } = await api.post("/api/project/createProject", payload);
    return data;
};

export const getAllProject = async () => {
    const { data } = await api.get("/api/project/");
    return data;
};
// export const getAllProjects = getAllProject;

export const getProjectById = async (id) => {
    const { data } = await api.get(`/api/project/project/${id}`);
    return data;
};

export const getLikedProjects = async () => {
    const { data } = await api.get("/api/project/likedProject");
    return data;
};
// export const likedProject = getLikedProjects;
// export const getProjectByLiked = getLikedProjects;

export const toggleLike = async (id) => {
    const { data } = await api.patch(`/api/project/like/${id}`, {});
    return data;
};

export const deleteProject = async (id) => {
    const { data } = await api.delete(`/api/project/deleteProject/${id}`);
    return data;
};
