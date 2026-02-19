// app/friends/layout.js

'use client';

import { FriendsLockProvider } from "@/context/FriendsLockContext";

export default function FriendsLayout({ children }) {
  return (
    <FriendsLockProvider>
      {children}
    </FriendsLockProvider>
  );
}