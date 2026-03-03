"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";

interface Article {
  id: number;
  title: string;
  content: string;
  image?: string;
  category?: string;
  created_at: string;
}

export default function Page() {
  const [activeSection, setActiveSection] = useState<string>("main");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const [articles, setArticles] = useState<Article[]>([]);

  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    image: "",
    category: "Obecné",
  });

  /* =========================
     NAČTENÍ ČLÁNKŮ Z DB
  ========================== */

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Chyba při načítání:", error);
        return;
      }

      if (data) setArticles(data);
    };

    fetchArticles();
  }, []);

  /* =========================
     NAV SCROLL
  ========================== */

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* =========================
     FORM HANDLERS
  ========================== */

  const handleArticleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewArticle({ ...newArticle, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewArticle((prev) => ({
        ...prev,
        image: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddArticle = async (e: FormEvent) => {
    e.preventDefault();

    if (!newArticle.title || !newArticle.content) return;

    const { error } = await supabase.from("articles").insert([
      {
        title: newArticle.title,
        content: newArticle.content,
        image: newArticle.image,
        category: newArticle.category,
      },
    ]);

    if (error) {
      console.error("Chyba při ukládání:", error);
      alert("Chyba při ukládání článku.");
      return;
    }

    // Vyčistit formulář
    setNewArticle({
      title: "",
      content: "",
      image: "",
      category: "Obecné",
    });

    // Znovu načíst články
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setArticles(data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chcete článek smazat?")) return;

    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setArticles(articles.filter((a) => a.id !== id));
  };

  const handleLogin = async () => {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput }),
    });

    if (!res.ok) {
      alert("Nesprávné heslo");
      return;
    }

    setIsAdminAuthenticated(true);
  };

  const latestArticle = articles[0];

  /* =========================
     UI
  ========================== */

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col items-center">

      {/* HEADER */}
      <header className="relative w-full h-[420px] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <img
          src="/logo.png"
          alt="Logo"
          className="absolute inset-0 w-full h-full object-contain opacity-20"
        />
      </header>

      {/* NAV */}
      <nav className={`w-full bg-white sticky top-0 z-50 ${isScrolled ? "shadow-lg" : ""}`}>
        <ul className="flex justify-center gap-12 py-6 text-xl font-semibold">
          <li onClick={() => setActiveSection("main")} className="cursor-pointer">HOME</li>
          <li onClick={() => setActiveSection("articles")} className="cursor-pointer">Články</li>
        </ul>
      </nav>

      {/* MAIN */}
      <main className="w-full max-w-4xl p-10 space-y-10">

        {activeSection === "main" && latestArticle && (
          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-3xl font-bold mb-4">Aktualita</h2>
            <h3 className="text-xl font-semibold">{latestArticle.title}</h3>
            <p className="text-gray-600 mb-4">
              {new Date(latestArticle.created_at).toLocaleDateString("cs-CZ")}
            </p>
            {latestArticle.image && (
              <img src={latestArticle.image} className="rounded mb-4" />
            )}
            <p>{latestArticle.content}</p>
          </div>
        )}

        {activeSection === "articles" && (
          <div className="space-y-8">

            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Články</h2>
              <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="bg-blue-700 text-white px-4 py-2 rounded"
              >
                Admin
              </button>
            </div>

            {isAdminOpen && !isAdminAuthenticated && (
              <div className="space-y-4">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Heslo"
                  className="border p-2 rounded w-full"
                />
                <button
                  onClick={handleLogin}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Přihlásit
                </button>
              </div>
            )}

            {isAdminOpen && isAdminAuthenticated && (
              <form onSubmit={handleAddArticle} className="space-y-4 bg-white p-6 rounded-xl shadow">
                <input
                  type="text"
                  name="title"
                  placeholder="Název článku"
                  value={newArticle.title}
                  onChange={handleArticleChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="category"
                  value={newArticle.category}
                  onChange={handleArticleChange}
                  className="w-full border p-2 rounded"
                />
                <input type="file" onChange={handleImageUpload} />
                <textarea
                  name="content"
                  rows={4}
                  placeholder="Obsah článku"
                  value={newArticle.content}
                  onChange={handleArticleChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <button className="bg-blue-700 text-white px-4 py-2 rounded">
                  Přidat článek
                </button>
              </form>
            )}

            {articles.map((article) => (
              <div key={article.id} className="border-t pt-6">
                <h3 className="text-xl font-semibold">{article.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(article.created_at).toLocaleDateString("cs-CZ")}
                </p>
                {article.image && (
                  <img src={article.image} className="my-4 rounded" />
                )}
                <p>{article.content}</p>

                {isAdminAuthenticated && (
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-600 mt-2"
                  >
                    Smazat
                  </button>
                )}
              </div>
            ))}

          </div>
        )}

      </main>

      <footer className="w-full bg-blue-900 text-white text-center py-6">
        © {new Date().getFullYear()} Respekt ke škole
      </footer>
    </div>
  );
}