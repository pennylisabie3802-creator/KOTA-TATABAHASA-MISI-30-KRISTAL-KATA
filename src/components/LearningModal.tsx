import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  AKADEMI_PDF_URL,
  AKADEMI_SLIDES,
  LEARNING_TOPICS,
} from '../data/learningContent';
import { LIBRARY_CATEGORIES_INFO } from '../data/sideActivities';
import { LibraryCategoryId } from '../types/game';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface LearningModalProps {
  isOpen: boolean;
  initialCategory?: LibraryCategoryId | null;
  readCategories?: Record<string, boolean>;
  isOnMainMenu?: boolean;
  onSelectCategory?: (category: LibraryCategoryId) => void;
  onClose: () => void;
  onStartMission?: () => void;
}

type LearningViewTab = 'PERPUSTAKAAN_7_BUKU' | 'AKADEMI_SLIDES' | 'NOTA_BAB' | 'PDF_PENUH';

const BOOK_SPINE_STYLES: Record<
  LibraryCategoryId,
  { bg: string; border: string; badge: string; subtitle: string }
> = {
  ejaan: {
    bg: 'bg-[#3b1c63] hover:bg-[#4c2480]',
    border: 'border-[#facc15]',
    badge: 'Kitab #1',
    subtitle: 'Ejaan baku & kata pinjaman',
  },
  kata_sendi_nama: {
    bg: 'bg-[#133a5e] hover:bg-[#1a4d7c]',
    border: 'border-[#38bdf8]',
    badge: 'Kitab #2',
    subtitle: 'Penggunaan di, ke, dari & daripada',
  },
  imbuhan: {
    bg: 'bg-[#144536] hover:bg-[#1b5e49]',
    border: 'border-[#34d399]',
    badge: 'Kitab #3',
    subtitle: 'Awalan, akhiran & apitan tepat',
  },
  kata_majmuk: {
    bg: 'bg-[#542614] hover:bg-[#6e331b]',
    border: 'border-[#fbbf24]',
    badge: 'Kitab #4',
    subtitle: 'Bentuk terpisah & 15 kata mantap',
  },
  kata_ganda: {
    bg: 'bg-[#4f1940] hover:bg-[#692255]',
    border: 'border-[#f472b6]',
    badge: 'Kitab #5',
    subtitle: 'Kata ganda penuh & tanda sempang',
  },
  ayat_perintah: {
    bg: 'bg-[#3f2c11] hover:bg-[#573d18]',
    border: 'border-[#fde047]',
    badge: 'Kitab #6',
    subtitle: 'Suruhan, larangan, silaan & permintaan',
  },
  struktur_ayat: {
    bg: 'bg-[#1e2759] hover:bg-[#283578]',
    border: 'border-[#a78bfa]',
    badge: 'Kitab #7',
    subtitle: 'Subjek, predikat & binaan ayat gramatis',
  },
};

export const LearningModal: React.FC<LearningModalProps> = ({
  isOpen,
  initialCategory,
  readCategories = {},
  isOnMainMenu = false,
  onSelectCategory,
  onClose,
  onStartMission,
}) => {
  const [activeTab, setActiveTab] = useState<LearningViewTab>('PERPUSTAKAAN_7_BUKU');
  const [selectedBookCategory, setSelectedBookCategory] = useState<LibraryCategoryId>('ejaan');
  const [slidePage, setSlidePage] = useState<number>(1);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(LEARNING_TOPICS[0].id);

  // Sync with Perpustakaan Ajaib bookshelf category when opened from a shelf or main menu
  useEffect(() => {
    if (!isOpen) return;
    if (initialCategory) {
      const catInfo = LIBRARY_CATEGORIES_INFO.find((c) => c.id === initialCategory);
      if (catInfo) {
        setSelectedBookCategory(initialCategory);
        setSelectedTopicId(catInfo.topicId);
        setSlidePage(catInfo.slidePage);
        setActiveTab('PERPUSTAKAAN_7_BUKU');
      }
    }
  }, [isOpen, initialCategory]);

  // PDF.js document & canvas rendering states
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const slideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [renderingSlide, setRenderingSlide] = useState(false);

  // Load Akademi Kota Tatabahasa PDF once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadPdf = async () => {
      if (pdfDocRef.current) {
        setPdfLoaded(true);
        return;
      }
      try {
        setPdfError(false);
        const loadingTask = pdfjsLib.getDocument({ url: AKADEMI_PDF_URL });
        const doc = await loadingTask.promise;
        if (!cancelled) {
          pdfDocRef.current = doc;
          setPdfLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setPdfError(true);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Render active page onto `<canvas>` whenever `slidePage`, `pdfLoaded`, or `activeTab` changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'AKADEMI_SLIDES' || !pdfLoaded || !pdfDocRef.current) return;
    const canvas = slideCanvasRef.current;
    if (!canvas) return;

    let renderTask: pdfjsLib.RenderTask | null = null;
    let cancelled = false;

    const renderPage = async () => {
      try {
        setRenderingSlide(true);
        const page = await pdfDocRef.current!.getPage(slidePage);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 1280;
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderTask = page.render({
          canvasContext: ctx,
          canvas,
          viewport,
        });
        await renderTask.promise;
      } catch {
        // Ignore cancelled render tasks during rapid navigation
      } finally {
        if (!cancelled) {
          setRenderingSlide(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [isOpen, activeTab, pdfLoaded, slidePage]);

  // Keyboard Left/Right Arrow slide navigation when viewing Akademi Slides
  useEffect(() => {
    if (!isOpen || activeTab !== 'AKADEMI_SLIDES') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        soundEngine.playBookOpen();
        setSlidePage((p) => Math.min(AKADEMI_SLIDES.length, p + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        soundEngine.playBookOpen();
        setSlidePage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const activeSlideInfo =
    AKADEMI_SLIDES.find((s) => s.pageNumber === slidePage) ?? AKADEMI_SLIDES[0];
  const activeTopic =
    LEARNING_TOPICS.find((t) => t.id === selectedTopicId) ?? LEARNING_TOPICS[0];

  const activeBookMeta =
    LIBRARY_CATEGORIES_INFO.find((c) => c.id === selectedBookCategory) ??
    LIBRARY_CATEGORIES_INFO[0];
  const activeBookTopic =
    LEARNING_TOPICS.find((t) => t.id === activeBookMeta.topicId) ?? LEARNING_TOPICS[0];
  const activeBookSlide =
    AKADEMI_SLIDES.find((s) => s.pageNumber === activeBookMeta.slidePage) ?? AKADEMI_SLIDES[0];

  const handleOpenInteractiveBook = (catId: LibraryCategoryId) => {
    soundEngine.playBookOpen();
    setSelectedBookCategory(catId);
    const meta = LIBRARY_CATEGORIES_INFO.find((c) => c.id === catId);
    if (meta) {
      setSelectedTopicId(meta.topicId);
      setSlidePage(meta.slidePage);
    }
    onSelectCategory?.(catId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-6xl h-[94vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-[#231547] border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PixelPortrait mode="object" objectKind="magic_book" size={42} />
            <div>
              <h2 className="font-pixel font-bold text-lg sm:text-2xl text-[#fde047]">
                PERPUSTAKAAN DIGITAL · BAHAN PEMBELAJARAN
              </h2>
              <p className="text-xs text-[#e9d5ff]">
                7 Buku Interaktif Tatabahasa · Slaid Akademi Kota Tatabahasa · Nota Rujukan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={AKADEMI_PDF_URL}
              download="Akademi_Kota_Tatabahasa.pdf"
              onClick={() => soundEngine.playButtonClick()}
              className="px-3 py-2 pixel-btn-emerald font-pixel font-bold text-xs flex items-center gap-1.5 whitespace-nowrap"
              title="Muat Turun Fail PDF Akademi Kota Tatabahasa"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">MUAT TURUN PDF</span>
            </a>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="px-3.5 py-2 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isOnMainMenu ? 'KEMBALI KE MENU UTAMA' : 'KEMBALI'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              aria-label="Tutup Bahan Pembelajaran"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="px-3 sm:px-4 py-2 bg-[#1a0f35] border-b-2 border-[#4c3385] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('PERPUSTAKAAN_7_BUKU');
              }}
              className={`px-3 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'PERPUSTAKAAN_7_BUKU'
                  ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                  : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>7 Buku Kategori Utama</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('AKADEMI_SLIDES');
              }}
              className={`px-3 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'AKADEMI_SLIDES'
                  ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                  : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Slaid Akademi (12 Slaid)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('NOTA_BAB');
              }}
              className={`px-3 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'NOTA_BAB'
                  ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                  : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Nota Mendalam (Bab 1–8)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('PDF_PENUH');
              }}
              className={`px-3 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'PDF_PENUH'
                  ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                  : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dokumen PDF Penuh</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            TAB 0: PERPUSTAKAAN DIGITAL — 7 BUKU KATEGORI INTERAKTIF
            (Ejaan, Kata Sendi Nama, Imbuhan, Kata Majmuk, Kata Ganda, Ayat Perintah, Struktur Ayat)
           ============================================================ */}
        {activeTab === 'PERPUSTAKAAN_7_BUKU' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Shelf: 7 Interactive Pixel-Art Category Books */}
            <div className="md:col-span-4 bg-[#1b1036] border-b-2 md:border-b-0 md:border-r-2 border-[#4c3385] p-3 overflow-x-auto md:overflow-y-auto pixel-scroll flex md:flex-col gap-2">
              {LIBRARY_CATEGORIES_INFO.map((cat) => {
                const isSelected = cat.id === selectedBookCategory;
                const style = BOOK_SPINE_STYLES[cat.id];
                const isRead = Boolean(readCategories[cat.id]);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleOpenInteractiveBook(cat.id)}
                    className={`p-3 text-left border-2 transition-all cursor-pointer shrink-0 md:shrink flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#facc15] text-[#261505] border-[#4a2806] shadow-md'
                        : `${style.bg} text-white ${style.border}`
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#120a24]/60 border border-[#fde047]/60 flex items-center justify-center shrink-0">
                      <PixelPortrait mode="object" objectKind="magic_book" size={32} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-pixel font-bold text-[11px] ${
                            isSelected ? 'text-[#581c87]' : 'text-[#fde047]'
                          }`}
                        >
                          {style.badge}
                        </span>
                        {isRead && (
                          <span
                            className={`text-[11px] font-bold ${
                              isSelected ? 'text-[#15803d]' : 'text-[#86efac]'
                            }`}
                          >
                            ✓ Dibaca
                          </span>
                        )}
                      </div>
                      <div className="font-pixel font-bold text-sm sm:text-base truncate">
                        {cat.label}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          isSelected ? 'text-[#451a03]' : 'text-[#e9d5ff]'
                        }`}
                      >
                        {style.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Reading Desk: Interactive Open Book Pages */}
            <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto pixel-scroll bg-[#26184a] space-y-4">
              <div className="pixel-panel-parchment p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#d6c096] pb-3">
                  <div>
                    <div className="text-xs font-bold text-[#6d28d9]">
                      BUKU INTERAKTIF KATEGORI · {activeBookTopic.categoryMission}
                    </div>
                    <h3 className="font-pixel font-bold text-2xl sm:text-3xl text-[#261505] mt-0.5">
                      {activeBookMeta.label}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#581c87] mt-0.5">
                      {activeBookTopic.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBookOpen();
                      setSlidePage(activeBookMeta.slidePage);
                      setActiveTab('AKADEMI_SLIDES');
                    }}
                    className="px-3.5 py-2 pixel-btn-purple font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-4 h-4 text-[#fde047]" />
                    <span>LIHAT SLAID BERGAMBAR #{activeBookMeta.slidePage}</span>
                  </button>
                </div>

                {/* Penerangan Utama */}
                <div className="p-3.5 bg-[#fffbeb] border-2 border-[#d97706] space-y-1.5">
                  <div className="font-pixel font-bold text-sm text-[#7c2d12]">
                    Penerangan Konsep Bahasa:
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#291509] leading-relaxed">
                    {activeBookTopic.ringkasan}
                  </p>
                  <p className="text-xs font-semibold text-[#581c87] pt-1">
                    Inti Pati Slaid: {activeBookSlide.keyTakeaway}
                  </p>
                </div>

                {/* Peraturan Penting */}
                <div className="space-y-2">
                  <h4 className="font-pixel font-bold text-base text-[#581c87] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Panduan & Peraturan Penting:
                  </h4>
                  <ul className="space-y-2">
                    {activeBookTopic.peraturan.map((rule, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 bg-[#fef9c3] border border-[#eab308] text-xs sm:text-sm font-medium text-[#291509] flex items-start gap-2"
                      >
                        <Check className="w-4 h-4 text-[#15803d] shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contoh Penggunaan Bahasa */}
                <div className="space-y-2">
                  <h4 className="font-pixel font-bold text-base text-[#581c87]">
                    Contoh Penggunaan Bahasa (Salah Lawan Betul):
                  </h4>
                  <div className="space-y-2.5">
                    {activeBookTopic.contohSalahBetul.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border-2 border-[#c4b5fd] space-y-1.5 text-xs sm:text-sm"
                      >
                        <div className="text-[#b91c1c] font-bold">✗ Salah: {ex.salah}</div>
                        <div className="text-[#047857] font-extrabold">✓ Betul: {ex.betul}</div>
                        <div className="text-[#475569] text-xs font-medium pt-1 border-t border-slate-200">
                          Penerangan: {ex.huraian}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Return Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onClose();
                  }}
                  className="px-4 py-2.5 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>KEMBALI KE MENU UTAMA</span>
                </button>

                {onStartMission && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onStartMission();
                    }}
                    className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>MULA PENGEMBARAAN</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 1: SLAID INTERAKTIF AKADEMI KOTA TATABAHASA (12 HALAMAN)
           ============================================================ */}
        {activeTab === 'AKADEMI_SLIDES' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            <div className="md:col-span-3 bg-[#1b1036] border-b-2 md:border-b-0 md:border-r-2 border-[#4c3385] p-2.5 overflow-x-auto md:overflow-y-auto pixel-scroll flex md:flex-col gap-1.5">
              {AKADEMI_SLIDES.map((s) => {
                const isSelected = s.pageNumber === slidePage;
                return (
                  <button
                    key={s.pageNumber}
                    type="button"
                    onClick={() => {
                      soundEngine.playBookOpen();
                      setSlidePage(s.pageNumber);
                    }}
                    className={`px-3 py-2 text-left border-2 transition-colors cursor-pointer shrink-0 md:shrink ${
                      isSelected
                        ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                        : 'bg-[#2b1d52] text-[#f3e8ff] border-[#5b3ea8] hover:border-[#a78bfa]'
                    }`}
                  >
                    <div className="font-pixel font-bold text-xs sm:text-sm whitespace-nowrap md:whitespace-normal">
                      {s.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-9 p-3 sm:p-5 overflow-y-auto pixel-scroll bg-[#26184a] flex flex-col gap-4">
              <div className="relative w-full aspect-video bg-[#130b29] border-4 border-[#f6c445] shadow-lg overflow-hidden flex items-center justify-center">
                {!pdfError ? (
                  <>
                    <canvas
                      ref={slideCanvasRef}
                      className="w-full h-full object-contain"
                    />
                    {(!pdfLoaded || renderingSlide) && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-[#16122b]/90 border-2 border-[#facc15] font-pixel text-xs text-[#fde047]">
                        Memuatkan Slaid {slidePage}/12...
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center space-y-2 max-w-lg">
                    <Sparkles className="w-8 h-8 text-[#fde047] mx-auto" />
                    <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                      {activeSlideInfo.headline}
                    </h3>
                    <p className="text-sm text-[#f3e8ff]">{activeSlideInfo.keyTakeaway}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1b1036] p-3 border-2 border-[#5b3ea8]">
                <button
                  type="button"
                  disabled={slidePage <= 1}
                  onClick={() => {
                    soundEngine.playBookOpen();
                    setSlidePage((p) => Math.max(1, p - 1));
                  }}
                  className="px-4 py-2 pixel-btn-purple disabled:opacity-40 font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>SEBELUMNYA</span>
                </button>

                <div className="text-center">
                  <span className="font-mono-num font-bold text-sm text-[#fde047]">
                    Halaman {slidePage} / {AKADEMI_SLIDES.length}
                  </span>
                  <span className="hidden sm:inline text-xs text-[#cbd5e1] ml-2">
                    · {activeSlideInfo.headline}
                  </span>
                </div>

                {slidePage < AKADEMI_SLIDES.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBookOpen();
                      setSlidePage((p) => Math.min(AKADEMI_SLIDES.length, p + 1));
                    }}
                    className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{slidePage === 1 ? 'MULA BELAJAR' : 'SETERUSNYA'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playMissionUnlock();
                      if (onStartMission) {
                        onStartMission();
                      } else {
                        onClose();
                      }
                    }}
                    className="px-5 py-2 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>MULAKAN MISI 30 KRISTAL KATA</span>
                  </button>
                )}
              </div>

              <div className="pixel-panel-parchment p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-pixel font-bold text-base sm:text-lg text-[#581c87]">
                    Inti Pati Slaid {activeSlideInfo.pageNumber}: {activeSlideInfo.headline}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#291509] leading-relaxed">
                  {activeSlideInfo.keyTakeaway}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeSlideInfo.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-[#fef3c7] border border-[#d97706] text-xs font-bold text-[#451a03]"
                    >
                      ★ {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: NOTA RUJUKAN MENDALAM (BAB 1–8)
           ============================================================ */}
        {activeTab === 'NOTA_BAB' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            <div className="md:col-span-4 bg-[#1b1036] border-b-2 md:border-b-0 md:border-r-2 border-[#4c3385] p-3 overflow-y-auto pixel-scroll flex md:flex-col gap-2">
              {LEARNING_TOPICS.map((topic) => {
                const active = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playBookOpen();
                      setSelectedTopicId(topic.id);
                    }}
                    className={`p-3 text-left border-2 transition-colors cursor-pointer shrink-0 md:shrink ${
                      active
                        ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                        : 'bg-[#2b1d52] text-[#f3e8ff] border-[#5b3ea8] hover:border-[#a78bfa]'
                    }`}
                  >
                    <div className="text-xs font-pixel font-bold opacity-85">
                      {topic.chapter} · {topic.categoryMission}
                    </div>
                    <div className="font-body font-bold text-sm mt-0.5">{topic.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto pixel-scroll bg-[#281a4d] space-y-4">
              <div className="pixel-panel-parchment p-4 sm:p-5 space-y-4">
                <div className="border-b-2 border-[#d6c096] pb-3">
                  <span className="text-xs font-bold text-[#6d28d9]">
                    {activeTopic.chapter} · {activeTopic.categoryMission}
                  </span>
                  <h3 className="font-pixel font-bold text-xl sm:text-2xl text-[#261505] mt-0.5">
                    {activeTopic.title}
                  </h3>
                  <p className="text-sm font-medium text-[#451a03] mt-1 leading-relaxed">
                    {activeTopic.ringkasan}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-pixel font-bold text-base text-[#581c87] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Peraturan Penting Tatabahasa:
                  </h4>
                  <ul className="space-y-2">
                    {activeTopic.peraturan.map((rule, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 bg-[#fef9c3] border border-[#eab308] text-xs sm:text-sm font-medium text-[#291509] flex items-start gap-2"
                      >
                        <Check className="w-4 h-4 text-[#15803d] shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-pixel font-bold text-base text-[#581c87]">
                    Contoh Perbandingan Ayat:
                  </h4>
                  <div className="space-y-2.5">
                    {activeTopic.contohSalahBetul.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border-2 border-[#c4b5fd] space-y-1.5 text-xs sm:text-sm"
                      >
                        <div className="text-[#b91c1c] font-bold">✗ Salah: {ex.salah}</div>
                        <div className="text-[#047857] font-extrabold">✓ Betul: {ex.betul}</div>
                        <div className="text-[#475569] text-xs font-medium pt-1 border-t border-slate-200">
                          Nota: {ex.huraian}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: DOKUMEN PDF PENUH (EMBED LANGSUNG)
           ============================================================ */}
        {activeTab === 'PDF_PENUH' && (
          <div className="flex-1 bg-[#140c29] p-3 flex flex-col gap-2 overflow-hidden">
            <object
              data={AKADEMI_PDF_URL}
              type="application/pdf"
              className="w-full flex-1 border-3 border-[#f6c445] bg-white"
            >
              <div className="p-8 text-center space-y-4 text-[#fff8e7]">
                <p className="text-sm font-semibold">
                  Pelayar peranti ini tidak memaparkan pratonton PDF terbenam secara langsung. Anda
                  boleh melihat kesemua 12 halaman menerusi tab{' '}
                  <strong>Slaid Akademi Kota Tatabahasa</strong> atau memuat turun fail PDF di
                  bawah:
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('AKADEMI_SLIDES')}
                    className="px-4 py-2.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                  >
                    BUKA SLAID INTERAKTIF (1–12)
                  </button>
                  <a
                    href={AKADEMI_PDF_URL}
                    download="Akademi_Kota_Tatabahasa.pdf"
                    className="px-4 py-2.5 pixel-btn-emerald font-pixel font-bold text-xs"
                  >
                    MUAT TURUN FAIL PDF
                  </a>
                </div>
              </div>
            </object>
          </div>
        )}
      </div>
    </div>
  );
};
