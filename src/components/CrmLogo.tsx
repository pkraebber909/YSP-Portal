import Image from "next/image";

export function CrmLogo({ name, path, large = false }: { name: string; path: string | null; large?: boolean }) {
  const className = large ? "crm-logo large" : "crm-logo";
  if (path) {
    const image = <Image src={path} alt={`${name} logo`} width={large ? 112 : 68} height={large ? 80 : 54} />;
    return <span className={`${className} has-image${path === "/club-logos/ajax--d21933a51277.png" ? " needs-contrast" : ""}`}>{path === "/club-logos/cement-football.jpg" ? <span className="crm-round-crop">{image}</span> : image}</span>;
  }
  return <span className={className} aria-label={`${name} logo placeholder`}>{name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
