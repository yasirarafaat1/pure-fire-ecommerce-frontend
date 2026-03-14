export type CategoryNode = { _id: string; name: string; children?: CategoryNode[] };
export type FieldRenderer = (key: any, label: string, placeholder: string, asTextArea?: boolean) => JSX.Element;
export type Highlight = { key: string; value: string };
