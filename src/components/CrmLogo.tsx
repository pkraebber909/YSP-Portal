import Image from "next/image";

export function CrmLogo({ name, path, large = false }: { name: string; path: string | null; large?: boolean }) {
  const className = large ? "crm-logo large" : "crm-logo";
  if (path) return <span className={className}><Image src={path} alt={`${name} logo`} width={large ? 112 : 68} height={large ? 80 : 54} /></span>;
  return <span className={className} aria-label={`${name} logo placeholder`}>{name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
