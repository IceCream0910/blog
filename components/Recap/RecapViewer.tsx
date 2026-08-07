import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IonIcon from "@reacticons/ionicons";
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useTransform } from "framer-motion";
import { NotionRenderer } from "../../packages/notionx";
import { Code, Collection, Equation, Modal } from "../../utils/notion-components";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getGradientTextColor, getTextGradient } from "../../utils/text-gradient";

type RecapItem = Record<string, string>;
type RecapSection = { id: string; title: string; blockIds: string[] };
type RecapPost = {
  id: string;
  title: string;
  date: string;
  properties: Record<string, RecapItem[]>;
  sections?: RecapSection[];
  recordMap?: any;
};
type PropertySlide = { type: "property"; key: string; title: string; items: RecapItem[] };
type CoverSlide = { type: "cover"; title: string };
type BodyLayout = "standard" | "scrap" | "hero" | "inline";
type BodySlide = {
  type: "body";
  sectionId: string;
  title: string;
  blockIds: string[];
  continuation: boolean;
  layout: BodyLayout;
  visualMaxHeight: number;
};
type EmptySlide = { type: "empty"; title: string };
type RecapSlide = CoverSlide | PropertySlide | BodySlide | EmptySlide;

const propertyMeta: Record<string, { title: string; icon: string; eyebrow: string; unit: string }> = {
  music: { title: `자주 들은 노래`, icon: "musical-notes-outline", eyebrow: "MONTHLY REPLAY", unit: "곡" },
  watching: { title: "감상한 영화/시리즈", icon: "film-outline", eyebrow: "MONTHLY WATCHLIST", unit: "편" },
  reading: { title: "읽은 책", icon: "book-outline", eyebrow: "MONTHLY BOOKSHELF", unit: "권" },
};
const rendererComponents = { Code, Collection, Equation, Modal };

function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getBlockValue(recordMap: any, blockId: string) {
  const entry = recordMap?.block?.[blockId];
  return entry?.value?.value || entry?.value || entry;
}

function getBlockStats(recordMap: any, blockId: string, visited = new Set<string>()) {
  if (visited.has(blockId)) return { characters: 0, media: 0 };
  visited.add(blockId);
  const block = getBlockValue(recordMap, blockId);
  if (!block) return { characters: 0, media: 0 };
  const characters = (block.properties?.title || []).reduce((sum: number, part: any[]) => sum + String(part?.[0] || "").length, 0);
  const mediaTypes = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
  return (block.content || []).reduce((stats: { characters: number; media: number }, childId: string) => {
    const child = getBlockStats(recordMap, childId, visited);
    return { characters: stats.characters + child.characters, media: stats.media + child.media };
  }, { characters, media: mediaTypes.has(block.type) ? 1 : 0 });
}

function getBlockPlainText(recordMap: any, blockId: string) {
  const block = getBlockValue(recordMap, blockId);
  return (block?.properties?.title || []).map((part: any[]) => String(part?.[0] || "")).join("").trim();
}

function createVisualNote(recordMap: any, sectionBlockIds: string[], pageBlockIds: string[]) {
  const visualTypes = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
  const sourceIndex = Math.max(0, sectionBlockIds.indexOf(pageBlockIds[0]));
  const candidates = [
    ...sectionBlockIds.slice(sourceIndex + 1),
    ...sectionBlockIds.slice(0, sourceIndex).reverse(),
  ];
  const sourceId = candidates.find((blockId) => !visualTypes.has(getBlockValue(recordMap, blockId)?.type) && getBlockPlainText(recordMap, blockId));
  if (!sourceId) return undefined;
  const text = getBlockPlainText(recordMap, sourceId).replace(/\s+/g, " ");
  const sentence = text.match(/^.*?[.!?。](?:\s|$)/)?.[0]?.trim() || text;
  return sentence.length > 150 ? `${sentence.slice(0, 147).trim()}…` : sentence;
}

function getSlideDuration(slide: RecapSlide, post: RecapPost) {
  if (slide.type === "cover") return 4200;
  if (slide.type === "property") {
    if (slide.key === "music") return Math.min(45000, Math.max(5200, slide.items.length * 4800));
    return Math.min(11000, 3800 + slide.items.length * 1100);
  }
  if (slide.type === "body") {
    const stats = slide.blockIds.reduce((total, blockId) => {
      const value = getBlockStats(post.recordMap, blockId);
      return { characters: total.characters + value.characters, media: total.media + value.media };
    }, { characters: 0, media: 0 });
    return Math.max(4800, Math.min(16000, 4200 + stats.characters * 28 + stats.media * 2200));
  }
  return 5000;
}

function CoverContent({ post }: { post: RecapPost }) {
  const month = new Date(post.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  return (
    <div className="recap-cover">
      <motion.span className="recap-cover-eyebrow" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.42 }}>
        MONTHLY RECAP
      </motion.span>
      <motion.h1 initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}>
        {post.title}
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.46 }}>
        {month}의 일들과 생각을 모아봤어요.
      </motion.p>
      <motion.strong className="recap-cover-watermark" aria-hidden="true" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.16, scale: 1 }} transition={{ delay: 0.14, duration: 0.7 }}>
        RECAP
      </motion.strong>
    </div>
  );
}

function PropertyItemMotion({
  item,
  index,
  className,
  children,
  style,
}: {
  item: RecapItem;
  index: number;
  className: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const target = safeUrl(item.url);
  const animation = {
    initial: { opacity: 0, y: 24, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -18, scale: 0.97 },
    transition: { duration: 0.38, delay: index * 0.08, ease: "easeOut" as const },
  };
  return target ? (
    <motion.a {...animation} rel="noreferrer" className={className} style={style}>{children}</motion.a>
  ) : (
    <motion.div {...animation} className={className} style={style}>{children}</motion.div>
  );
}

function WatchingContent({ slide }: { slide: PropertySlide }) {
  if (slide.items.length === 1) {
    const item = slide.items[0];
    return (
      <div className="recap-property recap-property-watching recap-watching-singleton">
        <PropertyItemMotion item={item} index={0} className="recap-watching-single-copy">
          <span>시리즈</span>
          <strong>{item.title || "이번 달의 작품"}</strong>
        </PropertyItemMotion>
      </div>
    );
  }

  return (
    <div className={`recap-property recap-property-watching recap-watching-count-${Math.min(slide.items.length, 3)}`}>
      <div className={`recap-watching-grid recap-watching-grid-${Math.min(slide.items.length, 3)}`}>
        {slide.items.map((item, index) => {
          const artwork = safeUrl(item.artwork);
          return (
            <PropertyItemMotion key={`${item.title}-${index}`} item={item} index={index} className={`recap-watching-card ${artwork ? "has-artwork" : "no-artwork"}`}>
              {artwork ? <img src={artwork} alt="" /> : <span className="recap-watching-placeholder"><IonIcon name="film-outline" /></span>}
              <span className="recap-watching-copy"><strong>{item.title || `작품 ${index + 1}`}</strong></span>
              {safeUrl(item.url) && <IonIcon name="open-outline" className="recap-watching-open" />}
            </PropertyItemMotion>
          );
        })}
      </div>
    </div>
  );
}

function MusicContent({ slide, activeIndex }: { slide: PropertySlide; activeIndex: number }) {
  const count = Math.max(1, slide.items.length);
  const currentIndex = Math.min(activeIndex, count - 1);
  const currentItem = slide.items[currentIndex] || {};
  const target = safeUrl(currentItem.url);
  const details = (
    <>
      <strong>{currentItem.title || `music ${currentIndex + 1}`}</strong>
      {currentItem.artist && <small>{currentItem.artist}</small>}
    </>
  );

  return (
    <div className={`recap-property recap-property-music recap-music-player recap-music-count-${Math.min(count, 5)}`}>
      <div className="recap-music-stack" aria-hidden="true">
        {slide.items.map((item, index) => {
          let offset = index - currentIndex;
          if (count > 2 && offset > count / 2) offset -= count;
          if (count > 2 && offset < -count / 2) offset += count;
          const distance = Math.abs(offset);
          const artwork = safeUrl(item.artwork);
          return (
            <motion.div
              key={`${item.title}-${index}`}
              className={`recap-music-card ${index === currentIndex ? "is-active" : ""} ${artwork ? "has-artwork" : "no-artwork"}`}
              animate={{
                x: `${offset * 46}%`,
                rotate: offset * 5.5,
                scale: 1 - Math.min(distance, 4) * 0.075,
                opacity: distance > 3 ? 0 : Math.max(0.42, 1 - distance * 0.15),
              }}
              transition={{ type: "spring", stiffness: 220, damping: 27, mass: 0.82 }}
              style={{ zIndex: 20 - distance }}
            >
              {artwork ? <img src={artwork} alt="" /> : <span><IonIcon name="musical-notes-outline" /></span>}
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {target ? (
          <motion.a
            key={`${currentIndex}-details`}
            rel="noreferrer"
            className="recap-music-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >{details}</motion.a>
        ) : (
          <motion.div
            key={`${currentIndex}-details`}
            className="recap-music-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >{details}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReadingContent({ slide }: { slide: PropertySlide }) {
  const count = Math.min(slide.items.length, 4);
  return (
    <div className={`recap-property recap-property-reading recap-reading-count-${count}`}>
      <div className={`recap-reading-stack recap-reading-stack-${count}`}>
        {slide.items.map((item, index) => {
          const artwork = safeUrl(item.artwork);
          const bookStyle = artwork ? ({ "--recap-book-artwork": `url("${artwork}")` } as React.CSSProperties) : undefined;
          return (
            <PropertyItemMotion key={`${item.title}-${index}`} item={item} index={index} className={`recap-reading-book ${artwork ? "has-artwork" : "no-artwork"}`} style={bookStyle}>
              <span className="recap-reading-copy">
                <strong>{item.title || `책 ${index + 1}`}</strong>
                {item.author && <small>{item.author}</small>}
              </span>
              <span className="recap-book-model" aria-hidden="true">
                <span className="recap-book-cover">{artwork ? <img src={artwork} alt="" /> : <IonIcon name="book-outline" />}</span>
                <span className="recap-book-pages" />
                <span className="recap-book-spine" />
              </span>
              {safeUrl(item.url) && <IonIcon name="open-outline" className="recap-reading-open" />}
            </PropertyItemMotion>
          );
        })}
      </div>
    </div>
  );
}

function PropertyContent({ slide, activeMusicIndex }: { slide: PropertySlide; activeMusicIndex: number }) {
  if (slide.key === "music") return <MusicContent slide={slide} activeIndex={activeMusicIndex} />;
  if (slide.key === "watching") return <WatchingContent slide={slide} />;
  if (slide.key === "reading") return <ReadingContent slide={slide} />;

  const meta = propertyMeta[slide.key];
  const featuredArtwork = safeUrl(slide.items.find((item) => safeUrl(item.artwork))?.artwork);
  return (
    <div className={`recap-property recap-property-${slide.key} ${featuredArtwork ? "has-featured-artwork" : "is-typographic"}`}>
      <div className="recap-property-decoration" aria-hidden="true"><i /><i /><i /></div>
      <div className={`recap-property-grid recap-property-count-${Math.min(slide.items.length, 4)}`}>
        {slide.items.map((item, index) => {
          const artwork = safeUrl(item.artwork);
          const content = (
            <>
              {artwork ? <img src={artwork} alt="" className="recap-artwork" /> : (
                <span className="recap-artwork recap-artwork-placeholder"><IonIcon name={meta.icon as any} /></span>
              )}
              <span className="recap-item-copy">
                <strong>{item.title || `${slide.key} ${index + 1}`}</strong>
                {(item.artist || item.author) && <small>{item.artist || item.author}</small>}
              </span>
            </>
          );
          const itemClassName = `recap-property-item ${index === 0 ? "is-featured" : "is-scrap"} ${artwork ? "has-artwork" : "no-artwork"}`;
          return <PropertyItemMotion key={`${item.title}-${index}`} item={item} index={index} className={itemClassName}>{content}</PropertyItemMotion>;
        })}
      </div>
    </div>
  );
}

function BodyContent({ slide, post, darkMode, direction }: { slide: BodySlide; post: RecapPost; darkMode: boolean; direction: number }) {
  return (
    <div
      className={`recap-body-slide recap-layout-${slide.layout}`}
      style={{ "--recap-visual-max-height": `${slide.visualMaxHeight}px` } as React.CSSProperties}
    >
      <div className="recap-notion-content">
        {slide.blockIds.map((blockId, index) => {
          const block = getBlockValue(post.recordMap, blockId);
          const isImage = block?.type === "image";
          const isVisual = isImage || ["video", "embed", "bookmark", "file", "pdf"].includes(block?.type);
          return (
            <motion.div
              className={`recap-rendered-block ${isVisual ? "is-visual" : "is-textual"}`}
              key={blockId}
              initial={isVisual ? { opacity: 0, scale: 0.9, y: 14 } : { opacity: 0, y: direction > 0 ? 30 : -30 }}
              animate={isVisual ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={isVisual ? { opacity: 0, scale: 0.96, y: -8 } : { opacity: 0, y: direction > 0 ? -24 : 24 }}
              transition={{ duration: isImage ? 0.48 : 0.34, delay: index * 0.065, ease: [0.22, 1, 0.36, 1] }}
            >
              <NotionRenderer
                recordMap={post.recordMap!}
                blockId={blockId}
                components={rendererComponents}
                fullPage={false}
                darkMode={darkMode}
                showTableOfContents={false}
                isImageZoomable={false}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}

function createPropertySlides(post: RecapPost): PropertySlide[] {
  return ["music", "watching", "reading"].flatMap((key) => {
    const items = post.properties[key] || [];
    return items.length ? [{ type: "property" as const, key, title: propertyMeta[key].title, items }] : [];
  });
}

function PickerOverlay({
  title,
  items,
  activeIndex,
  position,
  surfaceLayoutId,
  selectedTextLayoutId,
  onSelect,
  onClose,
}: {
  title: string;
  items: { label: string; detail?: string; target: number }[];
  activeIndex: number;
  position: "top" | "bottom";
  surfaceLayoutId: string;
  selectedTextLayoutId: string;
  onSelect: (target: number) => void;
  onClose: () => void;
}) {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [activeIndex]);

  return (
    <div className={`recap-picker recap-picker-${position}`} role="dialog" aria-modal="true" aria-label={title}>
      <motion.button type="button" className="recap-picker-backdrop" aria-label="선택 목록 닫기" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        layoutId={surfaceLayoutId}
        className="recap-picker-panel"
        transition={{ layout: { type: "spring", stiffness: 360, damping: 34 }, opacity: { duration: 0.18 } }}
      >
        <div className="recap-picker-heading"><span>{title}</span><button type="button" onClick={onClose} aria-label="닫기"><IonIcon name="close-outline" /></button></div>
        <div className="recap-picker-list">
          {items.map((item) => (
            <button
              type="button"
              ref={item.target === activeIndex ? activeItemRef : undefined}
              key={`${item.target}-${item.label}`}
              className={item.target === activeIndex ? "is-active" : ""}
              onClick={() => onSelect(item.target)}
            >
              <span>
                {item.target === activeIndex
                  ? <motion.strong layoutId={selectedTextLayoutId} transition={{ layout: { type: "spring", stiffness: 420, damping: 36 } }}>{item.label}</motion.strong>
                  : <strong>{item.label}</strong>}
                {item.detail && <small>{item.detail}</small>}
              </span>
              {item.target === activeIndex ? <IonIcon name="checkmark-circle" /> : <IonIcon name="chevron-forward-outline" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RecapHelpOverlay({ onClose }: { onClose: () => void }) {
  const [samplePage, setSamplePage] = useState(2);
  const [samplePaused, setSamplePaused] = useState(false);

  return (
    <motion.div
      layoutId="recap-help-surface"
      className="recap-help-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="월말결산 탐색 도움말"
      initial={{ opacity: 0, borderRadius: 999 }}
      animate={{ opacity: 1, borderRadius: 0 }}
      exit={{ opacity: 0, borderRadius: 999 }}
      transition={{ layout: { type: "spring", stiffness: 330, damping: 34 }, opacity: { duration: 0.18 } }}
    >
      <section className="recap-help-panel recap-help-tap-panel">
        <div className="recap-help-tap-demo">
          <button type="button" onClick={() => setSamplePage((current) => Math.max(1, current - 1))}>
            <motion.span animate={{ x: samplePage > 1 ? [0, -7, 0] : 0 }}><IonIcon name="chevron-back-outline" /></motion.span>
            <small>이전</small>
          </button>
          <button type="button" className="is-center" onClick={() => setSamplePaused((current) => !current)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={samplePaused ? "play" : "pause"} initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.72 }}>
                <IonIcon name={samplePaused ? "play" : "pause"} />
              </motion.span>
            </AnimatePresence>
            <small>{samplePaused ? "탭해서 자동 넘기기 시작" : "탭해서 멈추기"}</small>
          </button>
          <button type="button" onClick={() => setSamplePage((current) => Math.min(5, current + 1))}>
            <motion.span animate={{ x: samplePage < 5 ? [0, 7, 0] : 0 }}><IonIcon name="chevron-forward-outline" /></motion.span>
            <small>다음</small>
          </button>
        </div>
        <div className="recap-help-copy">
          <h2>월말결산, 이렇게<br />볼 수 있어요.</h2>
          <p>화면을 좌우로 스와이프하면<br />이전·다음 월말결산으로 이동합니다.</p>
        </div>
      </section>

      <div className="recap-help-footer">
        <button type="button" className="recap-help-confirm" onClick={onClose}>확인</button>
      </div>
    </motion.div>
  );
}

export function RecapViewer({ posts }: { posts: RecapPost[] }) {
  const [postIndex, setPostIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [bodySlides, setBodySlides] = useState<BodySlide[]>([]);
  const [recapData, setRecapData] = useState<Record<string, { sections: RecapSection[]; recordMap: any }>>({});
  const [loadError, setLoadError] = useState(false);
  const [direction, setDirection] = useState(1);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [propertyItemIndex, setPropertyItemIndex] = useState(0);
  const [documentVisible, setDocumentVisible] = useState(true);
  const progressRef = useRef(0);
  const propertyItemIndexRef = useRef(0);
  const progressMotion = useMotionValue(0);
  const blurredSceneScale = useTransform(progressMotion, [0, 1], [1.12, 1]);
  const fullSceneScale = useTransform(progressMotion, [0, 1], [1.065, 1]);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const darkMode = useDarkMode();
  const sourcePost = posts[postIndex];
  const loadedPost = sourcePost ? recapData[sourcePost.id] : undefined;
  const post = sourcePost ? { ...sourcePost, ...loadedPost } : undefined;

  const propertySlides = useMemo(() => post ? createPropertySlides(post) : [], [post?.id, post?.properties]);
  const slides: RecapSlide[] = useMemo(() => {
    const all: RecapSlide[] = post ? [{ type: "cover", title: "월말결산 표지" }, ...propertySlides, ...bodySlides] : [];
    return all.length ? all : [{ type: "empty", title: loadError ? "본문을 불러오지 못했어요." : "결산을 불러오는 중이에요." }];
  }, [post?.id, propertySlides, bodySlides, loadError]);
  const activeSlide = slides[Math.min(slideIndex, slides.length - 1)];
  const isCover = activeSlide.type === "cover";
  const coverGradient = useMemo(() => getTextGradient(post?.title || "recap"), [post?.title]);
  const coverTextColor = useMemo(() => getGradientTextColor(coverGradient), [coverGradient]);
  const activePropertyKey = activeSlide.type === "property" ? activeSlide.key : undefined;
  const activePropertyArtwork = activeSlide.type === "property"
    ? safeUrl((activeSlide.key === "music" ? activeSlide.items[propertyItemIndex] : undefined)?.artwork)
    || safeUrl(activeSlide.items.find((item) => safeUrl(item.artwork))?.artwork)
    : undefined;
  const activePropertyCount = activeSlide.type === "property" ? Math.min(activeSlide.items.length, 4) : undefined;
  const isWatchingSingleton = activeSlide.type === "property" && activeSlide.key === "watching" && activeSlide.items.length === 1;

  const sectionItems = useMemo(() => {
    const seen = new Set<string>();
    return slides.flatMap((slide, index) => {
      if (slide.type === "cover") return [];
      const key = slide.type === "property" ? `property-${slide.key}` : slide.type === "body" ? slide.sectionId : "empty";
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ label: slide.title, detail: slide.type === "body" && slide.continuation ? "계속" : undefined, target: index }];
    });
  }, [slides]);
  const activeSectionIndex = activeSlide.type === "body"
    ? (sectionItems.find((item) => {
      const target = slides[item.target];
      return target.type === "body" && target.sectionId === activeSlide.sectionId;
    })?.target ?? slideIndex)
    : slideIndex;

  const postItems = useMemo(() => posts.map((item, index) => ({
    label: item.title,
    target: index,
  })), [posts]);

  const classifyLayout = useCallback((elements: HTMLElement[], blockIds: string[]): BodyLayout => {
    const images = elements.flatMap((element) => Array.from(element.querySelectorAll<HTMLImageElement>("img")));
    if (!images.length) return "standard";
    const hasTextBlock = blockIds.some((blockId) => {
      const type = getBlockValue(post?.recordMap, blockId)?.type;
      return !["image", "video", "embed", "bookmark", "file", "pdf", "audio"].includes(type);
    });
    if (!hasTextBlock) return images.length === 1 ? "scrap" : "inline";
    const image = images[0];
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : image.clientWidth / Math.max(1, image.clientHeight);
    if (images.length === 1 && ratio >= 1.45 && elements.length <= 3) return "hero";
    if (images.length === 1 && ratio >= 0.72 && ratio < 1.45 && elements.length <= 3) return "scrap";
    return "inline";
  }, [post?.recordMap]);

  const paginateMeasuredBlocks = useCallback(() => {
    if (!post?.sections || !post.recordMap) return;
    const slideElement = document.querySelector<HTMLElement>(".recap-slide");
    const available = Math.max(240, (slideElement?.clientHeight || window.innerHeight - 220) - 36);
    const textHeightFactor = window.innerWidth < 640 ? 1.22 : window.innerWidth < 1200 ? 1.34 : 1.42;
    const nextSlides: BodySlide[] = [];

    post.sections.forEach((section) => {
      const sectionElement = document.querySelector(`[data-recap-section="${section.id}"]`);
      const blockElements = Array.from(sectionElement?.querySelectorAll<HTMLElement>("[data-recap-block]") || []);
      const sectionPages: { blockIds: string[]; elements: HTMLElement[]; used: number }[] = [];
      let currentIds: string[] = [];
      let currentElements: HTMLElement[] = [];
      let used = 0;

      const flush = () => {
        if (!currentIds.length) return;
        sectionPages.push({ blockIds: currentIds, elements: currentElements, used });
        currentIds = [];
        currentElements = [];
        used = 0;
      };

      section.blockIds.forEach((blockId, index) => {
        const element = blockElements[index];
        const hasVisual = !!element?.querySelector("img, .notion-asset-wrapper-image, video, iframe, .notion-bookmark, .notion-collection-card");
        const measured = element?.getBoundingClientRect().height || 96;
        const fittedHeight = hasVisual
          ? Math.max(available * 0.32, Math.min(measured + 20, available * 0.52))
          : measured * textHeightFactor + 16;
        if (currentIds.length && used + fittedHeight > available) flush();
        currentIds.push(blockId);
        if (element) currentElements.push(element);
        used += fittedHeight;
      });
      flush();

      if (window.innerWidth >= 768) {
        for (let index = sectionPages.length - 1; index >= 0; index -= 1) {
          const page = sectionPages[index];
          const types = page.blockIds.map((blockId) => getBlockValue(post.recordMap, blockId)?.type);
          const visualTypes = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
          const isVisualOnly = types.includes("image") && types.every((type) => visualTypes.has(type));
          if (!isVisualOnly || sectionPages.length === 1) continue;
          const nextPage = sectionPages[index + 1];
          const previousPage = sectionPages[index - 1];
          const target = [nextPage, previousPage].find((candidate) => {
            if (!candidate) return false;
            const combinedElements = candidate === nextPage
              ? [...page.elements, ...candidate.elements]
              : [...candidate.elements, ...page.elements];
            const combinedIds = candidate === nextPage
              ? [...page.blockIds, ...candidate.blockIds]
              : [...candidate.blockIds, ...page.blockIds];
            const combinedLayout = classifyLayout(combinedElements, combinedIds);
            return combinedLayout === "scrap" || combinedLayout === "inline"
              ? Math.max(candidate.used, page.used) <= available * 0.94
              : candidate.used + page.used <= available * 0.9;
          });
          if (!target) {
            const donor = nextPage?.blockIds.length > 1 ? nextPage : previousPage?.blockIds.length > 1 ? previousPage : undefined;
            if (!donor) continue;
            const donorIndexes = donor === nextPage
              ? donor.blockIds.map((_, donorIndex) => donorIndex)
              : donor.blockIds.map((_, donorIndex) => donorIndex).reverse();
            const textIndex = donorIndexes.find((donorIndex) => !visualTypes.has(getBlockValue(post.recordMap, donor.blockIds[donorIndex])?.type));
            if (textIndex === undefined) continue;
            const [textBlockId] = donor.blockIds.splice(textIndex, 1);
            const [textElement] = donor.elements.splice(textIndex, 1);
            const movedHeight = (textElement?.getBoundingClientRect().height || 96) * 1.12 + 14;
            donor.used = Math.max(0, donor.used - movedHeight);
            if (donor === nextPage) {
              page.blockIds.push(textBlockId);
              if (textElement) page.elements.push(textElement);
            } else {
              page.blockIds.unshift(textBlockId);
              if (textElement) page.elements.unshift(textElement);
            }
            page.used += movedHeight;
            continue;
          }
          if (target === nextPage) {
            target.blockIds.unshift(...page.blockIds);
            target.elements.unshift(...page.elements);
          } else {
            target.blockIds.push(...page.blockIds);
            target.elements.push(...page.elements);
          }
          target.used += page.used;
          sectionPages.splice(index, 1);
        }
      }

      if (!sectionPages.length) sectionPages.push({ blockIds: [], elements: [], used: 0 });
      sectionPages.forEach((page, index) => {
        const visualTypes = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
        const pageBlocks = page.blockIds.map((blockId, blockIndex) => ({
          type: getBlockValue(post.recordMap, blockId)?.type,
          element: page.elements[blockIndex],
        }));
        const visualCount = pageBlocks.filter((block) => visualTypes.has(block.type)).length;
        const textHeight = pageBlocks
          .filter((block) => !visualTypes.has(block.type))
          .reduce((height, block) => height + (block.element?.getBoundingClientRect().height || 0) * textHeightFactor + 16, 0);
        const remainingForVisuals = Math.max(130, available - textHeight - visualCount * 28 - Math.max(0, visualCount - 1) * 16);
        const visualMaxHeight = visualCount
          ? Math.max(130, Math.min(available * 0.5, remainingForVisuals / visualCount))
          : available;
        nextSlides.push({
          type: "body",
          sectionId: section.id,
          title: section.title,
          blockIds: page.blockIds,
          continuation: index > 0,
          layout: classifyLayout(page.elements, page.blockIds),
          visualMaxHeight,
        });
      });
    });

    const signature = (value: BodySlide[]) => value.map((item) => `${item.sectionId}:${item.blockIds.join(",")}:${item.layout}:${Math.round(item.visualMaxHeight)}`).join("|");
    setBodySlides((current) => signature(current) === signature(nextSlides) ? current : nextSlides);
  }, [classifyLayout, post?.id, post?.recordMap, post?.sections]);

  useEffect(() => {
    if (!sourcePost || recapData[sourcePost.id]) return;
    const controller = new AbortController();
    setLoadError(false);
    fetch(`/api/recap/${sourcePost.id}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load recap");
        return response.json();
      })
      .then((data) => setRecapData((current) => ({ ...current, [sourcePost.id]: data })))
      .catch((error) => { if (error.name !== "AbortError") setLoadError(true); });
    return () => controller.abort();
  }, [sourcePost?.id, !!(sourcePost && recapData[sourcePost.id])]);

  useEffect(() => {
    setSlideIndex(0);
    setBodySlides([]);
    setSectionPickerOpen(false);
    progressRef.current = 0;
    progressMotion.set(0);
  }, [post?.id]);

  useEffect(() => {
    if (!post?.recordMap) return;
    const measureRoot = document.querySelector<HTMLElement>(".recap-measurer");
    if (!measureRoot) return;
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paginateMeasuredBlocks);
    };
    const images = Array.from(measureRoot.querySelectorAll<HTMLImageElement>("img"));
    Promise.all(images.map((image) => image.complete ? image.decode?.().catch(() => undefined) : new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    }))).then(run);
    document.fonts?.ready.then(run);
    const observer = new ResizeObserver(run);
    observer.observe(measureRoot);
    window.addEventListener("resize", run);
    run();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", run);
    };
  }, [paginateMeasuredBlocks, post?.recordMap]);

  useEffect(() => {
    if (activeSlide.type !== "body") return;
    const bodySlideIndex = slideIndex - propertySlides.length - 1;
    if (bodySlideIndex < 0) return;
    let frame = 0;

    const splitOverflowingPage = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const content = document.querySelector<HTMLElement>(".recap-slide .recap-notion-content");
        if (!content || activeSlide.blockIds.length < 2) return;
        const children = Array.from(content.children) as HTMLElement[];
        const contentRect = content.getBoundingClientRect();
        const firstRect = children[0]?.getBoundingClientRect();
        const lastRect = children[children.length - 1]?.getBoundingClientRect();
        const overflows = content.scrollHeight > content.clientHeight + 4
          || !!firstRect && firstRect.top < contentRect.top - 4
          || !!lastRect && lastRect.bottom > contentRect.bottom - 8;
        if (!overflows) return;

        setBodySlides((current) => {
          const page = current[bodySlideIndex];
          if (!page || page.sectionId !== activeSlide.sectionId || page.blockIds.join("|") !== activeSlide.blockIds.join("|")) return current;
          const movedBlockId = page.blockIds[page.blockIds.length - 1];
          const shortenedPage = { ...page, blockIds: page.blockIds.slice(0, -1) };
          const nextPage = current[bodySlideIndex + 1];
          const next = [...current];
          next[bodySlideIndex] = shortenedPage;
          if (nextPage?.sectionId === page.sectionId) {
            next[bodySlideIndex + 1] = { ...nextPage, blockIds: [movedBlockId, ...nextPage.blockIds], continuation: true };
          } else {
            const movedType = getBlockValue(post.recordMap, movedBlockId)?.type;
            const visualTypes = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
            next.splice(bodySlideIndex + 1, 0, {
              ...page,
              blockIds: [movedBlockId],
              continuation: true,
              layout: visualTypes.has(movedType) ? "scrap" : "standard",
            });
          }
          return next;
        });
      });
    };

    const content = document.querySelector<HTMLElement>(".recap-slide .recap-notion-content");
    const observer = content ? new ResizeObserver(splitOverflowingPage) : undefined;
    if (content) observer?.observe(content);
    const images = Array.from(content?.querySelectorAll<HTMLImageElement>("img") || []);
    images.forEach((image) => image.addEventListener("load", splitOverflowingPage));
    splitOverflowingPage();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      images.forEach((image) => image.removeEventListener("load", splitOverflowingPage));
    };
  }, [activeSlide, post?.recordMap, propertySlides.length, slideIndex]);

  const selectPost = useCallback((index: number) => {
    setDirection(index >= postIndex ? 1 : -1);
    setPostIndex(index);
    setSlideIndex(0);
    setPostPickerOpen(false);
  }, [postIndex]);

  const changePost = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(posts.length - 1, postIndex + delta));
    if (next !== postIndex) selectPost(next);
  }, [postIndex, posts.length, selectPost]);

  const changeSlide = useCallback((delta: number) => {
    const next = slideIndex + delta;
    progressRef.current = 0;
    progressMotion.set(0);
    if (next < 0) return changePost(-1);
    if (next >= slides.length) return changePost(1);
    setDirection(delta);
    setSlideIndex(next);
  }, [changePost, slideIndex, slides.length]);

  useEffect(() => {
    progressRef.current = 0;
    progressMotion.set(0);
    propertyItemIndexRef.current = 0;
    setPropertyItemIndex(0);
  }, [post?.id, slideIndex, progressMotion]);

  useEffect(() => {
    setSlideIndex((current) => {
      const corrected = Math.max(0, Math.min(current, slides.length - 1));
      if (corrected !== current) {
        progressRef.current = 0;
        progressMotion.set(0);
      }
      return corrected;
    });
  }, [slides.length, progressMotion]);

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!autoplay || !documentVisible || sectionPickerOpen || postPickerOpen || helpOpen || !post || activeSlide.type === "empty") return;
    const duration = getSlideDuration(activeSlide, post);
    const startedAt = performance.now() - progressRef.current * duration;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      progressRef.current = progress;
      progressMotion.set(progress);
      if (activeSlide.type === "property" && activeSlide.key === "music" && activeSlide.items.length > 1) {
        const nextItemIndex = Math.min(activeSlide.items.length - 1, Math.floor(progress * activeSlide.items.length));
        if (nextItemIndex !== propertyItemIndexRef.current) {
          propertyItemIndexRef.current = nextItemIndex;
          setPropertyItemIndex(nextItemIndex);
        }
      }
      if (progress >= 1) changeSlide(1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeSlide, autoplay, changeSlide, documentVisible, helpOpen, post?.id, post?.recordMap, postPickerOpen, sectionPickerOpen, timerEpoch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSectionPickerOpen(false); setPostPickerOpen(false); setHelpOpen(false); }
      if (event.key === "ArrowLeft") changeSlide(-1);
      if (event.key === "ArrowRight") changeSlide(1);
      if (event.key === " ") { event.preventDefault(); setAutoplay((current) => !current); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeSlide]);

  if (!post) return <main className="recap-empty"><h1>표시할 월말결산이 없습니다.</h1><p>일지 카테고리의 게시물을 추가해 주세요.</p></main>;

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) return changePost(dx < 0 ? 1 : -1);
    if ((event.target as HTMLElement).closest("a, button, [role='button']")) return;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = event.clientX - bounds.left;
      if (position < bounds.width * 0.28) return changeSlide(-1);
      if (position > bounds.width * 0.72) return changeSlide(1);
      setAutoplay((current) => !current);
    }
  };

  return (
    <LayoutGroup id="recap-picker-morphs">
      <main
        className={`recap-shell ${isCover || activePropertyKey ? "has-recap-scene" : ""} ${isCover ? "has-cover-scene" : ""} ${activePropertyKey ? `has-property-scene recap-scene-${activePropertyKey} recap-scene-count-${activePropertyCount}` : ""}`}
        style={isCover ? {
          "--recap-cover-from": coverGradient.from,
          "--recap-cover-to": coverGradient.to,
          "--recap-cover-foreground": coverTextColor,
        } as React.CSSProperties : undefined}
      >
        <AnimatePresence mode="sync" initial={false}>
          {isCover && (
            <motion.div
              key={`${post.id}-cover`}
              className="recap-cover-background"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.025 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            ><span /><i /></motion.div>
          )}
          {activePropertyKey && (
            <motion.div
              key={`${post.id}-${activePropertyKey}-${activePropertyKey === "music" ? propertyItemIndex : "scene"}`}
              className={`recap-scene-background recap-scene-background-${activePropertyKey} ${activePropertyArtwork ? "has-artwork" : "is-gradient-only"}`}
              initial={{ opacity: 0, scale: 1.035 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.025 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              {activePropertyArtwork && (
                <motion.img
                  src={activePropertyArtwork}
                  alt=""
                  style={{ scale: isWatchingSingleton ? fullSceneScale : blurredSceneScale }}
                />
              )}
              <span className="recap-scene-color" />
              <span className="recap-scene-vignette" />
              <span className="recap-scene-grain" />
            </motion.div>
          )}
        </AnimatePresence>
        <section className="recap-stage" aria-live="polite" onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
          <div className="recap-progress" aria-label={`${slideIndex + 1} / ${slides.length} 페이지`}>
            {slides.map((slide, index) => (
              <button
                type="button"
                className="recap-progress-track"
                key={`${slide.type}-${slide.type === "cover" ? post.id : slide.type === "body" ? `${slide.sectionId}-${slide.blockIds.join("-")}` : slide.type === "property" ? slide.key : "empty"}`}
                aria-label={`${index + 1}페이지로 이동: ${slide.title}`}
                aria-current={index === slideIndex ? "step" : undefined}
                onClick={() => {
                  progressRef.current = 0;
                  progressMotion.set(0);
                  setTimerEpoch((current) => current + 1);
                  setDirection(index >= slideIndex ? 1 : -1);
                  setSlideIndex(index);
                }}
              >
                <motion.i style={{ scaleX: index < slideIndex ? 1 : index === slideIndex ? progressMotion : 0 }} />
              </button>
            ))}
          </div>
          <div className="recap-meta">
            <div className="recap-post-meta"><strong>{post.title}</strong></div>
            <div className="recap-section-selector-slot">
              {!isCover && !sectionPickerOpen && (
                <motion.button layoutId="recap-section-picker-surface" type="button" className="recap-section-selector" onClick={() => setSectionPickerOpen(true)}>
                  <motion.span layoutId="recap-section-picker-text">{activeSlide.title}</motion.span><IonIcon name="chevron-down-outline" />
                </motion.button>
              )}
            </div>
            <span className="recap-count">{slideIndex + 1} / {slides.length}</span>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article key={`${post.id}-${slideIndex}`} className="recap-slide" custom={direction} initial={{ opacity: 0, x: direction > 0 ? 28 : -28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }} transition={{ duration: 0.22, ease: "easeOut" }}>
              {activeSlide.type === "cover" && <CoverContent post={post} />}
              {activeSlide.type === "property" && <PropertyContent slide={activeSlide} activeMusicIndex={propertyItemIndex} />}
              {activeSlide.type === "body" && <BodyContent slide={activeSlide} post={post} darkMode={darkMode} direction={direction} />}
              {activeSlide.type === "empty" && <div className="recap-empty-slide"><IonIcon name="moon-outline" /><h1>{activeSlide.title}</h1></div>}
            </motion.article>
          </AnimatePresence>
        </section>

        <div className="recap-measurer" aria-hidden="true">
          {(post.sections || []).map((section) => <div key={section.id} data-recap-section={section.id}>{section.blockIds.map((blockId) => <div key={blockId} data-recap-block={blockId}>{post.recordMap && <NotionRenderer recordMap={post.recordMap} blockId={blockId} components={rendererComponents} fullPage={false} darkMode={darkMode} showTableOfContents={false} isImageZoomable={false} />}</div>)}</div>)}
        </div>

        <nav className="recap-toolbar" aria-label="월말결산 게시물 탐색">
          <button type="button" className="recap-round-control" aria-label="이전 게시물" disabled={postIndex === 0} onClick={() => changePost(-1)}><IonIcon name="chevron-back-outline" /></button>
          {!postPickerOpen ? (
            <motion.div layoutId="recap-post-picker-surface" className="recap-post-bubble">
              <button type="button" className="recap-post-selector" onClick={() => setPostPickerOpen(true)}><motion.span layoutId="recap-post-picker-text">{post.title}</motion.span><IonIcon name="chevron-up-outline" /></button>
              <button type="button" className="recap-autoplay-control" aria-label={autoplay ? "자동 넘김 일시정지" : "자동 넘김 재생"} onClick={() => setAutoplay((current) => !current)}><IonIcon name={autoplay ? "pause" : "play"} /></button>
            </motion.div>
          ) : <div className="recap-post-bubble-placeholder" />}
          <button type="button" className="recap-round-control" aria-label="다음 게시물" disabled={postIndex === posts.length - 1} onClick={() => changePost(1)}><IonIcon name="chevron-forward-outline" /></button>
        </nav>

        {!helpOpen && (
          <motion.button layoutId="recap-help-surface" type="button" className="recap-help-trigger" aria-label="월말결산 탐색 도움말" onClick={() => setHelpOpen(true)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}>
            <IonIcon name="help-outline" />
          </motion.button>
        )}

        <AnimatePresence>
          {sectionPickerOpen && <PickerOverlay title="섹션 선택" items={sectionItems} activeIndex={activeSectionIndex} position="top" surfaceLayoutId="recap-section-picker-surface" selectedTextLayoutId="recap-section-picker-text" onClose={() => setSectionPickerOpen(false)} onSelect={(target) => { progressRef.current = 0; progressMotion.set(0); setTimerEpoch((current) => current + 1); setDirection(target >= slideIndex ? 1 : -1); setSlideIndex(target); setSectionPickerOpen(false); }} />}
          {postPickerOpen && <PickerOverlay title="월말결산 선택" items={postItems} activeIndex={postIndex} position="bottom" surfaceLayoutId="recap-post-picker-surface" selectedTextLayoutId="recap-post-picker-text" onClose={() => setPostPickerOpen(false)} onSelect={selectPost} />}
          {helpOpen && <RecapHelpOverlay onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>
      </main>
    </LayoutGroup>
  );
}
