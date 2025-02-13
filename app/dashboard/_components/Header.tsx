"use client"

import React, { useContext } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

function Header() {
    // const {userDetail,setUserDetail} = useContext(userDetailContext);
  return (
    <div className="py-3 px-5 bg-white shadow-sm justify-between items-center flex w-full fixed top-0 z-[60]">
      <div className="flex gap-2 items-center">
        <Image src={"/logo.svg"} width={40} height={40} alt="logo" />
        <h2 className="font-bold text-lg text-gray-900">AI Roomify</h2>
      </div>
      
      <Button variant="ghost" className="rounded-full font-bold">Buy More Credits</Button>
      <div className="flex gap-7 items-center">
        <div className="flex gap-2 p-1 items-center bg-gray-100 px-3 rounded-full">
            <Image src={'/star.png'} width={20} height={20} alt="star" />
        </div>
        <UserButton />
      </div>
    </div>
    
  );
}

export default Header;
