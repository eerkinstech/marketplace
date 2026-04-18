const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*"
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*"
      }
    ];
  }
};

export default nextConfig;
