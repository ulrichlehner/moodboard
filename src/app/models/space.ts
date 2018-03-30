import { Artifact } from "./artifact"

export interface Space {
  id: string;
  name: string;
  // artifacts: Array<Artifact>;
  createDate: Date;
  updateDate: Date;
}