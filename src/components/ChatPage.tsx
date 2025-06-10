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
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  type DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, sendMessage, listenForMessages } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";
import EmojiPicker from "emoji-picker-react";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { getTimeCategory } from "../utils/getTimeCategory";

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
  receiverId?: string;
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
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const selectedUserId = useAppSelector((state) => state.chat.selectedUserId);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const currentUserId = currentUser?.uid ?? null;

  const PAGE_SIZE = 7;
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    const messageRef = collection(db, "chats", chatId, "messages");
    const q = query(messageRef, orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        messages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp:
            data.timestamp &&
            typeof (data.timestamp as any).toDate === "function"
              ? (data.timestamp as any).toDate()
              : data.timestamp,
        });
      });
      setMessages(messages.reverse());
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.size === PAGE_SIZE);
    });
    return () => unsub();
  }, [chatId]);

  const loadMore = async () => {
    if (!chatId || !lastDoc || !hasMore) return;
    const messageRef = collection(db, "chats", chatId, "messages");
    const q = query(
      messageRef,
      orderBy("timestamp", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snapshot = await getDocs(q);
    const newMessages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Message;
      newMessages.push({
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        timestamp:
          data.timestamp &&
          typeof (data.timestamp as any).toDate === "function"
            ? (data.timestamp as any).toDate()
            : data.timestamp,
      });
    });
    setMessages((prev) => [...newMessages.reverse(), ...prev]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || lastDoc);
    setHasMore(snapshot.size === PAGE_SIZE);
  };

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;
    const handleScroll = () => {
      if (chatBox.scrollTop === 0 && hasMore) {
        loadMore();
      }
    };
    chatBox.addEventListener("scroll", handleScroll);
    return () => chatBox.removeEventListener("scroll", handleScroll);
  }, [hasMore, lastDoc]);

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setMessageText((prev) => prev + emojiObject.emoji);
  };

  const handleEmojiPickerOpen = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setEmojiPickerAnchorEl(event.currentTarget);
  };
  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
  };

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

  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;
    const id =
      currentUserId < selectedUserId
        ? `${currentUserId}-${selectedUserId}`
        : `${selectedUserId}-${currentUserId}`;
    setChatId(id);
  }, [currentUserId, selectedUserId]);

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

  const groupedMessages = messages.reduce(
    (acc: { [category: string]: Message[] }, msg) => {
      const date = msg.timestamp ? new Date(msg.timestamp) : null;
      const category = date ? getTimeCategory(date) : "Unknown";
      if (!acc[category]) acc[category] = [];
      acc[category].push(msg);
      return acc;
    },
    {}
  );

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !currentUserId || !selectedUser)
      return;
    try {
      await sendMessage(messageText, chatId, currentUserId, selectedUser.id);
      setMessageText("");
      const onlineRef = doc(db, "isOnline", selectedUser.id);
      await setDoc(
        onlineRef,
        { isOnline: true, isTyping: false },
        { merge: true }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

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
      <Stack direction={"row"} gap={1} sx={{ borderBottom: 1, borderColor: "divider", p: 1 }}>
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

      <Stack ref={chatBoxRef} spacing={1.5} sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1 }}>
        {Object.entries(groupedMessages).map(([category, msg]) => (
          <Box key={category}>
            <Typography variant="caption" color="primary" sx={{ textAlign: "center", display: "block", mb: 1, mt: 2 }}>
              {category}
            </Typography>
            {msg.map((individualMessage) => {
              const isSender = individualMessage.senderId === currentUserId;
              return (
                <Box key={individualMessage.id} display="flex" justifyContent={isSender ? "flex-end" : "flex-start"}>
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
                    <Typography variant="body1">{individualMessage.text}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textAlign="right"
                      display="block"
                      mt={0.5}
                    >
                      {individualMessage.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        ))}
        <Box ref={chatEndRef} />
      </Stack>

      <Stack direction="row" gap={1} p={2} borderTop={1} borderColor="divider">
        <IconButton onClick={handleEmojiPickerOpen} sx={{ p: "10px" }} aria-label="emoji">
          <EmojiEmotionsIcon />
        </IconButton>
        <Popover
          open={Boolean(emojiPickerAnchorEl)}
          anchorEl={emojiPickerAnchorEl}
          onClose={handleEmojiPickerClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              handleEmojiClick(emojiObject);
              handleEmojiPickerClose();
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
        <Button variant="contained" onClick={handleSendMessage} disabled={!messageText.trim()}>
          Send
        </Button>
      </Stack>
    </Stack>
  );
};

export default ChatPage;
