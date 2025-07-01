// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		unoptimized: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
	generateBuildId: async () => {
		return process.env.GIT_HASH || "null"
	},
	experimental: {
		useCache: true,
		optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
	},
}

const enhancedConfig = withBundleAnalyzer({
	enabled: process.env.ANALYZE === 'true',
})(nextConfig)

export default enhancedConfig
