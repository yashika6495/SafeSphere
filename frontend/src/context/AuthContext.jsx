import { createContext,useContext,useEffect,useState } from "react";
import { getProfile } from "../api/authApi";

const AuthContext = createContext()

export const AuthProvider = ({children}) => {

    const [user,setUser] = useState(null)
    const [loading,setLoading] = useState(true)

    const loadUser = async () => {

        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await getProfile();
            setUser(data);
        } catch (error) {
            console.log(error);
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        loadUser()
    },[])


    const login = async (token) => {
        localStorage.setItem("token", token);
        await loadUser();
    };
    
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user,loading,login,logout}}>
            {children}
        </AuthContext.Provider>
    )
}


export const useAuth = () => useContext(AuthContext);