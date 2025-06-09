import React, { useEffect, useState } from "react";
import {   Avatar,   InputBase,   List,   ListItemAvatar,   ListItemButton,   ListItemText,   Stack,   Typography, } from "@mui/material";
// import InfiniteScroll from "react-infinite-scroll-component";
import { useAppDispatch } from "../redux/hooks";
import { setSelectedUserId } from "../redux/chatSlice";



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
  const dispatch = useAppDispatch();




  useEffect(()=>{
    
  },[])


  
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  



  return (
    <Stack direction="column" gap={2}>
      {/* Search Input */}
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

      {/* Infinite Scroll List */}
     
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
                  secondary={user.email}
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