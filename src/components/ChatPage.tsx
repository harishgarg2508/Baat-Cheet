import {
  Avatar,
  Box,
  Button,
  IconButton,
  InputBase,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { db, sendMessage, listenForMessages } from "../firebase/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../redux/hooks"; // Ensure this is your custom hook
import EmojiPicker from 'emoji-picker-react';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface IsOnline {
  isOnline: boolean;
  isTyping: boolean;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [isUserOnline, setIsUserOnline] = useState<IsOnline>();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState<HTMLButtonElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const selectedUserId = useAppSelector((state) => state.chat.selectedUserId);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const currentUserId = currentUser?.uid ?? null;




const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setMessageText(prev => prev + emojiObject.emoji);
  };

  const handleEmojiPickerOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiPickerAnchorEl(event.currentTarget);
  };
  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
}

  // Fetch selected user's info from Firestore
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", selectedUserId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSelectedUser({ id: snap.id, ...data } as UserData);
      } else {
        setSelectedUser(null);
      }
    });

    return () => unsub();
  }, [selectedUserId]);

  // Set chat ID
  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;

    const id =
      currentUserId < selectedUserId
        ? `${currentUserId}-${selectedUserId}`
        : `${selectedUserId}-${currentUserId}`;
    setChatId(id);
  }, [currentUserId, selectedUserId]);

  // Fetch online status of selected user
  useEffect(() => {
    if (!selectedUser?.id) return;

    const onlineRef = doc(db, "isOnline", selectedUser.id);
    const unsub = onSnapshot(onlineRef, (doc) => {
      const data = doc.data() as IsOnline;
      if (data) {
        setIsUserOnline(data);
      } else {
        setIsUserOnline(undefined);
      }
    });

    return () => unsub();
  }, [selectedUser?.id]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = listenForMessages(chatId, (fetchedMessages: any[]) => {
      const processed = fetchedMessages
        .map((msg) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          timestamp: msg.timestamp?.toDate
            ? msg.timestamp.toDate()
            : new Date(),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setMessages(processed);
    });

    return unsubscribe;
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle logout
  const handleLogout = async () => {
    try {
      if (currentUserId) {
        const onlineStatusRef = doc(db, "isOnline", currentUserId);
        await setDoc(
          onlineStatusRef,
          { isOnline: false, isTyping: false },
          { merge: true }
        );
      }
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/login");
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !currentUserId || !selectedUser)
      return;

    try {
      await sendMessage(messageText, chatId, currentUserId, selectedUser.id);
      setMessageText("");

      const onlineRef = doc(db, "isOnline", selectedUser.id);
      await setDoc(onlineRef, {
        isOnline: true,
        isTyping: false,
      }, { merge: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Typing status update
  const handleTyping = (value: string) => {
    setMessageText(value);

    if (!currentUserId) return;
    const onlineRef = doc(db, "isOnline", currentUserId);

    setDoc(onlineRef, { isOnline: true, isTyping: true }, { merge: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      setDoc(onlineRef, { isOnline: true, isTyping: false }, { merge: true });
    }, 1500);
  };

  // Check if no user selected
  if (!selectedUser) {
    return (
      <Stack
        sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}
      >
        <Typography variant="h6">Select a user to start chatting</Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="column" height="100%">
      {/* Header */}
      <Stack
        direction={"row"}
        gap={1}
        sx={{ borderBottom: 1, borderColor: "divider", p: 1 }}
      >
        <ListItem disableGutters>
          <ListItemAvatar>
            <Avatar src={selectedUser.photoURL || undefined}>
              {selectedUser.name?.charAt(0)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={selectedUser.name || selectedUser.email}
            secondary={
              isUserOnline?.isOnline ? (
                <Typography variant="caption" color="green">
                  {isUserOnline?.isTyping ? "Typing..." : "Online"}
                </Typography>
              ) : (
                <Typography variant="caption" color="gray">
                  Offline
                </Typography>
              )
            }
          />
          <Button variant="contained" color="warning" onClick={handleLogout}>
            Logout
          </Button>
        </ListItem>
      </Stack>

      {/* Messages */}
      <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1 }}>
        {messages.map((msg) => {
          const isSender = msg.senderId === currentUserId;
          return (
            <Box
              key={msg.id}
              display="flex"
              justifyContent={isSender ? "flex-end" : "flex-start"}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: isSender ? "#e0f7fa" : "#f1f1f1",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="right"
                  display="block"
                  mt={0.5}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <Box ref={chatEndRef} />
      </Stack>

      {/* Input */}
      <Stack direction="row" gap={1} p={2} borderTop={1} borderColor="divider">
        <IconButton onClick={handleEmojiPickerOpen} sx={{ p: '10px' }} aria-label="emoji">
          <EmojiEmotionsIcon />
        </IconButton>
        <Popover
          open={Boolean(emojiPickerAnchorEl)}
          anchorEl={emojiPickerAnchorEl}
          onClose={handleEmojiPickerClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              handleEmojiClick(emojiObject);
              handleEmojiPickerClose(); // Optionally close picker after selection
            }}
          />
        </Popover>
        <InputBase
          fullWidth
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => handleTyping(e.target.value)}
          sx={{ bgcolor: "#f5f5f5", borderRadius: 2, px: 2, py: 1, flexGrow: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
        >
          Send
        </Button>
      </Stack>
    </Stack>
  );
};

export default ChatPage;
