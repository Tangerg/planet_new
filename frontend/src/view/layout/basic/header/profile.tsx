import React from "react";
import { Avatar, AvatarFallback } from "../../../ui/avatar";

const Profile: React.FC = () => (
  <div className="flex items-center gap-3">
    <Avatar className="h-8 w-8 ring-2 ring-black/40">
      <AvatarFallback>唐</AvatarFallback>
    </Avatar>
  </div>
);

export default Profile;
