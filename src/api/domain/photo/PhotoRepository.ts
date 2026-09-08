import type { Photo } from "./Photo";

export interface PhotoRepository {
  findByIds(ids: string[]): Promise<Photo[]>;
}
