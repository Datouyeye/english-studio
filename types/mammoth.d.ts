declare module "mammoth" {
  export interface ExtractResult {
    value: string;
    messages: unknown[];
  }
  export function extractRawText(
    input: { buffer: Buffer } | { arrayBuffer: ArrayBuffer } | { path: string },
  ): Promise<ExtractResult>;
}