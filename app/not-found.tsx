import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-artifact">404</p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight text-mist-50 sm:text-4xl">
        This coordinate is not in the catalogue.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-mist-500">
        The page you asked for does not exist. That is different from an unknown location: this
        one was never recorded. Try the atlas index or the global search.
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        <Link href="/" className="btn btn-primary">
          Return to the archive
        </Link>
        <Link href="/explore" className="btn">
          Explore the index
        </Link>
      </div>
    </div>
  );
}
