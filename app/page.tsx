"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: number;
  title: string;
  content: string;
  date: string;
  image?: string;
  category?: string;
  year: number;
}

export default function Page() {
  // Admin heslo je nyní ověřováno serverově přes API route (/api/admin-login)
  // Heslo musí být nastaveno jako environment proměnná na Vercelu: ADMIN_PASSWORD

  const [activeSection, setActiveSection] = useState<string>("main");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("Vše");
  const [filterYear, setFilterYear] = useState<string>("Vše");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const [articles, setArticles] = useState<Article[]>([]);

  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    image: "",
    category: "Obecné",
  });

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("articles");
    if (stored) setArticles(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("articles", JSON.stringify(articles));
  }, [articles]);

  // Shrink nav on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const latestArticle = articles[0];

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
      setNewArticle((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddOrUpdateArticle = (e: FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) return;

    const now = new Date();
    const year = now.getFullYear();

    if (editingId) {
      setArticles(
        articles.map((a) => (a.id === editingId ? { ...a, ...newArticle } : a))
      );
      setEditingId(null);
    } else {
      const newEntry: Article = {
        id: Date.now(),
        ...newArticle,
        date: now.toLocaleDateString("cs-CZ", {
          year: "numeric",
          month: "long",
        }),
        year,
      };
      setArticles([newEntry, ...articles]);
    }

    setNewArticle({ title: "", content: "", image: "", category: "Obecné" });
  };

  const handleDelete = (id: number) => {
    if (confirm("Opravdu chcete článek smazat?")) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setNewArticle({
      title: article.title,
      content: article.content,
      image: article.image || "",
      category: article.category || "Obecné",
    });
    setIsAdminOpen(true);
  };

  const toggleArticle = (id: number) => {
    setSelectedArticleId(selectedArticleId === id ? null : id);
  };

  const handleLogin = async () => {
    try {
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
    } catch (err) {
      alert("Chyba připojení k serveru");
    }
  };

  const categories = ["Vše", ...new Set(articles.map((a) => a.category || "Obecné"))];
  const years = ["Vše", ...new Set(articles.map((a) => a.year?.toString()))];

  const filteredArticles = articles.filter(
    (a) =>
      (filterCategory === "Vše" || a.category === filterCategory) &&
      (filterYear === "Vše" || a.year?.toString() === filterYear)
  );

  const navItem = (label: string, section: string) => (
    <li
      onClick={() => setActiveSection(section)}
      className={`relative cursor-pointer transition-all duration-300 hover:scale-110 hover:text-blue-600 ${
        activeSection === section ? "text-blue-700" : "text-gray-800"
      }`}
    >
      {label}
      <span
        className={`absolute left-0 -bottom-2 h-[2px] bg-blue-600 transition-all duration-300 ${
          activeSection === section ? "w-full" : "w-0"
        }`}
      />
    </li>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col items-center">
      {/* HEADER */}
      <header className="relative w-full h-[420px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <img src="/logo.png" alt="Respekt ke škole znak" className="absolute inset-0 w-full h-full object-contain opacity-20" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-xl">
            RESPEKT KE ŠKOLE
          </h1>
          <p className="mt-4 text-white/80 text-lg">Moderní prostředí. Odpovědná budoucnost.</p>
        </div>

        {/* Facebook Icon */}
        <a
          href="https://www.facebook.com/profile.php?id=61587466977553"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-6 top-6 bg-white/20 hover:bg-white/30 transition backdrop-blur-md p-3 rounded-full shadow-lg"
          aria-label="Facebook stránka"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-6 h-6"
          >
            <path d="M22 12a10 10 0 10-11.5 9.9v-7H7.9v-2.9h2.6V9.6c0-2.6 1.6-4 3.9-4 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.3 0-1.7.8-1.7 1.6v1.9h2.9l-.5 2.9h-2.4v7A10 10 0 0022 12z" />
          </svg>
        </a>
      </header>

      {/* NAVIGATION */}
      <nav
        className={`w-full sticky top-0 z-50 backdrop-blur-xl bg-white/50 border-b border-white/40 transition-all duration-500 ${
          isScrolled ? "py-3 shadow-xl" : "py-6"
        }`}
      >
        <ul className="max-w-6xl mx-auto flex justify-center gap-12 text-xl md:text-2xl font-semibold items-center">
          {navItem("🏠 HOME", "main")}
          {navItem("O nás", "about")}
          {navItem("Články", "articles")}
          {navItem("Odeslat formulář", "register")}
          {navItem("Kontakt", "contact")}
        </ul>
      </nav>

      {/* MAIN */}
      <main className="flex-1 w-full max-w-5xl p-10 space-y-12">

        <AnimatePresence mode="wait">

        {activeSection === "main" && latestArticle && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/40"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Aktualita</h2>
            <h3 className="text-2xl font-semibold">{latestArticle.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{latestArticle.date}</p>
            {latestArticle.image && <img src={latestArticle.image} className="my-6 rounded-xl" />}
            <p className="text-lg leading-relaxed">{latestArticle.content}</p>
          </motion.div>
        )}

        {activeSection === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-white via-blue-50 to-white backdrop-blur-xl rounded-3xl shadow-2xl p-14 border border-blue-200 overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-wide text-blue-900">
                  Manifest Respektu ke škole
                </h2>
                <div className="w-24 h-1 bg-blue-700 mx-auto rounded-full" />
                <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                  Nejsme protest. Nejsme opozice. Jsme iniciativa pro kultivované, spravedlivé a profesionální školní prostředí.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-800">⚖️ Férovost</h3>
                  <p className="text-gray-700 leading-relaxed">Každý podnět má být řešen věcně, transparentně a s respektem ke všem stranám.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-800">📘 Profesionalita</h3>
                  <p className="text-gray-700 leading-relaxed">Podporujeme moderní a odborně vedenou školu s vysokým standardem výuky.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-800">🤝 Dialog</h3>
                  <p className="text-gray-700 leading-relaxed">Věříme v otevřenou komunikaci mezi všemi aktéry školního prostředí.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-800">🔍 Relevantní informace</h3>
                  <p className="text-gray-700 leading-relaxed">Opíráme se o ověřené informace, které pomáhají, nikoli škodí.</p>
                </div>
              </div>
              <div className="border-t border-blue-200 pt-8 text-center">
                <p className="text-lg text-gray-800 leading-relaxed max-w-3xl mx-auto">
                  Respekt ke škole znamená respekt k budoucnosti.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "articles" && (
          <motion.div
            key="articles"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/40 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Články</h2>
              <button onClick={() => setIsAdminOpen(!isAdminOpen)} className="bg-blue-700 text-white px-4 py-2 rounded-lg">Admin</button>
            </div>

            {/* ADMIN LOGIN */}
            {isAdminOpen && !isAdminAuthenticated && (
              <div className="space-y-3 bg-white p-4 rounded-xl shadow">
                <input
                  type="password"
                  placeholder="Zadejte heslo"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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

            {/* ADMIN PANEL */}
            {isAdminOpen && isAdminAuthenticated && (
              <form onSubmit={handleAddOrUpdateArticle} className="space-y-4 bg-white p-6 rounded-xl shadow">
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
                  placeholder="Kategorie"
                  value={newArticle.category}
                  onChange={handleArticleChange}
                  className="w-full border p-2 rounded"
                />
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {newArticle.image && (
                  <img src={newArticle.image} className="max-h-48 rounded" />
                )}
                <textarea
                  name="content"
                  rows={4}
                  placeholder="Obsah článku"
                  value={newArticle.content}
                  onChange={handleArticleChange}
                  className="w-full border p-2 rounded"
                  required
                />
                <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded">
                  {editingId ? "Uložit změny" : "Přidat článek"}
                </button>
              </form>
            )}

            {/* ARTICLES LIST */}
            {filteredArticles.map((article) => {
              const isOpen = selectedArticleId === article.id;
              const preview = article.content.slice(0, 120) + "...";
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t pt-6"
                >
                  <div onClick={() => toggleArticle(article.id)} className="cursor-pointer">
                    <h3 className="text-xl font-semibold">{article.title}</h3>
                    <p className="text-sm text-gray-500">{article.date} | {article.category}</p>
                    {article.image && isOpen && <img src={article.image} className="my-4 rounded" />}
                    <p>{isOpen ? article.content : preview}</p>
                  </div>

                  {isAdminAuthenticated && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <button onClick={() => handleEdit(article)} className="text-blue-700">Upravit</button>
                      <button onClick={() => handleDelete(article.id)} className="text-red-600">Smazat</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeSection === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/40 space-y-6"
          >
            <h2 className="text-3xl font-bold text-center">Odeslání formuláře</h2>
            <form action="https://formspree.io/f/xgolqwya" method="POST" className="space-y-4">
              <input type="text" name="jmeno" placeholder="Jméno" required className="w-full border p-2 rounded" />
              <input type="email" name="email" placeholder="Email" required className="w-full border p-2 rounded" />
              <textarea name="zprava" rows={4} placeholder="Zpráva" className="w-full border p-2 rounded" />
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded">Odeslat formulář</button>
            </form>
          </motion.div>
        )}

        {activeSection === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/40 text-center space-y-6"
          >
            <h2 className="text-3xl font-bold">Kontakt</h2>
            <img src="/logo-do-skoly.png" className="mx-auto rounded shadow" />
            <a href="mailto:skolstvi2025@seznam.cz" className="block text-blue-700 text-lg">📧 skolstvi2025@seznam.cz</a>
            <a href="https://www.facebook.com/profile.php?id=61587466977553" target="_blank" className="block text-blue-700 text-lg">👍 Facebook – Sledujte nás</a>
            <p className="text-gray-600">Případně použijte formulář na stránkách.</p>
          </motion.div>
        )}

        </AnimatePresence>

      </main>

      <footer className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center py-6">
        © {new Date().getFullYear()} Respekt ke škole
      </footer>
    </div>
  );
}
