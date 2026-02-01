"use client";

import BoringAvatars from "boring-avatars";
import { useEffect, useState } from "react";

const colors = ["#0a0310", "#49007e", "#ff005b", "#ff7d10", "#ffb238"];

export const ProfileAvatar: React.FC<{ userId: string }> = ({ userId }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="rounded-full bg-slate-200" style={{ width: 40, height: 40 }} />;
  }

  return <BoringAvatars size={40} name={userId} variant="bauhaus" colors={colors} />;
};

export const PersonAvatar: React.FC<{ personId: string }> = ({ personId }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="rounded-full bg-slate-200" style={{ width: 32, height: 32 }} />;
  }

  return <BoringAvatars size={32} name={personId} variant="marble" colors={colors} />;
};
