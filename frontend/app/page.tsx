import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-black text-white">
            <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Hive CI/CD
            </h1>
            <p className="text-xl mb-8 text-gray-300">Decentralized Peer-Powered Compute Grid</p>

            <div className="flex gap-4">
                <Link href="/login">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Login</Button>
                </Link>
                <Link href="/register">
                    <Button variant="outline" size="lg" className="text-black border-white hover:bg-white hover:text-black">
                        Register
                    </Button>
                </Link>
            </div>
        </main>
    );
}
