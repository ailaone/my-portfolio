Early experiments exploring the intersection of AI-generated imagery and 3D reconstruction. The project treated StyleGAN2 latent walk animations as sequential 2D slices—similar to CT scan data—that could be reconstructed into 3D volumes. By processing generated frames as cross-sectional data, new 3D objects were synthesized from the AI's learned representations.

## Experiment 1: Children's Furniture Dataset

Trained a StyleGAN2 model on 200 images of children's furniture, expanding the dataset to 800 images through 90° rotations. The resulting latent walk animations were converted to grayscale and processed through ImageJ/Fiji for edge detection and threshold refinement.

This dual-processing approach generated both "inside" (solid volume) and "outside" (edge contour) geometries from the same frame data, allowing for different reconstruction strategies—volumetric meshes from filled regions and surface meshes from edge boundaries. The processed data was then migrated to Houdini for final mesh generation and refinement.

## Experiment 2: Sectional Training Data

Used existing 3D models—lattice structures and jewelry pieces—as source material. A Grasshopper workflow extracted thousands of black-and-white cross-sections through each model, which were then used to train a StyleGAN2 model. The generated latent walk frames were reconstructed back into new 3D objects, creating a feedback loop between 3D → 2D training data → AI generation → 3D reconstruction.

## Outcome

These experiments demonstrated computational design workflows that bridge generative AI and 3D modeling, exploring how neural networks trained on 2D representations of 3D objects could generate novel spatial forms.