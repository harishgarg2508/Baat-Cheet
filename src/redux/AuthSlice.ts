import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  isAuth: boolean;
 
}

const initialState: AuthState = {
  isAuth: false,
};

const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
 
    setAuth(state, action) {
      state.isAuth = action.payload;
    },
  },
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
