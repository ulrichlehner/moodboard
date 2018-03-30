export interface Artifact {
  id: string;
  name: string;
  transform: Transform;
  attachment: Attachment;
  createDate: Date;
  updateDate: Date;
}

interface Transform {
  order: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

interface Attachment {
  contentType: string;
  data: Blob;
}