export interface Artifact {
  id: string;
  name: string;
  transform: Transform;
  spaceId: string;
  createDate: Date;
  updateDate: Date;

  // PouchDB fields
  // _id?: string;
  // _rev?: string;
  _attachments?: {
    [index: string]: Attachment;
  };
}

interface Transform {
  order: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

interface Attachment {
  content_type: string;
  data: Blob;
}
