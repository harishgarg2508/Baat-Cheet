import React, { useEffect, useState } from "react";
import {
  Avatar,
  InputBase,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setSelectedUserId } from "../redux/chatSlice";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface UserListProps {
  users: UserData[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [lastMessages, setLastMessages] = useState<Record<string, string | null>>({});
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!currentUserId || users.length === 0) {
      setLastMessages({});
      return;
    }

    const unsubscribes: (() => void)[] = [];

    users.forEach((user) => {
      if (user.id === currentUserId) return;

      const otherUserId = user.id;
      const chatId =
        currentUserId < otherUserId
          ? `${currentUserId}-${otherUserId}`
          : `${otherUserId}-${currentUserId}`;

      try {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const lastMsgDoc = querySnapshot.docs[0];
            setLastMessages((prevMessages) => ({
              ...prevMessages,
              [user.id]: lastMsgDoc.data().text as string,
            }));
          } else {
            setLastMessages((prevMessages) => ({
              ...prevMessages,
              [user.id]: null,
            }));
          }
        }, (error) => {
          console.error(`Error listening to last message for user ${user.id} in chat ${chatId}:`, error);
          setLastMessages((prevMessages) => ({
            ...prevMessages,
            [user.id]: null,
          }));
        });
        unsubscribes.push(unsubscribe);
      } catch (error) {
        console.error(`Error setting up listener for user ${user.id} in chat ${chatId}:`, error);
        setLastMessages((prevMessages) => ({
          ...prevMessages,
          [user.id]: null,
        }));
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [users, currentUserId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); 

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const filteredUsers = users.filter((user) => {
    if (user.id === currentUserId) return false;
    const term = debouncedSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  return (
    <Stack direction="column" gap={2}>
      <InputBase
        fullWidth
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          position: "sticky",
          top: "5px",
          zIndex: 1,
          bgcolor: "background.paper",
          borderRadius: "8px",
          padding: "8px 12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          margin: 1,
        }}
      />

      <List
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          paddingTop: 0,
        }}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <ListItemButton
              key={user.id}
              onClick={() => dispatch(setSelectedUserId(user.id))}
            >
              <ListItemAvatar>
                <Avatar
                  alt={user.name || user.email}
                  src={user.photoURL || undefined}
                />
              </ListItemAvatar>
              <ListItemText
                primary={user.name || user.email?.split("@")[0]}
                secondary={
                  lastMessages[user.id]
                    ? `${(lastMessages[user.id] ?? '').substring(0, 30)}${(lastMessages[user.id] ?? '').length > 30 ? '...' : ''}`
                    : "No recent messages"
                }
                
                
              />
            </ListItemButton>
          ))
        ) : (
          <Typography
            sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}
          >
            No users found.
          </Typography>
        )}
      </List>
    </Stack>
  );
};

export default UserList;
