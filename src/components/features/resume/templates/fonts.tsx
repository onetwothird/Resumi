/**
 * Shared font helpers for the resume renderer.
 * Extracted so the editable canvas, the static preview and template previews
 * all load and resolve fonts the same way.
 */

export const EXTENDED_FONTS = [
  { value: "inter", label: "Inter", stack: "'Inter', sans-serif" },
  { value: "roboto", label: "Roboto", stack: "'Roboto', sans-serif" },
  { value: "opensans", label: "Open Sans", stack: "'Open Sans', sans-serif" },
  { value: "lato", label: "Lato", stack: "'Lato', sans-serif" },
  { value: "montserrat", label: "Montserrat", stack: "'Montserrat', sans-serif" },
  { value: "poppins", label: "Poppins", stack: "'Poppins', sans-serif" },
  { value: "sourcesanspro", label: "Source Sans Pro", stack: "'Source Sans Pro', sans-serif" },
  { value: "raleway", label: "Raleway", stack: "'Raleway', sans-serif" },
  { value: "ubuntu", label: "Ubuntu", stack: "'Ubuntu', sans-serif" },
  { value: "merriweather", label: "Merriweather", stack: "'Merriweather', serif" },
  { value: "playfair", label: "Playfair Display", stack: "'Playfair Display', serif" },
  { value: "lora", label: "Lora", stack: "'Lora', serif" },
  { value: "ptserif", label: "PT Serif", stack: "'PT Serif', serif" },
  { value: "notosans", label: "Noto Sans", stack: "'Noto Sans', sans-serif" },
  { value: "nunito", label: "Nunito", stack: "'Nunito', sans-serif" },
  { value: "mukta", label: "Mukta", stack: "'Mukta', sans-serif" },
  { value: "firasans", label: "Fira Sans", stack: "'Fira Sans', sans-serif" },
  { value: "droidsans", label: "Droid Sans", stack: "'Droid Sans', sans-serif" },
  { value: "arial", label: "Arial", stack: "Arial, sans-serif" },
  { value: "helvetica", label: "Helvetica", stack: "Helvetica, sans-serif" },
  { value: "timesnewroman", label: "Times New Roman", stack: "'Times New Roman', serif" },
  { value: "couriernew", label: "Courier New", stack: "'Courier New', monospace" },
  { value: "georgia", label: "Georgia", stack: "Georgia, serif" },
  { value: "garamond", label: "Garamond", stack: "Garamond, serif" },
  { value: "trebuchetms", label: "Trebuchet MS", stack: "'Trebuchet MS', sans-serif" },
  { value: "verdana", label: "Verdana", stack: "Verdana, sans-serif" },
  { value: "tahoma", label: "Tahoma", stack: "Tahoma, sans-serif" },
  { value: "palatino", label: "Palatino", stack: "Palatino, serif" },
  { value: "lucidasans", label: "Lucida Sans", stack: "'Lucida Sans', sans-serif" },
  { value: "josefinsans", label: "Josefin Sans", stack: "'Josefin Sans', sans-serif" },
  { value: "worksans", label: "Work Sans", stack: "'Work Sans', sans-serif" },
  { value: "quicksand", label: "Quicksand", stack: "'Quicksand', sans-serif" },
  { value: "rubik", label: "Rubik", stack: "'Rubik', sans-serif" },
  { value: "inconsolata", label: "Inconsolata", stack: "'Inconsolata', monospace" },
  { value: "oswald", label: "Oswald", stack: "'Oswald', sans-serif" },
  { value: "bebasneue", label: "Bebas Neue", stack: "'Bebas Neue', sans-serif" },
  { value: "anton", label: "Anton", stack: "'Anton', sans-serif" },
  { value: "dancingscript", label: "Dancing Script", stack: "'Dancing Script', cursive" },
  { value: "pacifico", label: "Pacifico", stack: "'Pacifico', cursive" },
  { value: "caveat", label: "Caveat", stack: "'Caveat', cursive" },
  { value: "satisfy", label: "Satisfy", stack: "'Satisfy', cursive" },
  { value: "amaticsc", label: "Amatic SC", stack: "'Amatic SC', cursive" },
  { value: "righteous", label: "Righteous", stack: "'Righteous', cursive" },
  { value: "cinzel", label: "Cinzel", stack: "'Cinzel', serif" },
  { value: "exo2", label: "Exo 2", stack: "'Exo 2', sans-serif" },
  { value: "orbitron", label: "Orbitron", stack: "'Orbitron', sans-serif" },
  { value: "titilliumweb", label: "Titillium Web", stack: "'Titillium Web', sans-serif" },
  { value: "varelaround", label: "Varela Round", stack: "'Varela Round', sans-serif" },
  { value: "zillaslab", label: "Zilla Slab", stack: "'Zilla Slab', serif" },
  { value: "bitter", label: "Bitter", stack: "'Bitter', serif" },
  { value: "crimsontext", label: "Crimson Text", stack: "'Crimson Text', serif" }
];

export const getExtendedFontStack = (fontFamily: string): string => {
  const font = EXTENDED_FONTS.find((f) => f.value === fontFamily);
  return font ? font.stack : "'Inter', sans-serif";
};

/** Inject @import for the fonts actually used on the page. */
export function GoogleFontLoader({ fonts }: { fonts: string[] }) {
  const urls = fonts
    .map((f) => EXTENDED_FONTS.find((ext) => ext.value === f)?.label?.replace(/ /g, "+"))
    .filter(Boolean);

  const unique = Array.from(new Set(urls));
  if (unique.length === 0) return null;

  const urlString = unique.map((u) => `family=${u}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700`).join("&");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `@import url('https://fonts.googleapis.com/css2?${urlString}&display=swap');`,
      }}
    />
  );
}