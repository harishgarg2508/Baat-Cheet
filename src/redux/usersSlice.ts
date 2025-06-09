import { createSlice,type PayloadAction } from "@reduxjs/toolkit";
import type { User as FirebaseUser } from "firebase/auth";

interface UserState {
  currentUser: FirebaseUser | null;
}

const initialState: UserState = {
  currentUser: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<FirebaseUser | null>) {
      state.currentUser = action.payload;
    },
  },
});

export const { setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
