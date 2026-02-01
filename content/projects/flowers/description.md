Two computational experiments exploring generative AI using photographer Sylvere Azoulai's *Flowers* series of vibrant flowers frozen in ice blocks, viewable on Trunk Archives.

## Experiment 1: RunwayML StyleGAN2 Latent Space

I trained a Runway StyleGAN2 model on the flower dataset to explore the latent space created by this imagery. The training set consisted of 282 images cropped to squares, then duplicated three times with 90° rotations to expand the dataset to 1,128 non-directional images.

The goal was to generate new iced flowers through latent space walks. The resulting animations—rendered on both black and white backgrounds—were mesmerizing. The generated images retained recognizable elements of the source material while creating entirely new compositions with the same brilliant color palette.

## Experiment 2: DALL-E Iterative Variations

When DALL-E was first released, I ran an experiment creating variations upon variations of the original flower images, iterating on each previous result until the output became completely abstract. The goal was to understand how diffusion models work and observe which visual directions they naturally gravitate toward.

I stitched the iterations together in Premiere Pro using glitch transitions to simulate a latent walk, creating abstract animations. A clear pattern emerged: each DALL-E iteration progressively smoothed fine details into more abstract, color-blocked versions of the previous image—essentially moving from photographic complexity toward simplified graphic forms.
