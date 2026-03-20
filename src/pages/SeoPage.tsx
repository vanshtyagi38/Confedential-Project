import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./NotFound";

const SeoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedPages, setRelatedPages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("seo_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!data || error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPage(data);

      // Track page view (fire and forget)
      supabase.from("seo_page_views").insert({ slug }).then();

      // Fetch related pages
      if (data.related_slugs && data.related_slugs.length > 0) {
        const { data: related } = await supabase
          .from("seo_pages")
          .select("slug, title")
          .in("slug", data.related_slugs)
          .eq("status", "published");
        if (related) setRelatedPages(related);
      }

      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) return <NotFound />;

  const faqs = (page.faq_json as { question: string; answer: string }[]) || [];

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.meta_description,
    url: `https://singletape.in/${page.slug}`,
    publisher: {
      "@type": "Organization",
      name: "SingleTape",
      url: "https://singletape.in",
    },
  };

  if (faqs.length > 0) {
    jsonLd.mainEntity = faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    }));
  }

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.meta_description} />
        <meta name="keywords" content={`${page.primary_keyword}, ${page.secondary_keywords || "anonymous chat, private chat India"}`} />
        <link rel="canonical" href={`https://singletape.in/${page.slug}`} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.meta_description} />
        <meta property="og:url" content={`https://singletape.in/${page.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://singletape.in/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.meta_description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Minimal Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-primary">SingleTape</Link>
            <Link
              to="/onboarding"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Chatting
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{page.title}</h1>

          {/* CTA Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              🔥 Join thousands of users chatting anonymously right now!
            </p>
            <Link
              to="/onboarding"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              Start Chatting Now →
            </Link>
          </div>

          {/* Article Content */}
          <article
            className="prose prose-invert max-w-none mb-12
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:text-muted-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:text-muted-foreground [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: page.content_html }}
          />

          {/* FAQs */}
          {faqs.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Chat?</h2>
            <p className="text-muted-foreground mb-4">Join SingleTape now — it's free, anonymous, and fun!</p>
            <Link
              to="/onboarding"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              Start Chatting Free →
            </Link>
          </div>

          {/* Related Pages (Internal Linking) */}
          {relatedPages.length > 0 && (
            <section className="mb-12">
              <h3 className="text-lg font-semibold text-foreground mb-4">Related Pages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedPages.map((rp) => (
                  <Link
                    key={rp.slug}
                    to={`/${rp.slug}`}
                    className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-foreground">{rp.title}</p>
                    <p className="text-sm text-muted-foreground">/{rp.slug}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-border bg-card py-6">
          <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/refund" className="hover:text-foreground">Refund</Link>
            <span>© {new Date().getFullYear()} SingleTape</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SeoPage;
