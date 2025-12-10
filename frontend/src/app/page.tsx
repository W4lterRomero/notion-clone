import Link from 'next/link';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Notion Clone Local</h1>
            <p className="mb-4 text-xl">Manage your workspaces locally with Docker.</p>
            <div className="flex gap-4">
                <Link href="/login" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
                    Login
                </Link>
                <Link href="/register" className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md">
                    Register
                </Link>
            </div>
        </main>
    );
}
