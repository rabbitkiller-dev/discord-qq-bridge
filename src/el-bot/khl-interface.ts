export namespace KhlInterface {
  export interface KMarkdown {
    type: 'section';
    text: {
      type: 'kmarkdown',
      content: string,
    };
  }

  export interface ImageGroup {
    type: "image-group";
    elements: Array<{ type: "image", src: string, size?: 'sm' | 'lg' }>;
  }

}
