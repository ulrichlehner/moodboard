import { Artifact } from './artifact';

export interface Space {
  id: string;
  name: string;
  viewportTransform: Array<number>;
  createDate?: Date;
  updateDate?: Date;
}
