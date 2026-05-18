import { useState, useRef, useEffect, useMemo } from "react";
import { useSearch } from "../hooks/useSearch";
import { useT } from "../i18n/translations";
import { getLocalizedProductName, getSearchHintSuggestions } from "../utils/translationUtils";
import { resolveProductImage } from "../utils/productUtils";

function dismissKeyboard(target) {
  target?.blur?.();
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export default function SearchBox({ onCategorySelect, onOpenProduct, mobile = false, language = "en", region = "in" }) {
  const t = useT(language);
  const { search, indexReady } = useSearch(region);

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState({ categories: [], products: [] });
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [hintIndex, setHintIndex] = useState(0);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);
  const hintSuggestions = useMemo(() => getSearchHintSuggestions(language), [language]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const nextResults = search(query);
    setResults(nextResults);
    setOpen(nextResults.categories.length > 0 || nextResults.products.length > 0);
  }, [indexReady, query, search]);

  useEffect(() => {
    if (hintSuggestions.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hintSuggestions.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [hintSuggestions]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    if (!val.trim()) {
      setResults({ categories: [], products: [] });
      setOpen(false);
      return;
    }
    const res = search(val);
    setResults(res);
    setOpen(res.categories.length > 0 || res.products.length > 0);
  };

  const catResults  = results.categories.slice(0, 4);
  const prodResults = results.products.slice(0, 12);
  const allItems = [
    ...catResults.map((c)  => ({ type: "category", data: c })),
    ...prodResults.map((p) => ({ type: "product",  data: p })),
  ];

  const handleSelect = (item) => {
    setQuery("");
    setResults({ categories: [], products: [] });
    setOpen(false);
    setActiveIdx(-1);
    dismissKeyboard(inputRef.current);
    if (item.type === "category") onCategorySelect?.(item.data.value);
    else                          onOpenProduct?.(item.data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIdx >= 0 && allItems[activeIdx]) { handleSelect(allItems[activeIdx]); return; }
    if (allItems.length > 0) {
      handleSelect(allItems[0]);
      return;
    }
    dismissKeyboard(inputRef.current);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if      (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Escape")    { setOpen(false); setActiveIdx(-1); }
    else if (e.key === "Enter")     { handleSubmit(e); }
  };

  const totalCount = catResults.length + prodResults.length;

  return (
    <div ref={wrapRef} className={`sb-wrap${mobile ? " mobile" : ""}`}>
      <style>{`
        .sb-wrap {
          position: relative;
          width: 100%;
          height: 38px;
        }

        /* Form expands symmetrically from the middle */
        .sb-form {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 100%;
          max-width: 320px;
          height: 38px;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 18px;
          overflow: visible;
          transition: max-width 0.6s cubic-bezier(0.34, 1.15, 0.64, 1),
                      border-color 0.2s, box-shadow 0.2s;
          z-index: 600;
          box-shadow: 0 14px 26px rgba(15,23,42,0.06);
        }
        .sb-wrap:hover .sb-form,
        .sb-wrap:focus-within .sb-form {
          max-width: 600px;
          border-color: rgba(15,91,215,0.2);
          box-shadow: 0 18px 34px rgba(15,91,215,0.12);
        }
        .sb-wrap.mobile {
          height: auto;
        }
        .sb-wrap.mobile .sb-form {
          position: relative;
          left: auto;
          top: auto;
          transform: none;
          max-width: none;
        }
        .sb-wrap.mobile:hover .sb-form,
        .sb-wrap.mobile:focus-within .sb-form {
          max-width: none;
        }
        .sb-form.sb-open {
          border-bottom-color: transparent;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .sb-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 116px 0 16px;
          font-family: 'Manrope', 'Nunito', sans-serif;
          font-size: 0.875rem;
          color: #1f2c44;
          background: transparent;
          min-width: 0;
        }
        .sb-input::placeholder { color: #9aa7bb; }
        .sb-hint {
          position: absolute;
          right: 52px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.64rem;
          font-weight: 800;
          color: #7f92af;
          letter-spacing: 0.01em;
          pointer-events: none;
          white-space: nowrap;
          background: linear-gradient(180deg, rgba(245,249,255,0.96), rgba(233,241,252,0.98));
          border: 1px solid rgba(177, 196, 223, 0.36);
          border-radius: 999px;
          padding: 4px 9px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.78);
          animation: sbHintSlide 0.32s ease;
        }
        @keyframes sbHintSlide {
          from { opacity: 0; transform: translate(8px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }

        .sb-btn {
          width: 40px;
          height: 34px;
          margin: 0 4px 0 0;
          background: linear-gradient(135deg, #1f5ca1, #1f5ca1);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          color: #fff;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .sb-btn:hover { background: #1f5ca1; }

        /* ── Dropdown ── */
        .sb-dropdown {
          position: absolute;
          top: 100%;
          left: -2px;
          right: -2px;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(15,91,215,0.16);
          border-top: 1px solid #e8eef8;
          border-radius: 0 0 18px 18px;
          box-shadow: 0 24px 40px rgba(15,23,42,0.12);
          z-index: 601;
          max-height: 360px;
          overflow-y: auto;
          overflow-x: hidden;
          animation: sbFade 0.15s ease;
          scroll-behavior: smooth;
        }
        .sb-dropdown::-webkit-scrollbar { width: 4px; }
        .sb-dropdown::-webkit-scrollbar-track { background: transparent; }
        .sb-dropdown::-webkit-scrollbar-thumb { background: #d0daf0; border-radius: 4px; }
        .sb-dropdown::-webkit-scrollbar-thumb:hover { background: #1f5ca1; }
        @keyframes sbFade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .sb-wrap {
            height: auto;
          }
          .sb-form {
            position: relative;
            left: auto;
            top: auto;
            transform: none;
            max-width: none;
          }
          .sb-wrap:hover .sb-form,
          .sb-wrap:focus-within .sb-form {
            max-width: none;
          }
          .sb-input {
            padding-right: 16px;
          }
        }
        @media (max-width: 560px) {
          .sb-hint { display: none; }
        }

        /* Section label */
        .sb-label {
          padding: 8px 14px 4px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #b0bcce;
          background: #f8fafd;
          border-bottom: 1px solid #f0f3f9;
        }

        /* Row */
        .sb-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          cursor: pointer;
          transition: background 0.12s;
          border-bottom: 1px solid #f5f7fb;
        }
        .sb-row:last-of-type { border-bottom: none; }
        .sb-row:hover,
        .sb-row.active { background: #f0f5ff; }

        /* Icon */
        .sb-ico {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sb-ico.cat {
          background: #e8f0fb;
          color: #1f5ca1;
          font-size: 13px;
        }
        .sb-ico.prod {
          background: #f4f6fb;
          border: 1px solid #e8eef8;
          overflow: hidden;
          padding: 3px;
        }
        .sb-ico.prod img { width: 100%; height: 100%; object-fit: contain; }

        /* Text */
        .sb-info { flex: 1; min-width: 0; }
        .sb-name {
          font-size: 13px;
          font-weight: 700;
          color: #253d4e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-name mark {
          background: #fef08a;
          color: #253d4e;
          border-radius: 2px;
          padding: 0 1px;
          font-weight: 800;
        }
        .sb-meta {
          font-size: 11px;
          color: #9aaabb;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right side */
        .sb-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          flex-shrink: 0;
        }
        .sb-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .sb-tag.cat  { background: #e8f0fb; color: #1f5ca1; }
        .sb-tag.prod { background: #f0f4fb; color: #7e8eaa; }
        .sb-price {
          font-size: 12px;
          font-weight: 800;
          color: #1f5ca1;
          font-family: 'Quicksand', sans-serif;
        }

        /* Empty */
        .sb-empty {
          padding: 20px 14px;
          text-align: center;
          font-size: 13px;
          color: #9aaabb;
        }
        .sb-empty i { display: block; font-size: 22px; color: #dde4f0; margin-bottom: 6px; }

        /* Footer */
        .sb-foot {
          padding: 6px 14px;
          background: #f8fafd;
          border-top: 1px solid #f0f3f9;
          display: flex;
          gap: 12px;
          align-items: center;
          position: sticky;
          bottom: 0;
          z-index: 1;
        }
        .sb-foot span {
          font-size: 10px;
          color: #b0bcce;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .sb-foot kbd {
          background: #eef1f7;
          color: #7e8eaa;
          border: 1px solid #dce4ef;
          border-radius: 3px;
          padding: 0 4px;
          font-size: 10px;
          font-family: inherit;
        }
      `}</style>

      <form className={`sb-form${open ? " sb-open" : ""}`} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="sb-input"
          type="text"
          placeholder={indexReady ? t.header.searchPlaceholder : "Loading…"}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (totalCount > 0) setOpen(true); }}
          autoComplete="off"
          spellCheck="false"
        />
        {!query && indexReady && (
          <span className="sb-hint">search {hintSuggestions[hintIndex]}</span>
        )}
        <button className="sb-btn" type="submit" aria-label="Search">
          <i className="fas fa-search"></i>
        </button>

        {open && (
          <div className="sb-dropdown" onMouseDown={e => e.preventDefault()}>

            {/* Categories */}
            {catResults.length > 0 && (
              <>
                <div className="sb-label">{t.header.searchCategories}</div>
                {catResults.map((cat, i) => {
                   const translatedCat = t.categories?.[cat.value.replace("-", "")] || cat.label;
                   return (
                    <div
                      key={cat.value}
                      className={`sb-row${activeIdx === i ? " active" : ""}`}
                      onMouseDown={() => handleSelect({ type: "category", data: cat })}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      <div className="sb-ico cat"><i className="fas fa-tag"></i></div>
                      <div className="sb-info">
                        <div className="sb-name"><HighlightMatch text={translatedCat} query={query} /></div>
                        <div className="sb-meta">{t.header.browseCategories} {translatedCat}</div>
                      </div>
                      <div className="sb-right">
                        <span className="sb-tag cat">{t.header.searchCategories}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Products */}
            {prodResults.length > 0 && (
              <>
                <div className="sb-label">{t.header.searchProducts}</div>
                {prodResults.map((prod, i) => {
                  const fi = catResults.length + i;
                  const translatedName = getLocalizedProductName(prod.name, t);
                  const translatedCat  = t.categories?.[prod._catLabel.toLowerCase().replace(/\s/g, "")] || prod._catLabel;
                  const resolvedProductImage = resolveProductImage(prod);
                  return (
                    <div
                      key={prod._uid}
                      className={`sb-row${activeIdx === fi ? " active" : ""}`}
                      onMouseDown={() => handleSelect({ type: "product", data: prod })}
                      onMouseEnter={() => setActiveIdx(fi)}
                    >
                      <div className="sb-ico prod">
                        {resolvedProductImage
                          ? <img src={resolvedProductImage} alt={translatedName} loading="lazy" />
                          : <i className="fas fa-box" style={{ color: "#c8d4e8", fontSize: 13 }}></i>
                        }
                      </div>
                      <div className="sb-info">
                        <div className="sb-name"><HighlightMatch text={translatedName || ""} query={query} /></div>
                        <div className="sb-meta">
                          {prod.brand && `${prod.brand} · `}
                          <span style={{ textTransform: "capitalize" }}>{translatedCat}</span>
                        </div>
                      </div>
                      <div className="sb-right">
                        {prod.price && <span className="sb-price">{prod.price}</span>}
                        <span className="sb-tag prod">{translatedCat}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Empty */}
            {totalCount === 0 && (
              <div className="sb-empty">
                <i className="fas fa-search"></i>
                {t.header.noResults} "<strong>{query}</strong>"
              </div>
            )}

            {/* Footer */}
            <div className="sb-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> {t.header.navHint}</span>
              <span><kbd>↵</kbd> {t.header.selHint}</span>
              <span><kbd>Esc</kbd> {t.header.escHint}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function HighlightMatch({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
