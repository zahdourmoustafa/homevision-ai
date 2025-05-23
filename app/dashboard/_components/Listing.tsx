"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";
import Link from "next/link";

function Listing() {
  const userRoomList: never[] = [];
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl text-gray-900">Hello,</h2>
        <Link href="/dashboard/create-new">
          <Button className="bg-primary hover:bg-primary/90">
            Redesign Room
          </Button>
        </Link>
      </div>

      {userRoomList?.length === 0 ? <EmptyState /> : <div>{/* listing */}</div>}
    </div>
  );
}

export default Listing;
