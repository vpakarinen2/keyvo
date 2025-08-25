"use client";

import { useState } from "react";

import { Search, Copy, Download, PlaySquare, Globe } from "lucide-react";

type Platform = "google" | "youtube";

const countries = [
  { name: "United States", code: "us" },
  { name: "Finland", code: "fi" },
  { name: "Germany", code: "de" },
  { name: "United Kingdom", code: "uk" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Japan", code: "jp" },
  { name: "Global", code: "" },
];

const SkeletonLoader = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-8 bg-slate-200 rounded-md"></div>
    <div className="h-8 bg-slate-200 rounded-md"></div>
    <div className="h-8 bg-slate-200 rounded-md"></div>
    <div className="h-8 bg-slate-200 rounded-md"></div>
    <div className="h-8 bg-slate-200 rounded-md w-5/6"></div>
  </div>
);

export default function HomePage() {
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [seedKeyword, setSeedKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [selectedCountry, setSelectedCountry] = useState("us");
  const [platform, setPlatform] = useState<Platform>("google");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!seedKeyword.trim()) {
      setError("Please enter a keyword to search.");
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCopyButtonText("Copy");

    try {
      let apiUrl = `http://127.0.0.1:8000/api/keywords?q=${encodeURIComponent(
        seedKeyword
      )}&platform=${platform}`;

      if (platform === "google") {
        apiUrl += `&gl=${selectedCountry}`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Something went wrong");
      }

      const data: string[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (results.length == 0) return;

    const textToCopy = results.join("\n");
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy"), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleExport = () => {
    if (results.length === 0) return;

    const header = "Keywords\n";
    const csvContent = header + results.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `keyvo_${seedKeyword.replace(/\s+/g, "_")}_export.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl sm:text-5xl md:text-7xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600 pb-2">
            Keyvo
          </h1>
          <p className="text-slate-500 text-base sm:text-lg">
            Keyword discovery tool for SEO
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-lg shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {(['google', 'youtube'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                    platform === p
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  {p === 'google' ? <Globe size={16} /> : <PlaySquare size={16} />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                placeholder="Enter a seed keyword..."
                className="flex-grow p-3 rounded-md bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={platform === 'youtube'}
                className="p-3 rounded-md bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 p-3 px-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 font-semibold transition-colors"
            >
              <Search size={18} />
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        <div className="mt-8">
          {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">{error}</p>}
          
          {isLoading && <SkeletonLoader />}

          {!isLoading && results.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-lg shadow-lg p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Results ({results.length})</h2>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors">
                    <Copy size={12} /> {copyButtonText}
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors">
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {results.map((keyword, index) => (
                  <li key={index} className="p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
