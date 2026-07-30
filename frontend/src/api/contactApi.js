import api from "./axiosInstance";

export const getContacts = async () => {
    const res = await api.get("/contacts");
    return res.data;
};

export const addContact = async (contact) => {
    const res = await api.post("/contacts", contact);
    return res.data;
};

export const deleteContact = async (id) => {
    const res = await api.delete(`/contacts/${id}`);
    return res.data;
};
