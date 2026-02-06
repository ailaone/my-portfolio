A custom Grasshopper component for batch exporting 3MF files, developed to streamline additive manufacturing workflows at Slicelab. The component significantly reduces export time and optimizes file sizes for production-scale 3D printing applications.

## Problem

Additive manufacturing workflows often require batch exporting hundreds of files from Grasshopper. Standard export methods are slow and lack control over file optimization, creating bottlenecks in production pipelines.

## Solution

Developed a custom 3MF export component for Grasshopper that enables:
- **Batch processing** of hundreds of files with optimized export speed
- **File size optimization** for production environments
- **Automatic positioning control** with internalized XYZ octant settings
- **Two component versions** (V1 and V2) for different workflow requirements

## Technical Details

Built using Rhino 8's 3MF export API, the component provides direct control over export parameters. V1 is the preferred version as it internalizes the option to disable "Move output to positive XYZ octant," ensuring consistent part positioning across batch exports.

The component is available as both a Grasshopper definition and User Objects that appear in the Params tab.

## Open Source

Full source code and documentation available on GitHub:
**[github.com/slicelab/3MF-GH](https://github.com/slicelab/3MF-GH)**

*Special thanks to the 3MF Consortium and McNeel team for adding 3MF export options to the Rhino 8 API.*
