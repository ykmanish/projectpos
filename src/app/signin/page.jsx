"use client";

import { Suspense } from "react";
import LoginContent from "./LoginContent";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}