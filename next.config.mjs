const nextConfig = { distDir: process.env.NEXT_BUILD_DIR || ".next", output: "export", images: { unoptimized: true }, trailingSlash: true };
export default nextConfig;
