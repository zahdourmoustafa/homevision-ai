"use client";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { ReactNode, useEffect, useState } from "react";
import { UserDetailsContext, UserDetail } from "./_context/UserDetailContext";
function Provider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail>();

  useEffect(() => {
    if (user) {
      VerifyUser();
    }
  }, [user, VerifyUser]);

  const VerifyUser = async () => {
    const dataResult = await axios.post("/api/verify-user", { user: user });
    setUserDetail(dataResult.data.result);
  };
  return (
    <UserDetailsContext.Provider value={{ userDetail, setUserDetail }}>
      <div>{children}</div>
    </UserDetailsContext.Provider>
  );
}

export default Provider;
