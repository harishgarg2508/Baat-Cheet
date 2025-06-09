import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { toast, Toaster } from "sonner";
import GoogleIcon from "@mui/icons-material/Google";
import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAppDispatch } from "../redux/hooks";
import { setAuth } from "../redux/AuthSlice";


const googleProvider = new GoogleAuthProvider();

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useAppDispatch();

  const signupWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const onlineRef = doc(db, "isOnline", result.user.uid);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
      });

      await setDoc(onlineRef, {
        isOnline: true,
        isTyping: false,
      });

      toast.success(
        `Welcome, ${user.displayName || "User"}! Signed in with Google.`
      );
      console.log("User signed in: ", user);
      dispatch(setAuth({ isAuth: true }))

      setTimeout(() => {
         navigate("/home");

      }, 2000);


    } catch (error: any) {
      console.error("Error during sign-in: ", error);
      toast.error(error.message || "Error during Google sign-in");
    }
  };

  const signUpUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
      });

      toast.success(`User ${user.email} created successfully!`);
      console.log("Email sign-up:", user);
    } catch (error: any) {
      toast.error(error.message || "Error during sign-up");
      console.error("Sign-up error:", error);
    }
  };

  const signInUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        toast.success(`Welcome back, ${user.email}!`);
        navigate("/home");
      } else {
        toast.error("User data not found!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error during sign-in");
      console.error("Sign-in error:", error);
    }
  };

  return (
    <>
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 4,
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Sign Up
          </Typography>

          <Box
            component="form"
            onSubmit={signUpUser}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              value={email}
              autoFocus
            />
            <TextField
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={password}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1 }}
              onClick={signupWithGoogle}
              startIcon={<GoogleIcon />}
            >
              Sign In with Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={signInUser}
            >
              Sign In with Email & Password
            </Button>
          </Box>
        </Paper>
      </Container>

      <Toaster
        position="top-right"
        richColors
        closeButton
        visibleToasts={3}
        theme="dark"
      />
    </>
  );
};

export default SignIn;
