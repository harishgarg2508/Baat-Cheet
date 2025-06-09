import { useAppSelector } from "../redux/hooks";


import { Navigate, Outlet } from "react-router-dom";


const ProtectedRoute = () => {
    const isAuth = useAppSelector((state) => state.auth?.isAuth);

    return (isAuth ? <Outlet/> : <Navigate to="/login" replace />)
}

export default ProtectedRoute;
