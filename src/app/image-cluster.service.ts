import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import * as mobilenet from '@tensorflow-models/mobilenet';
import kmeans from 'ml-kmeans';
import { Artifact } from './models/artifact';

/**
 * This service can be used to build an image cluster based on machine learning
 *
 * @remarks
 *
 * Should `tf.tidy()` be used to free memory?
 */
@Injectable({
  providedIn: 'root'
})
export class ImageClusterService {
  private readonly fileReader = new FileReader();
  private readonly modelLoaded: Promise<mobilenet.MobileNet>;
  constructor(@Inject(DOCUMENT) private document: HTMLDocument) {
    this.modelLoaded = mobilenet.load();
  }

  /**
   * Builds the image cluster
   *
   * @param artifacts An array of blobs with image data
   * @param [clusterSize=5] The number of cluster that should be built
   */
  public async build(artifacts: Artifact[], clusterSize = 5) {
    const model = await this.modelLoaded;
    const data: Map<
      string,
      {
        features: Float32Array | Int32Array | Uint8Array;
        classification: { className: string; probability: number }[];
      }
    > = new Map();

    // Extract features and classify
    for (const artifact of artifacts) {
      const img = await this.convertBlogToImage(
        Object.values(artifact._attachments)[0].data
      );
      const logits = model.infer(img);
      const [features, classification] = await Promise.all([
        logits.data(),
        model.classify(img)
      ]);
      data.set(artifact.id, { features, classification });
    }

    // Cluster features
    const cluster = kmeans(
      Array.from(data).map(([key, value]) => value.features),
      clusterSize
    );

    return { cluster, data };
  }

  private convertBlogToImage(blob: Blob) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const ctx = this.document.createElement('canvas').getContext('2d');

      if (!ctx) {
        reject(
          'Cannot convert Blog to Image since Canvas context is not available'
        );
        return;
      }
      this.fileReader.onload = () => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve(img);
        };
        const imgStr = this.fileReader.result?.toString();

        if (!imgStr) {
          reject(
            'Cannot convert Blog to Image since Canvas file content is not available'
          );
          return;
        }

        img.src = imgStr;
      };
      this.fileReader.readAsDataURL(blob);
    });
  }
}
