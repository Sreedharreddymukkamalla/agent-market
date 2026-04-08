/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			allowedOrigins: ["localhost:3000", "192.168.1.101:3000"]
		},
	},
	eslint: {
		// Prevent ESLint errors from failing production builds
		ignoreDuringBuilds: true,
	},
	transpilePackages: ["shiki"],
};

export default nextConfig;
