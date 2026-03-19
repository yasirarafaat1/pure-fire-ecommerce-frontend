declare module "color-namer" {
  type NameEntry = { name: string; hex: string; distance: number };
  type Palette = Record<string, NameEntry[]>;
  function colorNamer(color: string, options?: { pick?: string[] }): Palette;
  export default colorNamer;
}
