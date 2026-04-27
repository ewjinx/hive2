/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        // Remove trailing slash if it exists, to avoid double slashes in the rewrite
        const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        
        return [
            {
                source: '/api/:path*',
                destination: `${cleanApiUrl}/:path*`,
            },
        ]
    },
}

export default nextConfig
