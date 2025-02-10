"use client"

import React, { useContext } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

function Header() {
    // const {userDetail,setUserDetail} = useContext(userDetailContext);
  return (
    <div className="p-5 shadow-sm justify-between items-center flex  ">
      <div className="flex gap-2 items-center ">
        <Image src={"/logo.svg"} width={40} height={40} alt="logo" />
        <h2 className="font-bold text-lg">AI Roomify</h2>
      </div>
      
      <Button  variant= "ghost" className="rounded-full font-bold ">Buy More Credits</Button>
      <div className="flex gap-7 items-center">
        <div className="flex gap-2 p-1 items-center bg-slate-200 px-3 rounded-full">
            <Image src={'/star.png'} width={20} height={20} alt="star" />
            {/* <h2>{userDetails?.credits}</h2> */}
        </div>
        {/* button of auth */}
        <UserButton />
      </div>
    </div>
    
  );
}

export default Header;
