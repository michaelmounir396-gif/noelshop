import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Truck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const PRODUCT = {
  name: "صندوق ليلة العيد",
  eyebrow: "هدية Noel الموسمية",
  price: 799,
  oldPrice: 999,
  unitLabel: "صندوق واحد جاهز للإهداء",
  description:
    "تفصيلة دافئة، مغلّفة بعناية، وتوصل إحساس العيد من أول لحظة. صندوق أنيق لمن تحب، بدون حيرة ولا لفّ كتير.",
};

const gallery = [
  { label: "الواجهة", className: "gift-scene gift-scene--berry" },
  { label: "التغليف", className: "gift-scene gift-scene--pine" },
  { label: "التفاصيل", className: "gift-scene gift-scene--gold" },
];

const faqs = [
  {
    question: "الصندوق مناسب لمين؟",
    answer:
      "مناسب لأي حد بتحبه: صديق، شريك، حد من العيلة، أو حتى هدية لنفسك. التصميم محايد ودافئ ومجهز للإهداء.",
  },
  {
    question: "الشحن بياخد وقت قد إيه؟",
    answer:
      "بنجهز طلبك خلال 24 ساعة، والتوصيل عادةً خلال 2–4 أيام عمل حسب منطقتك.",
  },
  {
    question: "ينفع أكتب رسالة مع الهدية؟",
    answer:
      "أكيد. اكتب ملاحظتك في خانة العنوان أثناء الطلب، وفريقنا يضيفها على كارت صغير داخل الصندوق.",
  },
  {
    question: "إيه سياسة الاسترجاع؟",
    answer:
      "لو وصل المنتج تالف أو مختلف عن الوصف، ابعتلنا خلال 48 ساعة وهنرتب الاستبدال أو الاسترجاع بسهولة.",
  },
];

function GiftVisual({ variant = "berry", compact = false, imageSrc = "/product-noel.jpg" }: { variant?: string; compact?: boolean; imageSrc?: string }) {
  return (
    <div className={`gift-art ${compact ? "gift-art--compact" : ""}`} aria-label="صورة منتج Noel">
      <div className={`gift-scene ${variant} real-product-scene`}>
        <img className="real-product-image" src={imageSrc} alt="مجموعة كوب شوكولاتة رومانسية مع فراولة وشموع" />
      </div>
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="quantity-stepper" aria-label="تحديد الكمية">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="تقليل الكمية">
        <Minus size={15} />
      </button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(Math.min(10, value + 1))} aria-label="زيادة الكمية">
        <Plus size={15} />
      </button>
    </div>
  );
}

export default function Home() {
  const productQuery = trpc.product.summary.useQuery();
  const settingsQuery = trpc.settings.public.useQuery();
  const liveProduct = productQuery.data ?? PRODUCT;
  const siteSettings = settingsQuery.data;
  const [videoBannerOpen, setVideoBannerOpen] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setSubmitted(data.orderNumber);
      setCartOpen(false);
      setCheckoutOpen(false);
      setQuantity(1);
      localStorage.removeItem("noel-cart-quantity");
    },
    onError: (error) => {
      const code = (error as { data?: { code?: string } }).data?.code;
      if (code === "BAD_REQUEST") {
        setFormError("راجِع الاسم ورقم الموبايل والعنوان — لازم البيانات تكون مكتملة.");
        toast.error("فيه بيانات محتاجة مراجعة.");
        return;
      }
      const fallback = `NOEL-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("noel-pending-order", JSON.stringify({ ...form, quantity, orderNumber: fallback }));
      setSubmitted(fallback);
      setCartOpen(false);
      setCheckoutOpen(false);
      setQuantity(1);
      toast("تم استلام طلبك مبدئيًا وسنتواصل معك للتأكيد.");
    },
  });

  useEffect(() => {
    document.title = "Noël — هدية تُفتح بالقلب";
    const savedQuantity = Number(localStorage.getItem("noel-cart-quantity"));
    if (savedQuantity > 0) setQuantity(Math.min(savedQuantity, 10));
  }, []);

  useEffect(() => {
    if (quantity > 0) localStorage.setItem("noel-cart-quantity", String(quantity));
  }, [quantity]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const total = useMemo(() => liveProduct.price * quantity, [liveProduct.price, quantity]);

  const addToCart = () => {
    setCartOpen(true);
    toast.success("اتضاف للسلة", { description: "الهدية مستنياك في سلة الطلب." });
  };

  const jumpToOrder = () => {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCheckout = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    if (name.length < 2 || phone.length < 8 || address.length < 8) {
      setFormError("اكتب الاسم بالكامل، رقم موبايل صحيح، والعنوان بالتفصيل.");
      toast.error("كمّل البيانات عشان نعرف نوصل الهدية.");
      return;
    }
    setFormError("");
    createOrder.mutate({ ...form, quantity });
  };

  return (
    <div className="site-shell" dir="rtl">
      {videoBannerOpen && siteSettings?.popupEnabled === 1 && <div className="video-banner-wrap" role="dialog" aria-modal="true" aria-label="عرض Noel"><div className="video-banner"><video className="video-banner__media" src={siteSettings.bannerVideoUrl} autoPlay muted={videoMuted} loop playsInline /><div className="video-banner__shade" /><div className="video-banner__content"><p className="kicker"><span /> هدية من القلب</p><h2>{siteSettings.popupTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}<em>{line}</em></span>)}</h2><p>{siteSettings.popupDescription}</p><button className="primary-cta" type="button" onClick={() => { setVideoBannerOpen(false); document.getElementById("order")?.scrollIntoView({ behavior: "smooth" }); }}>اطلب هديتك <ArrowLeft size={17} /></button></div><div className="video-banner__actions"><button type="button" onClick={() => setVideoMuted(!videoMuted)} aria-label={videoMuted ? "تشغيل الصوت" : "كتم الصوت"}>{videoMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><button type="button" onClick={() => setVideoBannerOpen(false)} aria-label="إغلاق العرض"><X size={19} /></button></div></div></div>}
      <div className="top-ribbon">
        <span><Sparkles size={14} /> {siteSettings?.announcement ?? "شحن مجاني للطلبات المؤكدة قبل 15 ديسمبر"}</span>
        <span className="top-ribbon__note">made for giving, not scrolling</span>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Noël الرئيسية">
          <span className="wordmark__mark"><Snowflake size={18} /></span>
          <span>NOËL</span>
          <small>هدايا تُفتح بالقلب</small>
        </a>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <a href="#story">الحكاية</a>
          <a href="#details">التفاصيل</a>
          <a href="#faq">الأسئلة</a>
        </nav>
        <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label="فتح السلة">
          <ShoppingBag size={19} />
          <span>السلة</span>
          {quantity > 0 && <b>{quantity}</b>}
        </button>
      </header>

      <div className="holiday-snow" aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <span key={index}>✦</span>)}</div>
      <main id="top">
        <section className="hero-section section-pad">
          <div className="hero-copy reveal-up">
            <p className="kicker"><span /> {siteSettings?.heroKicker ?? "مجموعة شتاء 2026"} <span /></p>
            <h1>{siteSettings?.heroTitle ?? "خلّي الهدية"}<br /><em>{siteSettings?.heroAccent ?? "توصل قبل الكلام."}</em></h1>
            <p className="hero-lede">{siteSettings?.heroDescription ?? "صندوق ليلة العيد معمول للحظات اللي تستاهل تتغلف بحب — قطعة واحدة، وإحساس كبير."}</p>
            <div className="hero-actions">
              <Button className="primary-cta" onClick={addToCart}>
                اطلب هديتك <ArrowLeft size={18} />
              </Button>
              <a className="text-link" href="#story">اكتشف الحكاية <ArrowUpRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true"><span>م</span><span>س</span><span>ن</span></div>
              <div><strong>+240 شخص اختاروا Noel</strong><small>هذا الموسم</small></div>
            </div>
          </div>

          <div className="hero-object reveal-up reveal-up--delay">
            <div className="hero-object__halo" />
            <GiftVisual variant="gift-scene--berry" imageSrc={siteSettings?.productImageUrl} />
            <div className="hero-stamp"><span>جاهز</span><strong>للإهداء</strong><small>no wrapping needed</small></div>
            <div className="floating-note floating-note--top"><Sparkles size={15} /> لمسة حلوة</div>
            <div className="floating-note floating-note--bottom"><Heart size={14} fill="currentColor" /> من القلب</div>
          </div>
        </section>

        <div className="benefit-strip">
          <div><Gift size={21} /><span><strong>تغليف جاهز</strong><small>يوصل بشكل يفرّح</small></span></div>
          <div><Truck size={21} /><span><strong>شحن سريع</strong><small>2–4 أيام عمل</small></span></div>
          <div><ShieldCheck size={21} /><span><strong>دفع عند الاستلام</strong><small>اطلب براحة</small></span></div>
        </div>

        <section className="story-section section-pad reveal-section" id="story" data-reveal>
          <div className="section-intro">
            <p className="kicker"><span /> ليه Noel؟</p>
            <h2>الهدية الحلوة<br /><em>مش محتاجة شرح.</em></h2>
          </div>
          <div className="story-content">
            <p>في Noel بنؤمن إن الهدية مش حجمها، الهدية في اللحظة اللي بتعملها. عشان كده صممنا صندوق واحد موسمي، يختصر الحيرة ويخلّي كل تفصيلة تقول: «أنا فاكرِك».</p>
            <div className="story-quote"><span>“</span><strong>تفصيلة صغيرة<br />تفضل كبيرة.</strong></div>
          </div>
        </section>

        <section className="product-section section-pad reveal-section" id="details" data-reveal>
          <div className="product-gallery">
            <div className="gallery-frame">
              <GiftVisual variant={gallery[activeSlide].className} imageSrc={siteSettings?.productImageUrl} />
              <span className="gallery-counter">0{activeSlide + 1} / 0{gallery.length}</span>
              <div className="gallery-controls">
                <button type="button" onClick={() => setActiveSlide((activeSlide + gallery.length - 1) % gallery.length)} aria-label="الصورة السابقة"><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setActiveSlide((activeSlide + 1) % gallery.length)} aria-label="الصورة التالية"><ChevronLeft size={17} /></button>
              </div>
            </div>
            <div className="gallery-tabs">
              {gallery.map((item, index) => <button className={index === activeSlide ? "is-active" : ""} key={item.label} onClick={() => setActiveSlide(index)} type="button">{item.label}</button>)}
            </div>
          </div>
          <div className="product-info">
            <p className="kicker"><span /> {liveProduct.eyebrow}</p>
            <h2>{liveProduct.name}</h2>
            <div className="price-line"><strong>{liveProduct.price} <small>ج.م</small></strong><del>{liveProduct.oldPrice} ج.م</del><span>خصم 20%</span></div>
            <p className="product-description">{liveProduct.description}</p>
            <div className="product-specs"><span><Check size={15} /> تصميم موسمي محدود</span><span><Check size={15} /> كارت إهداء مجاني</span><span><Check size={15} /> خامات مختارة بعناية</span></div>
            <div className="buy-panel">
              <div><small>الكمية</small><QuantityStepper value={quantity} onChange={setQuantity} /></div>
              <button className="add-button" type="button" onClick={addToCart}>أضف للسلة <ShoppingBag size={18} /></button>
            </div>
            <p className="microcopy"><ShieldCheck size={14} /> الدفع عند الاستلام متاح في كل المحافظات</p>
          </div>
        </section>

        <section className="reviews-section section-pad reveal-section" data-reveal>
          <div className="reviews-heading"><p className="kicker"><span /> قالوا عن Noel</p><h2>وصلت الهدية،<br /><em>وصل الإحساس.</em></h2></div>
          <div className="review-card"><div className="review-stars">★★★★★</div><blockquote>“التغليف لوحده كان هدية! حسيت إن كل حاجة متحضرة بعناية، وأختي فرحت جدًا.”</blockquote><div className="reviewer"><span>س</span><div><strong>سارة م.</strong><small>طلب مؤكد · القاهرة</small></div></div></div>
          <div className="review-index">01 <span /> 03</div>
        </section>

        <section className="order-section section-pad reveal-section" id="order" data-reveal>
          <div className="order-card">
            <div className="order-card__copy"><p className="kicker"><span /> آخر خطوة</p><h2>جهّزنا الهدية.<br /><em>قول لنا نوصّلها لمين.</em></h2><p>املأ بيانات بسيطة، وفريق Noel هيتواصل معاك للتأكيد قبل الشحن.</p><div className="order-mini"><GiftVisual variant="gift-scene--gold" compact imageSrc={siteSettings?.productImageUrl} /><span>صندوق ليلة العيد<br /><strong>{liveProduct.price} ج.م</strong></span></div></div>
            <form className="order-form" onSubmit={handleCheckout}>
              <label>الاسم بالكامل<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: نورا أحمد" /></label>
              <label>رقم الموبايل<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" /></label>
              <label>العنوان بالتفصيل<textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="المحافظة، المنطقة، الشارع..." rows={3} /></label>
              <label>رسالة مع الهدية <span className="optional">اختياري</span><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="كل سنة وإنت طيب يا..." /></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="form-bottom"><div><span>الإجمالي</span><strong>{total} ج.م</strong></div><Button className="primary-cta" type="submit" disabled={createOrder.isPending}>{createOrder.isPending ? "بنجهّز طلبك..." : "أكد الطلب"} <ArrowLeft size={18} /></Button></div>
            </form>
          </div>
        </section>

        <section className="faq-section section-pad reveal-section" id="faq" data-reveal>
          <div className="section-intro"><p className="kicker"><span /> محتاج تعرف</p><h2>أسئلة صغيرة،<br /><em>راحة كبيرة.</em></h2></div>
          <div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={faq.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.question}</span><ChevronDown size={18} /></button>{openFaq === index && <p>{faq.answer}</p>}</div>)}</div>
        </section>
      </main>

      <footer className="site-footer"><div className="wordmark"><span className="wordmark__mark"><Snowflake size={18} /></span><span>NOËL</span><small>هدايا تُفتح بالقلب</small></div><p>صُمم بحب لموسم يستاهل يتعاش.</p><a href="#top">للأعلى <ArrowUpRight size={16} /></a></footer>

      <button className="floating-cart" type="button" onClick={() => setCartOpen(true)} aria-label="فتح السلة"><ShoppingBag size={19} /><span>{quantity}</span></button>

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)} />}
      <aside className={`cart-drawer ${cartOpen ? "is-open" : ""}`} aria-label="سلة المشتريات">
        <div className="drawer-heading"><div><p className="kicker"><span /> طلبك</p><h2>سلة Noel</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة"><X /></button></div>
        <div className="drawer-product"><GiftVisual variant="gift-scene--berry" compact imageSrc={siteSettings?.productImageUrl} /><div><strong>{liveProduct.name}</strong><small>صندوق واحد جاهز للإهداء</small><b>{liveProduct.price} ج.م</b></div></div>
        <div className="drawer-quantity"><span>الكمية</span><QuantityStepper value={quantity} onChange={setQuantity} /></div>
        <div className="drawer-total"><span>الإجمالي</span><strong>{total} ج.م</strong></div>
        <button className="drawer-checkout" type="button" onClick={() => { setCartOpen(false); jumpToOrder(); }}>كمّل بيانات الطلب <ArrowLeft size={18} /></button>
        <p className="drawer-note"><ShieldCheck size={15} /> مفيش دفع دلوقتي — هنكلمك نأكد الطلب الأول.</p>
      </aside>

      {submitted && <div className="success-modal-wrap" role="dialog" aria-modal="true"><div className="success-modal"><button type="button" className="success-close" onClick={() => setSubmitted(null)} aria-label="إغلاق"><X /></button><div className="success-icon"><Gift size={30} /></div><p className="kicker"><span /> تمت بنجاح</p><h2>الهدية في طريقها<br /><em>للحظة الحلوة.</em></h2><p>رقم طلبك هو <strong>{submitted}</strong>. هنكلمك قريبًا لتأكيد التفاصيل.</p><button className="primary-cta" type="button" onClick={() => setSubmitted(null)}>تمام، شكرًا <Check size={17} /></button></div></div>}
    </div>
  );
}
