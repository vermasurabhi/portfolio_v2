import wildcardMotionImage from "../assets/wildcardmotion.png";
import gadda from "../assets/gadda.png";
import sellco from "../assets/sellco.png";
import vidyashram from "../assets/vidyashram.png";

export type ShowcaseMedia =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; posterSrc: string };

export type ShowcaseSlide = {
  id: string;
  /** Huge overlay word(s) on the image */
  overlayText: string;
  label: string;
  /** One line like "NKORA COFFEE ‣ BRAND IDENTITY" */
  titleLine: string;
  /** Bullet lines under the title (monopo-style) */
  categories: string[];
  /** External project link used by bottom Visit button */
  visitUrl: string;
  media: ShowcaseMedia;
};

export const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "wildcard",
    overlayText: "WILDCARD MOTION",
    label: "RECENT WORK",
    titleLine: "WILDCARD MOTION ‣ PORTFOLIO WEBSITE",
    categories: ["Web design"],
    visitUrl: "https://www.wildcardmotions.com/",
    media: {
      kind: "image",
      src: wildcardMotionImage,
      alt: "WILDCARD MOTION project",
    },
  },
  {
    id: "sellco",
    overlayText: "SELLCO",
    label: "RECENT WORK",
    titleLine: "SELLCO AI ‣ ANALYTICS DASHBOARD",
    categories: ["Web Design", "Web Development", "Analytics"],
    visitUrl: "https://sellco.ai",
    media: {
      kind: "image",
      src: sellco,
      alt: "Atlas project",
    },
  },
  {
    id: "gadda",
    overlayText: "GADDA CO",
    label: "RECENT WORK",
    titleLine: "GADDA CO ‣ SHOPIFY STORE",
    categories: ["ecommerce website"],
    visitUrl: "https://gadda.co",
    media: {
      kind: "image",
      src: gadda,
      alt: "Gadda project",
    },
  },
  {
    id: "vidyashram",
    overlayText: "VIDYASHRAM",
    label: "RECENT WORK",
    titleLine: "VIDYASHRAM ‣ SCHOOL WEBSITE",
    categories: ["web site"],
    visitUrl: "https://vidyashram.org/",
    media: {
      kind: "image",
      src: vidyashram,
      alt: "VIDYASHRAM project",
    },
  },
];
