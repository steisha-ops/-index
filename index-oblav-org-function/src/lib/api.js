
const BASE = "/api";
const req = async (u, m='GET', b) => { 
    try { 
        const res = await fetch(BASE+u, { 
            method: m, 
            headers: {'Content-Type':'application/json'}, 
            body: b ? JSON.stringify(b) : undefined 
        }); 
        return await res.json(); 
    } catch(e) { 
        console.error("API Error:", e); 
        return []; 
    } 
};
export const api = {
    getAuthors: () => req('/authors'),
    createAuthor: (d) => req('/authors', 'POST', d),
    deleteAuthor: (id) => req(`/authors/${id}`, 'DELETE'),
    getNews: () => req('/news'),
    postNews: (d) => req('/news', 'POST', d),
    deleteNews: (id) => req(`/news/${id}`, 'DELETE'),
};
