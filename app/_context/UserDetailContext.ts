import { createContext, Dispatch, SetStateAction } from "react";

export interface UserDetail {
  id?: string;
  name?: string;
  email?: string;
  imageurl?: string;
}

export interface UserDetailContextType {
  userDetail: UserDetail | undefined;
  setUserDetail: Dispatch<SetStateAction<UserDetail | undefined>>;
}

export const UserDetailsContext = createContext<UserDetailContextType>({
  userDetail: undefined,
  setUserDetail: () => {},
});