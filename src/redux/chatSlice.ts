import { createSlice,type PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  selectedUserId: string | null;
  chatId: string | null;
}

const initialState: ChatState = {
  selectedUserId: null,
  chatId: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedUserId(state, action: PayloadAction<string>) {
      state.selectedUserId = action.payload;
    },
    setChatId(state, action: PayloadAction<string>) {
      state.chatId = action.payload;
    },
  },
});

export const { setSelectedUserId, setChatId } = chatSlice.actions;
export default chatSlice.reducer;
