// src/pages/front/faq/Faq.jsx
import React, { useEffect, useMemo, useState } from "react";
import API_URL from "../../../api/config";
import { Link } from "react-router-dom";

const API_BASE = API_URL;

const Faq = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/faq`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (data.success) {
          const payload = data.data || data;
          setFaqs(payload.faqs ?? []);
          setCategories(payload.categories ?? []);
          if (payload.faqs?.length > 0) setOpenId(payload.faqs[0].id);
        }
      } catch (err) {
        console.error("FAQ fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const category = String(faq.category || "").toLowerCase();
      const matchesCategory =
        activeFilter === "all" || category === activeFilter;
      const q = search.trim().toLowerCase();
      const question = String(faq.question || "").toLowerCase();
      const answer = String(faq.answer || "").toLowerCase();
      const matchesSearch =
        q === "" || question.includes(q) || answer.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeFilter, search]);

  const toggleOpen = (id) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="container py-5">
      <div className="row mb-5">
        <div className="col-lg-8 mx-auto text-center">
          <h1>Frequently Asked Questions</h1>
          <p className="text-muted">
            Find answers to the most common questions about BSSShop
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-md-6 mx-auto">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              id="faqSearch"
              placeholder="Search for questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      {categories.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                type="button"
                className={`btn btn-sm faq-filter ${activeFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                data-filter="all"
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>
              {categories.map((cat, i) => {
                const rawValue =
                  typeof cat === "string" ? cat : cat.category || "";
                const value = rawValue.toLowerCase(); // ← lowercase here
                return (
                  <button
                    type="button"
                    key={i}
                    className={`btn btn-sm faq-filter ${activeFilter === value ? "btn-primary" : "btn-outline-primary"}`}
                    data-filter={value}
                    onClick={() => setActiveFilter(value)}
                  >
                    {rawValue.charAt(0).toUpperCase() + rawValue.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      <div className="row">
        <div className="col-lg-8 mx-auto">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredFaqs.length > 0 ? (
            <div className="accordion" id="faqAccordion">
              {filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    className="faq-item"
                    data-category={String(faq.category || "").toLowerCase()}
                    key={faq.id}
                  >
                    <div className="accordion-item mb-3 border rounded">
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                          type="button"
                          onClick={() => toggleOpen(faq.id)}
                          aria-expanded={isOpen}
                        >
                          {faq.question}
                          <span className="badge bg-secondary ms-2 small">
                            {faq.category
                              ? faq.category.charAt(0).toUpperCase() +
                                faq.category.slice(1)
                              : ""}
                          </span>
                        </button>
                      </h2>
                      <div
                        className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}
                      >
                        <div
                          className="accordion-body"
                          dangerouslySetInnerHTML={{
                            __html: String(faq.answer || "").replace(
                              /\n/g,
                              "<br />",
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <i
                className="bi bi-question-circle text-muted"
                style={{ fontSize: "4rem" }}
              ></i>
              <h3 className="mt-3">No FAQs found</h3>
              <p className="text-muted">
                Check back later for frequently asked questions.
              </p>
            </div>
          )}

          <div className="text-center mt-5 p-4 bg-light rounded">
            <h5>Still have questions?</h5>
            <p className="text-muted">
              We're here to help. Contact our support team.
            </p>
            <Link to="/contact" className="btn btn-primary">
              <i className="bi bi-envelope"></i> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;
