"use client";

import { BeanHead } from "beanheads";

export default function Avatar({ userAvatar, name, size = "w-10 h-10" }) {
  if (!userAvatar) {
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
      >
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  }

  try {
    const parsedAvatar =
      typeof userAvatar === "string" ? JSON.parse(userAvatar) : userAvatar;

    if (parsedAvatar && parsedAvatar.beanConfig) {
      return (
        <div
          className={`${size} rounded-full overflow-hidden bg-[#e8f0fe] flex items-center justify-center`}
        >
          <BeanHead {...parsedAvatar.beanConfig} />
        </div>
      );
    }
  } catch (e) {
    console.error("Failed to parse avatar:", e);
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
    >
      {name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}