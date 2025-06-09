import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyCrHTJdgPBf6KgIoDUbqVx3-1qw5WMFbAU",
  authDomain: "auth-23d83.firebaseapp.com",
  projectId: "auth-23d83",
  storageBucket: "auth-23d83.firebasestorage.app",
  messagingSenderId: "829896287020",
  appId: "1:829896287020:web:5b181711cbef0dbad38289",
  measurementId: "G-TYBZGLFH2G"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export const sendMessage = async (
  messageText: string,
  chatId: string,
  user1: string,
  user2: string
): Promise<void> => {
  const chatRef = doc(db, "chats", chatId);
  // const user1Doc = await getDoc(doc(db,"users",user1))
  // const user2Doc = await getDoc(doc(db,"users",user2))

  // console.log(user1)
  // console.log(user2)

  const chatDoc = await getDoc(chatRef);

  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      users: [user1, user2],
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  } else {
    await updateDoc(chatRef, {
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  }

  const messageRef = collection(db, "chats", chatId, "messages");
  await addDoc(messageRef, {
    text: messageText,
    senderId: user1,
    timestamp: serverTimestamp(),
    uid:messageRef.id
    
  });
};

export const listenForMessages = (chatId: string,setMessages: (messages: Message[]) => void): (() => void) => {
  const chatRef = collection(db, "chats", chatId, "messages");

  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    setMessages(messages);
  });

  return unsubscribe;
};


