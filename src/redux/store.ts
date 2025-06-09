import { configureStore } from "@reduxjs/toolkit";
import userReducers from "./usersSlice";
import chatReducers from "./chatSlice";
import authReducer from "./AuthSlice";
export const store = configureStore({
  reducer: {
    user: userReducers,
    chat: chatReducers,
    auth:authReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;