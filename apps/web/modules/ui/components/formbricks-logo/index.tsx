"use client";

import Image from "next/image";

interface FormbricksLogoProps {
  className?: string;
}

export const FormbricksLogo = ({ className }: FormbricksLogoProps) => {
  return (
    <Image
      src="/images/logo.png" // 👈 replace this with your file name if different
      alt="Formbricks Logo"
      width={180}
      height={180}
      className={className}
      priority
    />
  );
};
