import Image from "next/image";

export function CrmLogo({ name, path, large = false }: { name: string; path: string | null; large?: boolean }) {
  const className = large ? "crm-logo large" : "crm-logo";
  if (path) {
    const roundCrop = {
      "/club-logos/cement-football.jpg": "cement",
      "/club-logos/yorktown--ef18f4f6bdde.jpg": "yorktown",
      "/club-logos/north-shore-elite-fc--39a8cb1f8c0e.jpg": "north-shore",
      "/club-logos/sc-gjoa--a282e8405581.jpg": "sc-gjoa",
    }[path];
    const image = <Image src={path} alt={`${name} logo`} width={large ? 112 : 68} height={large ? 112 : 68} />;
    return <span className={`${className} has-image${path === "/club-logos/ajax--d21933a51277.png" ? " needs-contrast" : ""}`}>
      {roundCrop ? <span className={`crm-round-crop ${roundCrop}`}>{image}</span> : image}
    </span>;
  }
  return <span className={className} aria-label={`${name} logo placeholder`}>{name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
