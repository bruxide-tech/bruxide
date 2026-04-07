import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  Download, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Layout as LayoutIcon, 
  Trash2, 
  Check,
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Sparkles,
  Save,
  Star,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toJpeg, toPng } from 'html-to-image';
import { cn } from './lib/utils';
import { 
  Design, 
  Preset,
  CanvasSize, 
  CANVAS_SIZES, 
  ACCENT_COLORS, 
  AccentColor, 
  LayoutType 
} from './types';

const STORAGE_KEY = 'quickpost_designs';
const PRESETS_KEY = 'quickpost_presets';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

export default function App() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'jpg' | 'png'>('png');
  const [exportQuality, setExportQuality] = useState<'high' | 'medium'>('high');
  const [activeTool, setActiveTool] = useState<'text' | 'image' | 'color' | 'layout' | 'presets' | 'gradient' | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  // Load designs and presets from localStorage
  useEffect(() => {
    const savedDesigns = localStorage.getItem(STORAGE_KEY);
    if (savedDesigns) {
      try {
        setDesigns(JSON.parse(savedDesigns));
      } catch (e) {
        console.error('Failed to parse saved designs', e);
      }
    }

    const savedPresets = localStorage.getItem(PRESETS_KEY);
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to parse saved presets', e);
      }
    }
  }, []);

  // Save designs and presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [designs, presets]);

  const DEFAULT_FILTERS = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0
  };

  const DEFAULT_GRADIENT = {
    color: '#ffffff',
    opacity: 95,
    height: 100
  };

  const createNewDesign = (size: CanvasSize) => {
    const newDesign: Design = {
      id: generateId(),
      name: 'Untitled Design',
      size,
      layout: 'news',
      subheading: 'Subheading Text Goes Here',
      description: 'A short description paragraph that provides more context to the news or announcement being shared.',
      category: 'CATEGORY',
      imageUrl: null,
      imageFilters: DEFAULT_FILTERS,
      gradient: DEFAULT_GRADIENT,
      accentColor: 'red',
      lastModified: Date.now(),
    };
    setCurrentDesign(newDesign);
    setDesigns([newDesign, ...designs]);
  };

  const updateDesign = (updates: Partial<Design>) => {
    if (!currentDesign) return;
    const updated = { ...currentDesign, ...updates, lastModified: Date.now() };
    setCurrentDesign(updated);
    setDesigns(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const savePreset = (name: string) => {
    if (!currentDesign) return;
    const newPreset: Preset = {
      id: generateId(),
      name,
      settings: {
        layout: currentDesign.layout,
        accentColor: currentDesign.accentColor,
        imageFilters: currentDesign.imageFilters,
        gradient: currentDesign.gradient,
      }
    };
    setPresets([newPreset, ...presets]);
  };

  const applyPreset = (preset: Preset) => {
    if (!currentDesign) return;
    updateDesign(preset.settings);
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const deleteDesign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simplified deletion without confirm for better iframe compatibility
    setDesigns(prev => prev.filter(d => d.id !== id));
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    
    const scale = exportQuality === 'high' ? 2 : 1;
    const options = {
      pixelRatio: scale,
      quality: 1,
    };

    try {
      let dataUrl;
      if (exportFormat === 'png') {
        dataUrl = await toPng(canvasRef.current, options);
      } else {
        dataUrl = await toJpeg(canvasRef.current, options);
      }

      const link = document.createElement('a');
      link.download = `${currentDesign?.name || 'design'}.${exportFormat}`;
      link.href = dataUrl;
      link.click();
      setIsExporting(false);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file?.name, file?.size, file?.type);
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Please select an image under 10MB.');
        return;
      }
      
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('File read successfully');
        const result = event.target?.result as string;
        updateDesign({ imageUrl: result });
        setImageZoom(1);
        setImagePosition({ x: 50, y: 50 });
        setError(null);
        setIsUploading(false);
      };
      reader.onerror = (err) => {
        console.error('FileReader error:', err);
        setError('Failed to read the image file. Please try another one.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorData, setGeneratorData] = useState({
    subheading: '',
    description: '',
    size: 'instagram' as CanvasSize,
    imageUrl: null as string | null
  });

  const handleGeneratorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDesign: Design = {
      id: generateId(),
      name: generatorData.subheading || 'Generated Design',
      size: generatorData.size,
      layout: 'news',
      subheading: generatorData.subheading || 'Subheading Text',
      description: generatorData.description || 'Description paragraph text...',
      category: 'NEWS',
      imageUrl: generatorData.imageUrl,
      imageFilters: DEFAULT_FILTERS,
      gradient: DEFAULT_GRADIENT,
      accentColor: 'red',
      lastModified: Date.now(),
    };
    setCurrentDesign(newDesign);
    setDesigns([newDesign, ...designs]);
    setIsGeneratorOpen(false);
    setGeneratorData({ subheading: '', description: '', size: 'instagram', imageUrl: null });
  };

  if (currentDesign) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentDesign(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <input 
              type="text" 
              value={currentDesign.name}
              onChange={(e) => updateDesign({ name: e.target.value })}
              className="font-semibold text-lg bg-transparent border-none focus:ring-0 w-48"
            />
          </div>
          <button 
            onClick={() => setIsExporting(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
        </header>

        {/* Editor Layout Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas Area */}
          <main className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-200 relative">
            <div 
              className="shadow-2xl bg-white origin-center"
              style={{
                width: '100%',
                maxWidth: '80vh',
                aspectRatio: `${CANVAS_SIZES[currentDesign.size].width} / ${CANVAS_SIZES[currentDesign.size].height}`,
              }}
            >
              <div 
                ref={canvasRef}
                className="w-full h-full relative overflow-hidden bg-gray-900"
                style={{
                  aspectRatio: `${CANVAS_SIZES[currentDesign.size].width} / ${CANVAS_SIZES[currentDesign.size].height}`,
                }}
              >
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0 group/canvas">
                  {/* Bulletproof Canvas Input - Covers entire canvas */}
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  {currentDesign.imageUrl ? (
                    <div className="w-full h-full relative overflow-hidden">
                      <img 
                        src={currentDesign.imageUrl} 
                        alt="Design" 
                        className="absolute w-full h-full object-cover transition-transform duration-200"
                        style={{ 
                          transform: `scale(${imageZoom})`,
                          objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                          filter: currentDesign.imageFilters ? `brightness(${currentDesign.imageFilters.brightness}%) contrast(${currentDesign.imageFilters.contrast}%) saturate(${currentDesign.imageFilters.saturation}%) blur(${currentDesign.imageFilters.blur}px) grayscale(${currentDesign.imageFilters.grayscale}%) sepia(${currentDesign.imageFilters.sepia}%)` : 'none'
                        }}
                        referrerPolicy="no-referrer"
                      />
                      {/* Gradient Overlay for Text Readability */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-t" 
                        style={{ 
                          backgroundImage: `linear-gradient(to top, ${currentDesign.gradient?.color || '#ffffff'}${Math.round(((currentDesign.gradient?.opacity || 95) / 100) * 255).toString(16).padStart(2, '0')}, transparent ${currentDesign.gradient?.height || 100}%)`
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black/0 group-hover/canvas:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover/canvas:opacity-100 z-10">
                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                          <Upload className="w-4 h-4" />
                          Change Image
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-3 bg-gray-800 group-hover/canvas:bg-gray-700 transition-colors">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shadow-inner">
                        <Upload className="w-8 h-8 opacity-40" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold opacity-40 uppercase tracking-widest block">Click to Upload Background</span>
                        <span className="text-[10px] opacity-30 uppercase tracking-tighter">JPG or PNG up to 10MB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Overlay Layer */}
                <div className="absolute inset-0 z-10 p-12 pointer-events-none flex flex-col">
                  {/* Top Left: Category Label */}
                  <div className="flex justify-start items-start mb-auto">
                    <div 
                      className={cn(
                        "px-4 py-1 text-[10px] font-black tracking-[0.2em] uppercase inline-block cursor-pointer pointer-events-auto hover:ring-2 transition-all",
                        focusedField === 'category' ? "ring-2 ring-gray-900" : "hover:ring-gray-400"
                      )}
                      style={{ 
                        backgroundColor: ACCENT_COLORS[currentDesign.accentColor], 
                        color: currentDesign.accentColor === 'white' ? 'black' : 'white' 
                      }}
                      onClick={() => {
                        setActiveTool('text');
                        setFocusedField('category');
                      }}
                    >
                      {currentDesign.category}
                    </div>
                  </div>

                  {/* Bottom Area: Subheading & Description */}
                  <div className={cn(
                    "flex flex-col gap-6 max-w-full",
                    currentDesign.layout === 'announcement' ? "items-center text-center" : "items-start text-left"
                  )}>
                    <div className="space-y-3">
                      <h2 
                        className={cn(
                          "text-gray-900 font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:ring-2 transition-all rounded-lg p-2 -ml-2",
                          currentDesign.layout === 'event' ? "border-l-8 pl-6 py-2" : "border-b-4 pb-3",
                          focusedField === 'subheading' ? "ring-2 ring-gray-900" : "hover:ring-gray-200"
                        )} 
                        style={{ borderColor: ACCENT_COLORS[currentDesign.accentColor], fontSize: 'clamp(1.25rem, 3vw, 2rem)' }}
                        onClick={() => {
                          setActiveTool('text');
                          setFocusedField('subheading');
                        }}
                      >
                        {currentDesign.subheading}
                      </h2>

                      <p 
                        className={cn(
                          "text-gray-700 leading-tight max-w-2xl cursor-pointer pointer-events-auto hover:ring-2 transition-all rounded-lg p-2 -ml-2",
                          currentDesign.layout === 'promotion' ? "font-black text-gray-900 uppercase tracking-tight" : "font-medium",
                          focusedField === 'description' ? "ring-2 ring-gray-900" : "hover:ring-gray-200"
                        )} 
                        style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
                        onClick={() => {
                          setActiveTool('text');
                          setFocusedField('description');
                        }}
                      >
                        {currentDesign.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar Tool Panels */}
          <AnimatePresence>
            {activeTool && (
              <motion.aside 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-96 bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 capitalize text-lg">{activeTool} Settings</h3>
                  <button onClick={() => { setActiveTool(null); setFocusedField(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {activeTool === 'text' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Field to Edit</label>
                        {focusedField && (
                          <button 
                            onClick={() => setFocusedField(null)}
                            className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                          >
                            Show All
                          </button>
                        )}
                      </div>

                      {(!focusedField || focusedField === 'subheading') && (
                        <div className={cn("transition-all", focusedField === 'subheading' ? "scale-100" : "hover:bg-gray-50 p-2 -m-2 rounded-xl cursor-pointer")} onClick={() => setFocusedField('subheading')}>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Subheading</label>
                          <input 
                            type="text" 
                            autoFocus={focusedField === 'subheading'}
                            value={currentDesign.subheading}
                            onChange={(e) => updateDesign({ subheading: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      )}

                      {(!focusedField || focusedField === 'description') && (
                        <div className={cn("transition-all", focusedField === 'description' ? "scale-100" : "hover:bg-gray-50 p-2 -m-2 rounded-xl cursor-pointer")} onClick={() => setFocusedField('description')}>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
                          <textarea 
                            rows={focusedField === 'description' ? 6 : 3}
                            autoFocus={focusedField === 'description'}
                            value={currentDesign.description}
                            onChange={(e) => updateDesign({ description: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition-all"
                          />
                        </div>
                      )}

                      {(!focusedField || focusedField === 'category') && (
                        <div className={cn("transition-all", focusedField === 'category' ? "scale-100" : "hover:bg-gray-50 p-2 -m-2 rounded-xl cursor-pointer")} onClick={() => setFocusedField('category')}>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Category</label>
                          <input 
                            type="text" 
                            autoFocus={focusedField === 'category'}
                            value={currentDesign.category}
                            onChange={(e) => updateDesign({ category: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTool === 'image' && (
                    <div className="space-y-8">
                      {/* Bulletproof Upload Button */}
                      <div className="relative w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-10 bg-gray-50 hover:bg-red-50 hover:border-red-200 transition-all group overflow-hidden">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <div className="flex flex-col items-center gap-3 z-10 pointer-events-none">
                          <div className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                            {isUploading ? (
                              <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-7 h-7 text-red-500" />
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold text-gray-700 block">
                              {isUploading ? 'Uploading...' : 'Change Background'}
                            </span>
                            <span className="text-xs text-gray-400">JPG, PNG up to 10MB</span>
                          </div>
                        </div>
                      </div>

                      {currentDesign.imageUrl && (
                        <div className="space-y-8">
                          <div className="space-y-6">
                            <div>
                              <div className="flex justify-between mb-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zoom</label>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{Math.round(imageZoom * 100)}%</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <ZoomOut className="w-4 h-4 text-gray-400" />
                                <input 
                                  type="range" 
                                  min="1" 
                                  max="3" 
                                  step="0.1"
                                  value={imageZoom}
                                  onChange={(e) => setImageZoom(parseFloat(e.target.value))}
                                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <ZoomIn className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Position</label>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Horizontal</span>
                                    <span className="text-[10px] font-bold text-gray-900">{imagePosition.x}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={imagePosition.x}
                                    onChange={(e) => setImagePosition({ ...imagePosition, x: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Vertical</span>
                                    <span className="text-[10px] font-bold text-gray-900">{imagePosition.y}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={imagePosition.y}
                                    onChange={(e) => setImagePosition({ ...imagePosition, y: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters</label>
                              <button 
                                onClick={() => updateDesign({ imageFilters: DEFAULT_FILTERS })}
                                className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                              >
                                Reset Filters
                              </button>
                            </div>
                            
                            <div className="space-y-5">
                              {[
                                { label: 'Brightness', key: 'brightness', min: 0, max: 200, unit: '%' },
                                { label: 'Contrast', key: 'contrast', min: 0, max: 200, unit: '%' },
                                { label: 'Saturation', key: 'saturation', min: 0, max: 200, unit: '%' },
                                { label: 'Blur', key: 'blur', min: 0, max: 10, unit: 'px' },
                                { label: 'Grayscale', key: 'grayscale', min: 0, max: 100, unit: '%' },
                                { label: 'Sepia', key: 'sepia', min: 0, max: 100, unit: '%' },
                              ].map((filter) => (
                                <div key={filter.key}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{filter.label}</span>
                                    <span className="text-[10px] font-bold text-gray-900">
                                      {(currentDesign.imageFilters as any)?.[filter.key] || DEFAULT_FILTERS[filter.key as keyof typeof DEFAULT_FILTERS]}
                                      {filter.unit}
                                    </span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min={filter.min} 
                                    max={filter.max} 
                                    value={(currentDesign.imageFilters as any)?.[filter.key] || DEFAULT_FILTERS[filter.key as keyof typeof DEFAULT_FILTERS]}
                                    onChange={(e) => {
                                      const filters = currentDesign.imageFilters || DEFAULT_FILTERS;
                                      updateDesign({ 
                                        imageFilters: { ...filters, [filter.key]: parseInt(e.target.value) } 
                                      });
                                    }}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              updateDesign({ imageUrl: null, imageFilters: DEFAULT_FILTERS });
                              setImageZoom(1);
                              setImagePosition({ x: 50, y: 50 });
                            }}
                            className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Background
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTool === 'color' && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Accent Color</label>
                        <div className="grid grid-cols-5 gap-3">
                          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                            <button
                              key={color}
                              onClick={() => updateDesign({ accentColor: color })}
                              className={cn(
                                "aspect-square rounded-xl border-2 transition-all flex items-center justify-center shadow-sm",
                                currentDesign.accentColor === color ? "border-gray-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: ACCENT_COLORS[color] }}
                            >
                              {currentDesign.accentColor === color && (
                                <Check className={cn("w-4 h-4", color === 'white' ? "text-black" : "text-white")} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTool === 'gradient' && (
                    <div className="space-y-8">
                      <div className="space-y-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gradient Overlay</label>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Color</span>
                            <div className="flex gap-2">
                              {['#ffffff', '#000000', '#ef4444', '#3b82f6'].map(c => (
                                <button 
                                  key={c}
                                  onClick={() => updateDesign({ gradient: { ...(currentDesign.gradient || DEFAULT_GRADIENT), color: c } })}
                                  className={cn(
                                    "w-5 h-5 rounded-full border border-gray-200 transition-all",
                                    currentDesign.gradient?.color === c ? "ring-2 ring-red-500 scale-110" : "hover:scale-110"
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Opacity</span>
                              <span className="text-[10px] font-bold text-gray-900">{currentDesign.gradient?.opacity || 95}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={currentDesign.gradient?.opacity || 95}
                              onChange={(e) => updateDesign({ gradient: { ...(currentDesign.gradient || DEFAULT_GRADIENT), opacity: parseInt(e.target.value) } })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Height</span>
                              <span className="text-[10px] font-bold text-gray-900">{currentDesign.gradient?.height || 100}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              value={currentDesign.gradient?.height || 100}
                              onChange={(e) => updateDesign({ gradient: { ...(currentDesign.gradient || DEFAULT_GRADIENT), height: parseInt(e.target.value) } })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTool === 'presets' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presets Collection</label>
                        <button 
                          onClick={() => {
                            const name = prompt('Enter preset name:');
                            if (name) savePreset(name);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase hover:underline"
                        >
                          <Save className="w-3 h-3" />
                          Save Current
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {presets.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400 font-medium">No presets saved yet</p>
                          </div>
                        ) : (
                          presets.map((preset) => (
                            <div 
                              key={preset.id}
                              className="group flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                              onClick={() => applyPreset(preset)}
                            >
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Sparkles className="w-5 h-5 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{preset.name}</h4>
                                <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold">
                                  {preset.settings.layout} • {preset.settings.accentColor}
                                </p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePreset(preset.id);
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTool === 'layout' && (
                    <div className="space-y-6">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Template Layout</label>
                      <div className="grid grid-cols-1 gap-3">
                        {(['news', 'announcement', 'event', 'promotion'] as LayoutType[]).map((layout) => (
                          <button
                            key={layout}
                            onClick={() => updateDesign({ layout })}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all text-left capitalize font-bold flex items-center justify-between group",
                              currentDesign.layout === layout ? "border-red-500 bg-red-50 text-red-700" : "border-gray-100 hover:border-gray-200 text-gray-600"
                            )}
                          >
                            <span>{layout}</span>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              currentDesign.layout === layout ? "border-red-500 bg-red-500" : "border-gray-200 group-hover:border-gray-300"
                            )}>
                              {currentDesign.layout === layout && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3"
            >
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Toolbar */}
        <footer className="bg-white border-t border-gray-200 h-20 flex items-center justify-center gap-8 px-4 z-10">
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'text' ? null : 'text');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'text' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Type className="w-6 h-6" />
            <span className="text-xs font-medium">Text</span>
          </button>
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'image' ? null : 'image');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'image' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Image</span>
          </button>
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'color' ? null : 'color');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'color' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Palette className="w-6 h-6" />
            <span className="text-xs font-medium">Color</span>
          </button>
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'gradient' ? null : 'gradient');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'gradient' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Layers className="w-6 h-6" />
            <span className="text-xs font-medium">Gradient</span>
          </button>
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'layout' ? null : 'layout');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'layout' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <LayoutIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Layout</span>
          </button>
          <button 
            onClick={() => {
              setActiveTool(activeTool === 'presets' ? null : 'presets');
              setFocusedField(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-16",
              activeTool === 'presets' ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-xs font-medium">Presets</span>
          </button>
        </footer>

        {/* Export Modal */}
        <AnimatePresence>
          {isExporting && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Download Design</h3>
                  <button onClick={() => setIsExporting(false)} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Format</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setExportFormat('png')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                          exportFormat === 'png' ? "border-red-500 bg-red-50 text-red-600" : "border-gray-100 text-gray-400"
                        )}
                      >
                        PNG
                      </button>
                      <button 
                        onClick={() => setExportFormat('jpg')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                          exportFormat === 'jpg' ? "border-red-500 bg-red-50 text-red-600" : "border-gray-100 text-gray-400"
                        )}
                      >
                        JPG
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Quality</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setExportQuality('high')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                          exportQuality === 'high' ? "border-red-500 bg-red-50 text-red-600" : "border-gray-100 text-gray-400"
                        )}
                      >
                        High (2x)
                      </button>
                      <button 
                        onClick={() => setExportQuality('medium')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                          exportQuality === 'medium' ? "border-red-500 bg-red-50 text-red-600" : "border-gray-100 text-gray-400"
                        )}
                      >
                        Medium (1x)
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Dimensions</span>
                      <span className="font-bold text-gray-900">
                        {CANVAS_SIZES[currentDesign.size].width} × {CANVAS_SIZES[currentDesign.size].height}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Aspect Ratio</span>
                      <span className="font-bold text-gray-900 capitalize">{currentDesign.size}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50">
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    Download Image
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Home Header */}
      <header className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-red-100">
          <LayoutIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">QuickPost Studio</h1>
        <p className="text-gray-500 max-w-md">Create professional social media graphics in seconds. No design skills required.</p>
      </header>

      {/* Create New Section */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Plus className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Create New Post</h2>
          </div>
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-100"
          >
            <LayoutIcon className="w-5 h-5" />
            One-Tap Generator
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(CANVAS_SIZES) as CanvasSize[]).map((size) => (
            <button
              key={size}
              onClick={() => createNewDesign(size)}
              className="group relative bg-gray-50 hover:bg-red-50 border-2 border-transparent hover:border-red-200 rounded-3xl p-8 transition-all text-left flex flex-col items-center justify-center gap-6 h-64"
            >
              <div 
                className="bg-white shadow-md rounded-lg group-hover:shadow-xl transition-all flex items-center justify-center text-gray-300"
                style={{
                  width: size === 'landscape' ? '120px' : size === 'story' ? '60px' : '80px',
                  height: size === 'landscape' ? '67px' : size === 'story' ? '106px' : '80px',
                }}
              >
                <ImageIcon className="w-8 h-8 opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg mb-1">{CANVAS_SIZES[size].label}</h3>
                <p className="text-sm text-gray-400">{CANVAS_SIZES[size].width} × {CANVAS_SIZES[size].height}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Generator Modal */}
      <AnimatePresence>
        {isGeneratorOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">One-Tap Generator</h3>
                <button onClick={() => setIsGeneratorOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleGeneratorSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Subheading</label>
                  <input 
                    type="text" 
                    value={generatorData.subheading}
                    onChange={(e) => setGeneratorData({ ...generatorData, subheading: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="e.g. New Studio Launch"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea 
                    rows={3}
                    value={generatorData.description}
                    onChange={(e) => setGeneratorData({ ...generatorData, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                    placeholder="Describe your news..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Canvas Size</label>
                  <select 
                    value={generatorData.size}
                    onChange={(e) => setGeneratorData({ ...generatorData, size: e.target.value as CanvasSize })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    <option value="instagram">Instagram Post (1:1)</option>
                    <option value="landscape">Landscape (16:9)</option>
                    <option value="story">Story / Reel (9:16)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Image (Optional)</label>
                  <div className="relative w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-red-50 hover:border-red-200 transition-all group overflow-hidden">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setGeneratorData({ ...generatorData, imageUrl: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex items-center gap-3 z-10 pointer-events-none">
                      {generatorData.imageUrl ? (
                        <img src={generatorData.imageUrl} className="w-10 h-10 object-cover rounded-lg" alt="Preview" />
                      ) : (
                        <Upload className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm font-bold text-gray-700">
                        {generatorData.imageUrl ? 'Change Image' : 'Upload Image'}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-95 mt-4"
                >
                  Generate Post
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Designs Section */}
      {designs.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Recent Designs</h2>
            <button 
              onClick={() => {
                setDesigns([]);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {designs.map((design) => (
              <div 
                key={design.id}
                onClick={() => setCurrentDesign(design)}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-gray-100 rounded-2xl mb-3 overflow-hidden relative border border-gray-200 group-hover:border-red-200 transition-colors">
                  {design.imageUrl ? (
                    <img 
                      src={design.imageUrl} 
                      alt={design.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <LayoutIcon className="w-10 h-10 text-gray-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={(e) => deleteDesign(design.id, e)}
                      className="p-2 bg-white rounded-full shadow-lg text-red-500 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-sm truncate">{design.name}</h4>
                <p className="text-xs text-gray-400 capitalize">{design.size} • {new Date(design.lastModified).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
