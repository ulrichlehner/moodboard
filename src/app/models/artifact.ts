export interface Artifact {
  id: string;
  name: string;
  transform: Transform;
  attachment?: Attachment;
  createDate: Date;
  updateDate: Date;

  // PouchDB fields
  _id?: string;
  _rev?: string;
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
