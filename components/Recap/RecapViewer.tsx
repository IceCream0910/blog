import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IonIcon from "@reacticons/ionicons";
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { NotionRenderer } from "../../packages/notionx";
import { Code, Collection, Equation, Modal } from "../../utils/notion-components";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getGradientTextColor, getTextGradient } from "../../utils/text-gradient";

type RecapItem = Record<string, string>;
type MusicMetadata = {
  id: string;
  title?: string;
  artist?: string;
  artwork?: string;
  preview?: string;
  url?: string;
};
type RecapSection = { id: string; title: string; blockIds: string[] };
type NarrationSegment = { text: string; start: number; end: number; chunkSeq?: number };
type NarrationBlock = { hash: string; text: string; duration: number; audioUrl: string; segments: NarrationSegment[] };
type NarrationManifest = { pageId: string; status: string; blocks: Record<string, NarrationBlock> };
type RecapPost = {
  id: string;
  title: string;
  date: string;
  properties: Record<string, RecapItem[]>;
  sections?: RecapSection[];
  recordMap?: any;
  narration?: NarrationManifest;
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
const MUSIC_FADE_OUT_LEAD_MS = 2600;

function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function firstText(source: any, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeMusicMetadata(id: string, payload: any): MusicMetadata {
  const resource = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload || {};
  const source = resource?.attributes && typeof resource.attributes === "object" ? resource.attributes : resource;
  const album = source.album && typeof source.album === "object" ? source.album : {};
  const artists = Array.isArray(source.artists) ? source.artists.map((artist: any) => typeof artist === "string" ? artist : artist?.name).filter(Boolean).join(", ") : undefined;
  const albumImages = Array.isArray(album.images) ? album.images : [];
  const albumArtwork = albumImages.find((image: any) => typeof image?.url === "string")?.url;
  const artwork = firstText(source, ["albumart", "albumArt", "album_art", "artwork", "cover", "image"]) || source.artwork?.url || albumArtwork;
  return {
    id,
    title: firstText(source, ["title", "name", "trackName", "track_name"]),
    artist: firstText(source, ["artist", "artistName", "artist_name"]) || artists,
    artwork: artwork?.replace("{w}x{h}", "900x900"),
    preview: firstText(source, ["preview", "previewUrl", "preview_url", "audioPreviewUrl", "audio_preview_url"]) || source.previews?.find((item: any) => typeof item?.url === "string")?.url,
    url: firstText(source, ["url", "externalUrl", "external_url", "spotifyUrl", "spotify_url"]),
  };
}

function enrichMusicItem(item: RecapItem, musicById: Record<string, MusicMetadata>): RecapItem {
  const id = item.id?.trim();
  const metadata = id ? musicById[id] : undefined;
  return metadata ? { ...item, ...Object.fromEntries(Object.entries(metadata).filter(([, value]) => typeof value === "string" && value)) } : item;
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

function markdownLinkLabels(text: string) {
  return text.replace(/!?\[([^\]]+)]\((?:\\.|[^)])+\)/g, "$1");
}

function getBlockPlainText(recordMap: any, blockId: string, visited = new Set<string>()): string {
  if (visited.has(blockId)) return "";
  visited.add(blockId);
  const block = getBlockValue(recordMap, blockId);
  const text = (block?.properties?.title || []).map((part: any[]) => {
    const rawText = String(part?.[0] || "");
    const decorations = Array.isArray(part?.[1]) ? part[1] : [];
    const pageLink = decorations.find((decorator: any[]) => decorator?.[0] === "p");
    const externalBlockLink = decorations.find((decorator: any[]) => decorator?.[0] === "‣");
    const linkMention = decorations.find((decorator: any[]) => decorator?.[0] === "lm");
    const linkedBlockId = pageLink?.[1]
      || (Array.isArray(externalBlockLink?.[1]) && externalBlockLink[1][0] !== "u" ? externalBlockLink[1][1] : undefined);
    if (linkedBlockId) {
      const linkedTitle = getBlockPlainText(recordMap, String(linkedBlockId), visited);
      if (linkedTitle) return linkedTitle;
    }
    if (typeof linkMention?.[1]?.title === "string" && linkMention[1].title.trim()) return linkMention[1].title.trim();
    return rawText;
  }).join("");
  visited.delete(blockId);
  return markdownLinkLabels(text).trim();
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

function getSlideDuration(slide: RecapSlide, post: RecapPost, soundEnabled: boolean) {
  if (slide.type === "cover") return 6200;
  if (slide.type === "property") {
    if (slide.key === "music") return Math.min(90000, Math.max(5200, slide.items.length * (soundEnabled ? 10000 : 4800)));
    return Math.min(11000, 3800 + slide.items.length * 1100);
  }
  if (slide.type === "body") {
    const stats = slide.blockIds.reduce((total, blockId) => {
      const value = getBlockStats(post.recordMap, blockId);
      return { characters: total.characters + value.characters, media: total.media + value.media };
    }, { characters: 0, media: 0 });
    const isImageOnly = slide.blockIds.length > 0 && slide.blockIds.every((blockId) => {
      const block = getBlockValue(post.recordMap, blockId);
      return block?.type === "image" && getBlockStats(post.recordMap, blockId).characters === 0;
    });
    if (isImageOnly) return Math.min(2000, 2000 + Math.max(0, stats.media - 1) * 450);
    return Math.max(4800, Math.min(16000, 4200 + stats.characters * 28 + stats.media * 2200));
  }
  return 5000;
}

function CoverContent({ post, animationReady }: { post: RecapPost; animationReady: boolean }) {
  const month = new Date(post.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  const copyVariants = {
    hidden: { opacity: 0, y: 18, filter: "blur(5px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  };
  return (
    <motion.div
      className="recap-cover"
      initial="hidden"
      animate={animationReady ? "visible" : "hidden"}
      variants={{ visible: { transition: { delayChildren: 0.18, staggerChildren: 0.52 } } }}
    >
      <motion.span className="recap-cover-eyebrow" variants={copyVariants} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}>
        MONTHLY RECAP
      </motion.span>
      <motion.h1 variants={copyVariants} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}>
        {post.title}
      </motion.h1>
      <motion.p variants={copyVariants} transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}>
        {month}의 일들과 생각을 모아봤어요.
      </motion.p>
    </motion.div>
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

function MusicContent({ slide, activeIndex, musicById, onToggleAutoplay }: { slide: PropertySlide; activeIndex: number; musicById: Record<string, MusicMetadata>; onToggleAutoplay: () => void }) {
  const items = useMemo(() => slide.items.map((item) => enrichMusicItem(item, musicById)), [musicById, slide.items]);
  const count = Math.max(1, items.length);
  const currentIndex = Math.min(activeIndex, count - 1);
  const currentItem = items[currentIndex] || {};
  const details = (
    <>
      <strong>{currentItem.title || `music ${currentIndex + 1}`}</strong>
      {currentItem.artist && <small>{currentItem.artist}</small>}
    </>
  );

  return (
    <div className={`recap-property recap-property-music recap-music-player recap-music-count-${Math.min(count, 5)}`}>
      <div className="recap-music-stack" aria-hidden="true">
        {items.map((item, index) => {
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
        <motion.div
          key={`${currentIndex}-details`}
          className="recap-music-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >{details}</motion.div>
      </AnimatePresence>
    </div>
  );
}

function recapIntroUrl(postId?: string) {
  let hash = 5381;
  for (const character of postId || "") hash = (hash * 33) ^ character.charCodeAt(0);
  return `/recap_intro${((hash >>> 0) % 4) + 1}.mp3`;
}

function muteIfAutoplayBlocked(error: unknown, mute: () => void) {
  if ((error as { name?: string } | undefined)?.name === "NotAllowedError") mute();
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

function PropertyContent({ slide, activeMusicIndex, musicById, onToggleAutoplay }: { slide: PropertySlide; activeMusicIndex: number; musicById: Record<string, MusicMetadata>; onToggleAutoplay: () => void }) {
  if (slide.key === "music") return <MusicContent slide={slide} activeIndex={activeMusicIndex} musicById={musicById} onToggleAutoplay={onToggleAutoplay} />;
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

const KARAOKE_LEAD_SECONDS = 0.12;

function narrationMatchKey(text: string) {
  return markdownLinkLabels(text).normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function alignNarrationSegments(sourceText: string, narration: NarrationBlock): NarrationSegment[] {
  const segments = narration.segments.length ? narration.segments : [{ text: narration.text, start: 0, end: narration.duration }];
  if (!sourceText) return segments;

  let normalizedSource = "";
  const sourceIndexes: number[] = [];
  for (let index = 0; index < sourceText.length;) {
    const codePoint = sourceText.codePointAt(index);
    const character = codePoint === undefined ? "" : String.fromCodePoint(codePoint);
    const normalized = narrationMatchKey(character);
    normalizedSource += normalized;
    for (let offset = 0; offset < normalized.length; offset += 1) sourceIndexes.push(index);
    index += character.length || 1;
  }

  let normalizedCursor = 0;
  const matches: number[] = [];
  const allMatched = segments.every((segment) => {
    const key = narrationMatchKey(segment.text);
    const match = key ? normalizedSource.indexOf(key, normalizedCursor) : -1;
    if (match < 0) return false;
    matches.push(sourceIndexes[match] ?? 0);
    normalizedCursor = match + key.length;
    return true;
  });

  if (allMatched && matches.length === segments.length) {
    return segments.map((segment, index) => ({
      ...segment,
      text: sourceText.slice(index === 0 ? 0 : matches[index], index + 1 < matches.length ? matches[index + 1] : sourceText.length),
    }));
  }

  const weights = segments.map((segment) => Math.max(1, narrationMatchKey(segment.text).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let sourceCursor = 0;
  let elapsedWeight = 0;
  return segments.map((segment, index) => {
    elapsedWeight += weights[index];
    const end = index === segments.length - 1 ? sourceText.length : Math.round(sourceText.length * elapsedWeight / totalWeight);
    const text = sourceText.slice(sourceCursor, end);
    sourceCursor = end;
    return { ...segment, text };
  });
}

function ActiveNarrationSegment({ segment, narrationTime }: { segment: NarrationSegment; narrationTime: MotionValue<number> }) {
  const duration = Math.max(0.01, segment.end - segment.start);
  const progress = useTransform(narrationTime, (time) => Math.max(0, Math.min(1, (time + KARAOKE_LEAD_SECONDS - segment.start) / duration)));
  const backgroundPosition = useTransform(progress, (value) => `${100 - value * 100}% 0%`);
  const opacity = useTransform(progress, [0, 0.08, 1], [0.32, 1, 1]);
  const emphasisTarget = useTransform(progress, [0, 0.14, 0.82, 1], [0, 1, 1, 0]);
  const emphasis = useSpring(emphasisTarget, { stiffness: 180, damping: 24, mass: 0.58 });
  const y = useTransform(emphasis, [0, 1], [0, -1]);
  const scale = useTransform(emphasis, [0, 1], [1, 1.025]);
  return <motion.span className="is-live" style={{ backgroundPosition, opacity, y, scale }}>{segment.text}</motion.span>;
}

function NarratedText({ narration, sourceText, state, narrationTime }: { narration: NarrationBlock; sourceText: string; state: "past" | "active" | "upcoming"; narrationTime: MotionValue<number> }) {
  const segments = useMemo(() => alignNarrationSegments(sourceText, narration), [narration, sourceText]);
  return (
    <p className={`recap-narrated-text is-${state}`} aria-label={sourceText || narration.text}>
      {segments.map((segment, index) => {
        const key = `${narration.hash}-${segment.start}-${index}`;
        if (state === "active") return <ActiveNarrationSegment key={key} segment={segment} narrationTime={narrationTime} />;
        return <span key={key} className={state === "past" ? "is-past" : "is-upcoming"} style={{ backgroundPosition: state === "past" ? "0% 0%" : "100% 0%", opacity: state === "past" ? 1 : 0.32 }}>{segment.text}</span>;
      })}
    </p>
  );
}

function BodyContent({ slide, post, darkMode, direction, narrationEnabled, narratingBlockId, pastNarrationBlockIds, narrationTime }: { slide: BodySlide; post: RecapPost; darkMode: boolean; direction: number; narrationEnabled: boolean; narratingBlockId?: string; pastNarrationBlockIds: string[]; narrationTime: MotionValue<number> }) {
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
          const blockNarration = post.narration?.blocks[blockId];
          const renderNarratedText = narrationEnabled && !isVisual && !!blockNarration;
          const isNarrating = renderNarratedText && blockId === narratingBlockId;
          const narrationState = isNarrating ? "active" : pastNarrationBlockIds.includes(blockId) ? "past" : "upcoming";
          return (
            <motion.div
              className={`recap-rendered-block ${isVisual ? "is-visual" : "is-textual"} ${renderNarratedText ? "is-narration-component" : ""} ${isNarrating ? "is-narrating" : renderNarratedText ? "is-narration-idle" : ""}`}
              key={blockId}
              initial={isVisual ? { opacity: 0, scale: 0.9, y: 14 } : { opacity: 0, y: direction > 0 ? 30 : -30 }}
              animate={isVisual ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={isVisual ? { opacity: 0, scale: 0.96, y: -8 } : { opacity: 0, y: direction > 0 ? -24 : 24 }}
              transition={{ duration: isImage ? 0.48 : 0.34, delay: index * 0.065, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderNarratedText ? (
                <NarratedText key={blockNarration.hash} narration={blockNarration} sourceText={getBlockPlainText(post.recordMap, blockId) || blockNarration.text} state={narrationState} narrationTime={narrationTime} />
              ) : (
                <NotionRenderer
                  recordMap={post.recordMap!}
                  blockId={blockId}
                  components={rendererComponents}
                  fullPage={false}
                  darkMode={darkMode}
                  showTableOfContents={false}
                  isImageZoomable={false}
                />
              )}
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
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item.target);
              }}
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
  const [sampleSoundEnabled, setSampleSoundEnabled] = useState(true);
  const [page, setPage] = useState(0);
  const [pageDirection, setPageDirection] = useState(1);
  const goToPage = (next: number) => {
    const target = Math.max(0, Math.min(2, next));
    if (target === page) return;
    setPageDirection(target > page ? 1 : -1);
    setPage(target);
  };

  const helpDots = (
    <div className="recap-help-dots" aria-label={`${page + 1} / 3 도움말 페이지`}>
      {[0, 1, 2].map((index) => (
        <button type="button" key={index} className={index === page ? "is-active" : ""} aria-label={`${index + 1}번째 도움말`} aria-current={index === page ? "step" : undefined} onClick={() => goToPage(index)} />
      ))}
    </div>
  );

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
      <div className="recap-help-viewport">
        <AnimatePresence mode="wait" initial={false} custom={pageDirection}>
          <motion.section
            key={page}
            className="recap-help-panel"
            custom={pageDirection}
            initial={{ opacity: 0, x: pageDirection > 0 ? 46 : -46 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageDirection > 0 ? -46 : 46 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 64) goToPage(page + (info.offset.x < 0 ? 1 : -1)); }}
          >
            {page === 0 && (
              <>
                <div className="recap-help-tap-demo">
                  <button type="button" onClick={() => setSamplePage((current) => Math.max(1, current - 1))}>
                    <motion.span animate={{ x: samplePage > 1 ? [0, -7, 0] : 0 }}><IonIcon name="chevron-back-outline" /></motion.span><small>이전 페이지</small>
                  </button>
                  <button type="button" className="is-center" onClick={() => setSamplePaused((current) => !current)}>
                    <AnimatePresence mode="wait" initial={false}><motion.span key={samplePaused ? "play" : "pause"} initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.72 }}><IonIcon name={samplePaused ? "play" : "pause"} /></motion.span></AnimatePresence>
                    <small>{samplePaused ? "자동 넘기기 시작" : "자동 넘기기 멈춤"}</small>
                  </button>
                  <button type="button" onClick={() => setSamplePage((current) => Math.min(5, current + 1))}>
                    <motion.span animate={{ x: samplePage < 5 ? [0, 7, 0] : 0 }}><IonIcon name="chevron-forward-outline" /></motion.span><small>다음 페이지</small>
                  </button>
                </div>
                <div className="recap-help-copy">{helpDots}<h2>한 페이지씩 보거나<br />자동으로 감상</h2><p>화면 좌/우 끝 부분이나 하단의 화살표 버튼을 눌러 페이지를 이동하고, 화면 가운데나 하단의 재생/일시정지 버튼을 눌러 자동 넘김을 설정할 수 있습니다.</p></div>
              </>
            )}
            {page === 1 && (
              <>
                <div className="recap-help-month-demo">
                  <motion.article className="recap-help-month-card is-before" animate={{ x: [0, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}><small>지난 기록</small><strong>06</strong></motion.article>
                  <motion.article className="recap-help-month-card is-current" animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 3.2, repeat: Infinity }}><small>지금 보고 있는</small><strong>07</strong></motion.article>
                  <motion.article className="recap-help-month-card is-after" animate={{ x: [0, 10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}><small>다음 기록</small><strong>08</strong></motion.article>
                  <motion.span className="recap-help-swipe-hand" animate={{ x: [-54, 54, -54] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}><IonIcon name="hand-left-outline" /></motion.span>
                </div>
                <div className="recap-help-copy">{helpDots}<h2>좌우로 밀어<br />다른 달로 탐색</h2><p>화면을 좌우로 스와이프하면<br />이전·다음 월말결산으로 이동합니다.</p></div>
              </>
            )}
            {page === 2 && (
              <>
                <div className="recap-help-sound-demo">
                  <button type="button" className={`recap-help-sound-toggle ${sampleSoundEnabled ? "is-active" : ""}`} onClick={() => setSampleSoundEnabled((current) => !current)} aria-label="샘플 소리 모드 전환"><IonIcon name={sampleSoundEnabled ? "volume-high-outline" : "volume-mute-outline"} /></button>
                  <div className={`recap-help-narration-sample ${sampleSoundEnabled ? "is-playing" : "is-muted"}`}>
                    <span className="is-past">지금 읽고 있는 부분이 강조되고</span>
                    <span>남은 문장은 흐리게 표시돼요</span>
                  </div>
                </div>
                <div className="recap-help-copy">{helpDots}<h2>소리를 켜서<br />더 몰입감 있게</h2><p>하단 볼륨 버튼으로 소리를 켜고 끌 수 있고,<br />우측 하단 화살표를 눌러 문장을 이동할 수 있습니다.</p></div>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

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
  const [bodySlidesReady, setBodySlidesReady] = useState(false);
  const [recapData, setRecapData] = useState<Record<string, { sections: RecapSection[]; recordMap: any; narration?: NarrationManifest }>>({});
  const [loadError, setLoadError] = useState(false);
  const [direction, setDirection] = useState(1);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [narrationQueueIndex, setNarrationQueueIndex] = useState(0);
  const narrationTime = useMotionValue(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRef = useRef(autoplay);
  const autoplayBeforeHelpRef = useRef(false);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [propertyItemIndex, setPropertyItemIndex] = useState(0);
  const [musicFadingOut, setMusicFadingOut] = useState(false);
  const [musicById, setMusicById] = useState<Record<string, MusicMetadata>>({});
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
  const musicIds = useMemo(() => Array.from(new Set((post?.properties.music || [])
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id)))), [post?.id, post?.properties.music]);
  const slides: RecapSlide[] = useMemo(() => {
    const bodyPending = Boolean(post?.recordMap && post.sections?.length && !bodySlidesReady);
    const all: RecapSlide[] = post ? [
      { type: "cover", title: "월말결산 표지" },
      ...propertySlides,
      ...bodySlides,
      ...(bodyPending ? [{ type: "empty", title: "본문 이미지를 준비하고 있어요." } as EmptySlide] : []),
    ] : [];
    return all.length ? all : [{ type: "empty", title: loadError ? "본문을 불러오지 못했어요." : "결산을 불러오는 중이에요." }];
  }, [post?.id, post?.recordMap, post?.sections, propertySlides, bodySlides, bodySlidesReady, loadError]);
  const activeSlide = slides[Math.min(slideIndex, slides.length - 1)];
  useEffect(() => {
    if (!musicIds.length) return;
    const controller = new AbortController();
    Promise.all(musicIds.map(async (id) => {
      const response = await fetch(`https://yuntae.in/api/music/song/${encodeURIComponent(id)}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Music metadata unavailable (${response.status})`);
      return normalizeMusicMetadata(id, await response.json());
    })).then((metadata) => {
      if (!controller.signal.aborted) {
        setMusicById((current) => ({ ...current, ...Object.fromEntries(metadata.map((item) => [item.id, item])) }));
      }
    }).catch((error) => {
      if (error?.name !== "AbortError") console.warn("Failed to load music metadata", error);
    });
    return () => controller.abort();
  }, [musicIds]);
  const narrationQueue = useMemo(() => activeSlide?.type === "body"
    ? activeSlide.blockIds.flatMap((blockId) => post?.narration?.blocks[blockId] ? [{ blockId, ...post.narration.blocks[blockId] }] : [])
    : [], [activeSlide, post?.narration]);
  const activeNarration = narrationQueue[narrationQueueIndex];
  const pastNarrationBlockIds = useMemo(() => soundEnabled
    ? narrationQueue.slice(0, narrationQueueIndex).map((item) => item.blockId)
    : [], [soundEnabled, narrationQueue, narrationQueueIndex]);
  const isCover = activeSlide.type === "cover";
  const coverReady = Boolean(loadedPost) || loadError;
  const introUrl = useMemo(() => recapIntroUrl(post?.id), [post?.id]);
  const coverGradient = useMemo(() => getTextGradient(post?.title || "recap"), [post?.title]);
  const coverTextColor = useMemo(() => getGradientTextColor(coverGradient), [coverGradient]);
  const activePropertyKey = activeSlide.type === "property" ? activeSlide.key : undefined;
  const activeMusicItem = activeSlide.type === "property" && activeSlide.key === "music"
    ? enrichMusicItem(activeSlide.items[propertyItemIndex] || {}, musicById)
    : undefined;
  const musicSlideIndex = slides.findIndex((slide) => slide.type === "property" && slide.key === "music");
  const continuingMusicItem = musicSlideIndex >= 0 && slideIndex > musicSlideIndex && activeSlide.type === "property"
    ? enrichMusicItem((slides[musicSlideIndex] as PropertySlide).items.at(-1) || {}, musicById)
    : undefined;
  const musicPlaybackItem = activeMusicItem || continuingMusicItem;
  const musicPreview = safeUrl(musicPlaybackItem?.preview);
  const nextSlideStartsBody = slides[slideIndex + 1]?.type === "body";
  const activePropertyArtwork = activeSlide.type === "property"
    ? safeUrl(activeMusicItem?.artwork)
    || safeUrl(activeSlide.items.find((item) => safeUrl(item.artwork))?.artwork)
    : undefined;
  const activePropertyCount = activeSlide.type === "property" ? Math.min(activeSlide.items.length, 4) : undefined;
  const isWatchingSingleton = activeSlide.type === "property" && activeSlide.key === "watching" && activeSlide.items.length === 1;

  useEffect(() => () => {
    [audioRef.current, introAudioRef.current, musicAudioRef.current].forEach((audio) => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  useEffect(() => {
    const fade = (audio: HTMLAudioElement, target: number, duration: number, complete?: () => void) => {
      const initial = Math.max(0, Math.min(1, audio.volume));
      const safeTarget = Math.max(0, Math.min(1, target));
      const startedAt = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        audio.volume = Math.max(0, Math.min(1, initial + (safeTarget - initial) * progress));
        if (progress < 1) frame = requestAnimationFrame(tick);
        else complete?.();
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    };
    const audio = musicAudioRef.current || new Audio();
    musicAudioRef.current = audio;
    audio.preload = "auto";
    let cancelFade = () => { };
    if (!musicPreview || musicFadingOut || !soundEnabled || !autoplay) {
      cancelFade = fade(audio, 0, 220, () => { audio.pause(); audio.volume = 1; });
    } else if (audio.src !== musicPreview) {
      cancelFade = fade(audio, 0, 220, () => {
        audio.pause();
        audio.src = musicPreview;
        audio.currentTime = 0;
        audio.volume = 0;
        audio.play().then(() => { cancelFade = fade(audio, 1, 320); }).catch((error) => muteIfAutoplayBlocked(error, () => setSoundEnabled(false)));
      });
    } else {
      audio.play().then(() => { cancelFade = fade(audio, 1, 180); }).catch((error) => muteIfAutoplayBlocked(error, () => setSoundEnabled(false)));
    }
    return () => {
      cancelFade();
    };
  }, [autoplay, musicFadingOut, musicPreview, soundEnabled]);

  useEffect(() => {
    const audio = introAudioRef.current;
    if (!isCover || !coverReady || !soundEnabled || !autoplay) {
      if (!audio || audio.paused) return;
      const initialVolume = Math.max(0, Math.min(1, audio.volume));
      const startedAt = performance.now();
      let frame = 0;
      const fadeOut = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / 520);
        audio.volume = initialVolume * (1 - progress);
        if (progress < 1) frame = requestAnimationFrame(fadeOut);
        else {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = initialVolume;
        }
      };
      frame = requestAnimationFrame(fadeOut);
      return () => cancelAnimationFrame(frame);
    }
    const introAudio = audio || new Audio();
    introAudioRef.current = introAudio;
    introAudio.preload = "auto";
    introAudio.src = introUrl;
    introAudio.volume = 0.86;
    introAudio.currentTime = 0;
    introAudio.play().catch((error) => muteIfAutoplayBlocked(error, () => setSoundEnabled(false)));
  }, [autoplay, coverReady, introUrl, isCover, soundEnabled]);

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
    const pageBudget = available * (window.innerWidth < 640 ? 0.76 : window.innerWidth < 1200 ? 0.79 : 0.82);
    const textHeightFactor = window.innerWidth < 640 ? 1.22 : window.innerWidth < 1200 ? 1.34 : 1.42;
    const narrationHeightFactor = window.innerWidth < 640 ? 1.16 : 1.12;
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
        const isNarrationMeasure = element?.hasAttribute("data-recap-narration-measure") || false;
        const fittedHeight = hasVisual
          ? Math.max(pageBudget * 0.34, Math.min(measured + 28, pageBudget * 0.58))
          : measured * (isNarrationMeasure ? narrationHeightFactor : textHeightFactor) + (isNarrationMeasure ? 30 : 22);
        if (currentIds.length && used + fittedHeight > pageBudget) flush();
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
              ? Math.max(candidate.used, page.used) <= pageBudget * 0.88
              : candidate.used + page.used <= pageBudget * 0.84;
          });
          if (!target) {
            const donor = nextPage?.blockIds.length > 1 ? nextPage : previousPage?.blockIds.length > 1 ? previousPage : undefined;
            if (!donor) continue;
            const donorIndexes = donor === nextPage
              ? donor.blockIds.map((_, donorIndex) => donorIndex)
              : donor.blockIds.map((_, donorIndex) => donorIndex).reverse();
            const textIndex = donorIndexes.find((donorIndex) => !visualTypes.has(getBlockValue(post.recordMap, donor.blockIds[donorIndex])?.type));
            if (textIndex === undefined) continue;
            const textElement = donor.elements[textIndex];
            const movedHeight = (textElement?.getBoundingClientRect().height || 96)
              * (textElement?.hasAttribute("data-recap-narration-measure") ? narrationHeightFactor : 1.12)
              + (textElement?.hasAttribute("data-recap-narration-measure") ? 30 : 22);
            if (page.used + movedHeight > pageBudget * 0.84) continue;
            const [textBlockId] = donor.blockIds.splice(textIndex, 1);
            donor.elements.splice(textIndex, 1);
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
          .reduce((height, block) => {
            const element = block.element;
            const isNarrationMeasure = element?.hasAttribute("data-recap-narration-measure") || false;
            const factor = isNarrationMeasure ? narrationHeightFactor : textHeightFactor;
            return height + (element?.getBoundingClientRect().height || 0) * factor + (isNarrationMeasure ? 30 : 22);
          }, 0);
        const remainingForVisuals = Math.max(130, pageBudget - textHeight - visualCount * 32 - Math.max(0, visualCount - 1) * 20);
        const visualMaxHeight = visualCount
          ? Math.max(130, Math.min(pageBudget * 0.52, remainingForVisuals / visualCount))
          : pageBudget;
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
    setBodySlidesReady(true);
  }, [classifyLayout, post?.id, post?.narration, post?.recordMap, post?.sections]);

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
    setBodySlidesReady(false);
    setSectionPickerOpen(false);
    progressRef.current = 0;
    progressMotion.set(0);
  }, [post?.id]);

  useEffect(() => {
    if (!post?.recordMap) return;
    const measureRoot = document.querySelector<HTMLElement>(".recap-measurer");
    if (!measureRoot) return;
    let frame = 0;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paginateMeasuredBlocks);
    };
    const images = Array.from(measureRoot.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((image) => {
      image.loading = "eager";
      image.fetchPriority = "low";
    });
    const imageReady = (image: HTMLImageElement) => {
      if (image.complete) return image.decode?.().catch(() => undefined) || Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => image.decode?.().catch(() => undefined).finally(resolve) || resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    };
    Promise.all([
      Promise.all(images.map(imageReady)),
      document.fonts?.ready || Promise.resolve(),
    ]).then(() => {
      run();
      if (!cancelled) window.addEventListener("resize", run);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", run);
    };
  }, [paginateMeasuredBlocks, post?.recordMap]);

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

  const narrationNavigationActive = soundEnabled && activeSlide.type === "body" && narrationQueue.length > 0;
  const openHelp = useCallback(() => {
    autoplayBeforeHelpRef.current = autoplay;
    if (autoplay) setAutoplay(false);
    setHelpOpen(true);
  }, [autoplay]);
  const closeHelp = useCallback(() => {
    const shouldResume = autoplayBeforeHelpRef.current;
    autoplayBeforeHelpRef.current = false;
    setHelpOpen(false);
    if (shouldResume) setAutoplay(true);
  }, []);
  const navigateFromToolbar = useCallback((delta: number) => {
    if (narrationNavigationActive) {
      const next = narrationQueueIndex + delta;
      if (next >= 0 && next < narrationQueue.length) {
        audioRef.current?.pause();
        narrationTime.set(0);
        setNarrationQueueIndex(next);
        return;
      }
    }
    changeSlide(delta);
  }, [changeSlide, narrationNavigationActive, narrationQueue.length, narrationQueueIndex, narrationTime]);
  const previousNavigatesSentence = narrationNavigationActive && narrationQueueIndex > 0;
  const nextNavigatesSentence = narrationNavigationActive && narrationQueueIndex < narrationQueue.length - 1;
  const previousNavigationDisabled = !previousNavigatesSentence && slideIndex === 0 && postIndex === 0;
  const nextNavigationDisabled = !nextNavigatesSentence && slideIndex === slides.length - 1 && postIndex === posts.length - 1;

  const selectSection = useCallback((target: number) => {
    if (!Number.isInteger(target) || target < 0 || target >= slides.length || !slides[target]) return;
    audioRef.current?.pause();
    narrationTime.set(0);
    setNarrationQueueIndex(0);
    progressRef.current = 0;
    progressMotion.set(0);
    setTimerEpoch((current) => current + 1);
    setDirection(target >= slideIndex ? 1 : -1);
    setSlideIndex(target);
    setSectionPickerOpen(false);
  }, [narrationTime, progressMotion, slideIndex, slides]);

  useEffect(() => {
    progressRef.current = 0;
    progressMotion.set(0);
    propertyItemIndexRef.current = 0;
    setPropertyItemIndex(0);
    setMusicFadingOut(false);
  }, [post?.id, slideIndex, progressMotion]);

  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

  useEffect(() => {
    setNarrationQueueIndex(0);
    narrationTime.set(0);
    audioRef.current?.pause();
  }, [post?.id, slideIndex]);

  useEffect(() => {
    if (!soundEnabled || !activeNarration) return;
    const audio = audioRef.current || new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    audio.src = activeNarration.audioUrl;
    audio.currentTime = 0;
    narrationTime.set(0);
    let frame = 0;
    const update = () => {
      const current = audio.currentTime;
      narrationTime.set(current);
      const elapsed = narrationQueue.slice(0, narrationQueueIndex).reduce((sum, item) => sum + item.duration, 0) + current;
      const total = narrationQueue.reduce((sum, item) => sum + item.duration, 0);
      if (total > 0) {
        progressRef.current = Math.min(1, elapsed / total);
        progressMotion.set(progressRef.current);
      }
    };
    const tick = () => {
      update();
      if (!audio.paused && !audio.ended) frame = requestAnimationFrame(tick);
    };
    const startTick = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stopTick = () => cancelAnimationFrame(frame);
    const ended = () => {
      stopTick();
      narrationTime.set(0);
      if (narrationQueueIndex < narrationQueue.length - 1) setNarrationQueueIndex((current) => current + 1);
      else changeSlide(1);
    };
    audio.addEventListener("play", startTick);
    audio.addEventListener("pause", stopTick);
    audio.addEventListener("ended", ended);
    audio.load();
    if (autoplayRef.current) audio.play().catch((error) => muteIfAutoplayBlocked(error, () => setSoundEnabled(false)));
    return () => {
      audio.pause();
      stopTick();
      audio.removeEventListener("play", startTick);
      audio.removeEventListener("pause", stopTick);
      audio.removeEventListener("ended", ended);
    };
  }, [activeNarration?.audioUrl, changeSlide, narrationQueue, narrationQueueIndex, narrationTime, progressMotion, soundEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !soundEnabled || !activeNarration) return;
    if (autoplay) audio.play().catch((error) => muteIfAutoplayBlocked(error, () => setSoundEnabled(false)));
    else audio.pause();
  }, [activeNarration, autoplay, soundEnabled]);

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
    if (activeSlide.type === "cover" && !coverReady) return;
    if (soundEnabled && activeSlide.type === "body" && narrationQueue.length) return;
    const duration = getSlideDuration(activeSlide, post, soundEnabled);
    const startedAt = performance.now() - progressRef.current * duration;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      progressRef.current = progress;
      progressMotion.set(progress);
      if (activeSlide.type === "property" && activeSlide.key === "music") {
        const nextItemIndex = activeSlide.items.length > 1
          ? Math.min(activeSlide.items.length - 1, Math.floor(progress * activeSlide.items.length))
          : 0;
        if (nextItemIndex !== propertyItemIndexRef.current) {
          propertyItemIndexRef.current = nextItemIndex;
          setPropertyItemIndex(nextItemIndex);
        }
        if (nextSlideStartsBody && nextItemIndex === activeSlide.items.length - 1 && progress >= 1 - MUSIC_FADE_OUT_LEAD_MS / duration) {
          setMusicFadingOut(true);
        }
      }
      if (progress >= 1) changeSlide(1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeSlide, autoplay, changeSlide, coverReady, documentVisible, helpOpen, narrationQueue.length, nextSlideStartsBody, post?.id, post?.recordMap, postPickerOpen, sectionPickerOpen, soundEnabled, timerEpoch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSectionPickerOpen(false); setPostPickerOpen(false); closeHelp(); }
      if (event.key === "ArrowLeft") navigateFromToolbar(-1);
      if (event.key === "ArrowRight") navigateFromToolbar(1);
      if (event.key === " ") { event.preventDefault(); setAutoplay((current) => !current); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeHelp, navigateFromToolbar]);

  if (!post) return <main className="recap-empty"><h1>표시할 월말결산이 없습니다.</h1><p>일지 카테고리의 게시물을 추가해 주세요.</p></main>;

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) return changePost(dx < 0 ? 1 : -1);
    if ((event.target as HTMLElement).closest("a, button, [role='button'], input, select, textarea, .recap-picker, .recap-help-overlay")) return;
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
        className={`recap-shell ${isCover || activePropertyKey ? "has-recap-scene" : ""} ${isCover ? "has-cover-scene" : ""} ${soundEnabled ? "has-narration" : ""} ${activePropertyKey ? `has-property-scene recap-scene-${activePropertyKey} recap-scene-count-${activePropertyCount}` : ""}`}
        style={isCover ? {
          "--recap-cover-from": coverGradient.from,
          "--recap-cover-to": coverGradient.to,
          "--recap-cover-foreground": coverTextColor,
        } as React.CSSProperties : undefined}
        onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerStart.current = null; }}
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
        <section className="recap-stage" aria-live="polite">
          <div className="recap-header">
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
              <span className="recap-count">{slideIndex + 1} / {slides.length}
                {!helpOpen && <motion.button layoutId="recap-help-surface" type="button" className="recap-toolbar-help" aria-label="월말결산 탐색 도움말" onClick={openHelp} initial={false} animate={{ borderRadius: 999 }} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}><IonIcon name="help-circle-outline" style={{ position: 'relative', top: '1px' }} /></motion.button>}

              </span>

            </div>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article key={`${post.id}-${slideIndex}`} className="recap-slide" custom={direction} initial={{ opacity: 0, x: direction > 0 ? 28 : -28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }} transition={{ duration: 0.22, ease: "easeOut" }}>
              {activeSlide.type === "cover" && <CoverContent post={post} animationReady={coverReady} />}
              {activeSlide.type === "property" && <PropertyContent slide={activeSlide} activeMusicIndex={propertyItemIndex} musicById={musicById} onToggleAutoplay={() => setAutoplay((current) => !current)} />}
              {activeSlide.type === "body" && <BodyContent slide={activeSlide} post={post} darkMode={darkMode} direction={direction} narrationEnabled={soundEnabled} narratingBlockId={soundEnabled ? activeNarration?.blockId : undefined} pastNarrationBlockIds={pastNarrationBlockIds} narrationTime={narrationTime} />}
              {activeSlide.type === "empty" && <div className="recap-empty-slide"><IonIcon name="moon-outline" /><h1>{activeSlide.title}</h1></div>}
            </motion.article>
          </AnimatePresence>
        </section>

        <div className="recap-measurer" aria-hidden="true">
          {(post.sections || []).map((section) => (
            <div key={section.id} data-recap-section={section.id}>
              {section.blockIds.map((blockId) => {
                const block = getBlockValue(post.recordMap, blockId);
                const isVisual = ["image", "video", "embed", "bookmark", "file", "pdf"].includes(block?.type);
                const blockNarration = post.narration?.blocks[blockId];
                const measureNarration = !isVisual && !!blockNarration;
                return (
                  <div
                    key={blockId}
                    data-recap-block={blockId}
                    data-recap-narration-measure={measureNarration ? "true" : undefined}
                  >
                    {measureNarration ? (
                      <NarratedText
                        narration={blockNarration}
                        sourceText={getBlockPlainText(post.recordMap, blockId) || blockNarration.text}
                        state="upcoming"
                        narrationTime={narrationTime}
                      />
                    ) : post.recordMap && (
                      <NotionRenderer
                        recordMap={post.recordMap}
                        blockId={blockId}
                        components={rendererComponents}
                        fullPage={false}
                        darkMode={darkMode}
                        showTableOfContents={false}
                        isImageZoomable={false}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <nav className="recap-toolbar" aria-label="월말결산 게시물 탐색">
          <div className="recap-toolbar-primary">
            <button
              type="button"
              className={`recap-round-control recap-narration-control ${soundEnabled ? "is-active" : ""}`}
              aria-label={soundEnabled ? "recap 소리 끄기" : "recap 소리 켜기"}
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((current) => !current)}
            ><IonIcon name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"} /></button>
            {!postPickerOpen ? (
              <motion.div layoutId="recap-post-picker-surface" className="recap-post-bubble">
                <button type="button" className="recap-post-selector" onClick={() => setPostPickerOpen(true)}><motion.span layoutId="recap-post-picker-text">{post.title}</motion.span><IonIcon name="chevron-up-outline" /></button>
              </motion.div>
            ) : <div className="recap-post-bubble-placeholder" />}
          </div>

          <div className="recap-toolbar-actions">
            <button type="button" className="recap-round-control" aria-label={previousNavigatesSentence ? "이전 문장" : "이전 페이지"} disabled={previousNavigationDisabled} onClick={() => navigateFromToolbar(-1)}><IonIcon name="chevron-back-outline" /></button>
            <button type="button" className="recap-round-control recap-toolbar-autoplay" aria-label={autoplay ? "자동 넘김 일시정지" : "자동 넘김 재생"} aria-pressed={autoplay} onClick={() => setAutoplay((current) => !current)}><IonIcon name={autoplay ? "pause" : "play"} /></button>
            <button type="button" className="recap-round-control" aria-label={nextNavigatesSentence ? "다음 문장" : "다음 페이지"} disabled={nextNavigationDisabled} onClick={() => navigateFromToolbar(1)}><IonIcon name="chevron-forward-outline" /></button>
          </div>
        </nav>

        <AnimatePresence>
          {sectionPickerOpen && <PickerOverlay title="섹션 선택" items={sectionItems} activeIndex={activeSectionIndex} position="top" surfaceLayoutId="recap-section-picker-surface" selectedTextLayoutId="recap-section-picker-text" onClose={() => setSectionPickerOpen(false)} onSelect={selectSection} />}
          {postPickerOpen && <PickerOverlay title="월말결산 선택" items={postItems} activeIndex={postIndex} position="bottom" surfaceLayoutId="recap-post-picker-surface" selectedTextLayoutId="recap-post-picker-text" onClose={() => setPostPickerOpen(false)} onSelect={selectPost} />}
          {helpOpen && <RecapHelpOverlay onClose={closeHelp} />}
        </AnimatePresence>
      </main>
    </LayoutGroup>
  );
}
