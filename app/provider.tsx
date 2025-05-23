"use client";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { ReactNode, useEffect, useState, useCallback } from "react";
import { UserDetailsContext, UserDetail } from "./_context/UserDetailContext";

function Provider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | undefined>();

  const verifyUserCallback = useCallback(async () => {
    if (!user) return;
    try {
      const dataResult = await axios.post("/api/verify-user", { user });
      setUserDetail(dataResult.data.result);
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  }, [user]);

  useEffect(() => {
    verifyUserCallback();
  }, [verifyUserCallback]);

  return (
    <UserDetailsContext.Provider value={{ userDetail, setUserDetail }}>
      <div>{children}</div>
    </UserDetailsContext.Provider>
  );
}

export default Provider;
