import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Box, Stack } from "@mui/material";
import { db, auth } from "../firebase/firebase";
import UserList from "../components/userlist";
import ChatPage from "../components/ChatPage";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setCurrentUser } from "../redux/usersSlice";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

const HomePage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((state) => state.user.currentUser);
  // const selectedUserId = useAppSelector((state) => state.chat.selectedUserId);
  // const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  // Listen for auth changes and update Redux
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      dispatch(setCurrentUser(user));
    });
    return () => unsubscribe();
  }, [dispatch]);

  // Fetch users list (excluding current user)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData: UserData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        photoURL: doc.data().photoURL,
      }));

      const filteredUsers = usersData.filter((user) => user.id !== currentUser?.uid);
      setUsers(filteredUsers);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Stack direction="row" height="100vh" bgcolor="#f0f2f5">
      {/* Sidebar - User List */}
      <Box
        sx={{
          width: { xs: "100%", sm: "30%", md: "25%", lg: "20%" },
          minWidth: 250,
          borderRight: "1px solid #e0e0e0",
          overflowY: "auto",
          bgcolor: "background.paper",
        }}
      >
        <UserList users={users} />
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <ChatPage  />
      </Box>
    </Stack>
  );
};

export default HomePage;
