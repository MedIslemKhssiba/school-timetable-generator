declare module 'html-to-image' {
  export interface ToPngOptions {
    cacheBust?: boolean;
    pixelRatio?: number;
    backgroundColor?: string;
  }

  export function toPng(node: HTMLElement, options?: ToPngOptions): Promise<string>;
}
