import Image from "next/image";

export function ClubLogo({ variant = "profile" }: { variant?: "tile" | "profile" }) {
  return <Image
    src="/cyclones-logo.png"
    alt="Coney Island Cyclones Soccer Club logo"
    width={564}
    height={369}
    className={variant === "tile" ? "club-tile-image" : "club-profile-image"}
  />;
}
