# MathLab: Interactive Geometry with Computer Vision

MathLab is an open-source web application that uses computer vision (MediaPipe) to create interactive geometric visualizations controlled by hand gestures.

## Features

### Math Modes
1.  **Triangle Centers**: Visualize the four classic centers of a triangle (Centroid, Circumcenter, Incenter, Orthocenter) and how they relate to each other.
    *   *Educational Value*: Understand geometric properties and the Euler line.
- **Triangle Centers** - Visualize centroid, circumcenter, incenter, and orthocenter with interactive triangle types (Acute, Right, Obtuse, Equilateral)
- **Platonic Solids** - Explore 3D geometry with interactive rotation of the five Platonic solids

### Physics Modes
- **Vector Addition** - Interactive demonstration of vector addition with parallelogram law, magnitudes, angles, and cosine law
- **Pendulum Physics** - Real-time pendulum simulation with accurate physics equations and adjustable parameters

## 🎮 Controls

- **Hand Tracking**: Use your webcam to interact with visualizations using hand gestures
- **Mouse/Touch**: Click and drag to manipulate objects
- **Background Toggle**: Switch between camera view and dark mode using the 🎥/🌙 button
- **Mode Selection**: Choose from different mathematical and physical visualizations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A modern web browser with webcam support

### Installation

```bash
# Clone the repository
git clone https://github.com/subinium/VisionMath.git
cd VisionMath

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Vite and deploy

Or use Vercel CLI:

```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms

The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

Just build the project and upload the `dist` folder.

## 🛠️ Technologies

- **React** - UI framework
- **Vite** - Build tool and dev server
- **MediaPipe** - Hand tracking via webcam
- **Canvas API** - 2D/3D rendering
- **Modern CSS** - Glassmorphism design

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

Created by [@subinium](https://github.com/subinium)

## 🙏 Acknowledgments

- MediaPipe for hand tracking technology
- The mathematical and physics education community
