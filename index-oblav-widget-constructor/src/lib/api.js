const BASE = "/api";
const req = async (u,m='GET',b) => {
    try {
        const o={method:m,headers:{'Content-Type':'application/json'}};
        if(b)o.body=JSON.stringify(b);
        return await fetch(`${BASE}${u}`,o).then(r=>r.json());
    } catch(e){return [];}
};
export const api = {
    getWidgets: ()=>req('/widgets'),
    addWidget: (d)=>req('/widgets','POST',d),
    delWidget: (id)=>req(`/widgets/${id}`,'DELETE'),
    getPages: ()=>req('/pages'),
    getPopups: ()=>req('/popups')
};
