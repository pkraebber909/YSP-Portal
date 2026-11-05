import Image from "next/image";

const smallerLogos = new Set([
  "Alta FC", "Community SC", "Levittown Soccer Club", "Manhattan Kickers FC",
  "Freeport PAL", "Island Trees Soccer Club", "Jericho", "Athletic Soccer Club Saugerties - HV", "Inter Jrs. FC",
]);
const largerLogos = new Set([
  "Brooklyn Hares Football Club", "Baldwin", "Philipstown Soccer Club",
  "Wappinger United Soccer Club", "Town of Wallkill Soccer Club",
  "Oxford Soccer League", "Seymour Soccer Association",
]);
const raisedLogos = new Set(["RCS Soccer Club", "Rotterdam"]);

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
    return <span className={`${className} has-image${path === "/club-logos/ajax--d21933a51277.png" ? " needs-contrast" : ""}${smallerLogos.has(name) ? " logo-smaller" : ""}${largerLogos.has(name) ? " logo-larger" : ""}${raisedLogos.has(name) ? " logo-raised" : ""}`}>
      {roundCrop ? <span className={`crm-round-crop ${roundCrop}`}>{image}</span> : image}
    </span>;
  }
  return <span className={className} aria-label={`${name} logo placeholder`}>{name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
