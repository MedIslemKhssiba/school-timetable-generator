declare module 'jszip' {
  export default class JSZip {
    file(path: string, data: Blob): JSZip;
    generateAsync(options: { type: 'blob' }): Promise<Blob>;
  }
}
