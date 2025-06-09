import { Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
        <Route element={<ProtectedRoute/>}>
          <Route path="/home" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
