'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';

// Must match the catalog service limits (catalog-service/src/config/upload.config.ts)
export const MAX_PRODUCT_IMAGES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

interface PendingUpload {
  id: string;
  name: string;
  progress: number;
  previewUrl: string;
}

interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** Lets the parent form block "Save" while files are still uploading */
  onUploadingChange?: (uploading: boolean) => void;
}

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function ProductImageManager({ images, onChange, onUploadingChange }: ProductImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [dragOverZone, setDragOverZone] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // Uploads finish asynchronously; keep the latest list in a ref so parallel uploads don't overwrite each other
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    onUploadingChange?.(pending.length > 0);
  }, [pending.length, onUploadingChange]);

  const slotsLeft = MAX_PRODUCT_IMAGES - images.length - pending.length;

  const appendImages = (urls: string[]) => {
    const next = [...imagesRef.current];
    for (const url of urls) {
      if (!next.includes(url) && next.length < MAX_PRODUCT_IMAGES) next.push(url);
    }
    imagesRef.current = next;
    onChange(next);
  };

  // ---------- Upload from this computer ----------
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const problems: string[] = [];
    const accepted: File[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`"${file.name}" is not a JPEG, PNG, WebP, GIF or AVIF image.`);
      } else if (file.size > MAX_FILE_BYTES) {
        problems.push(`"${file.name}" is ${formatMb(file.size)}; the limit is ${formatMb(MAX_FILE_BYTES)}.`);
      } else if (accepted.length >= slotsLeft) {
        problems.push(`"${file.name}" skipped: a product can have at most ${MAX_PRODUCT_IMAGES} images.`);
      } else {
        accepted.push(file);
      }
    }
    setMessages(problems);
    if (accepted.length === 0) return;

    const jobs = accepted.map((file) => ({
      file,
      job: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      } as PendingUpload,
    }));
    setPending((prev) => [...prev, ...jobs.map((j) => j.job)]);

    // Upload in parallel; add each image as soon as it is stored, in the order the files were chosen
    const results = await Promise.all(
      jobs.map(async ({ file, job }) => {
        try {
          const res = await api.post('/uploads/products', file, {
            headers: { 'Content-Type': file.type },
            onUploadProgress: (event) => {
              const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
              setPending((prev) => prev.map((p) => (p.id === job.id ? { ...p, progress } : p)));
            },
          });
          return { url: res.data.data.url as string };
        } catch (err) {
          return { error: `"${file.name}": ${getErrorMessage(err, 'upload failed')}` };
        } finally {
          URL.revokeObjectURL(job.previewUrl);
          setPending((prev) => prev.filter((p) => p.id !== job.id));
        }
      })
    );

    appendImages(results.flatMap((r) => (r.url ? [r.url] : [])));
    const failures = results.flatMap((r) => (r.error ? [r.error] : []));
    if (failures.length > 0) setMessages((prev) => [...prev, ...failures]);
  };

  // ---------- Add by URL ----------
  const addFromUrlInput = () => {
    const candidates = urlInput
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;

    const valid = candidates.filter(isHttpUrl);
    const invalid = candidates.filter((u) => !isHttpUrl(u));
    const problems = invalid.map((u) => `"${u}" is not a valid http(s) URL.`);

    const room = Math.max(MAX_PRODUCT_IMAGES - images.length - pending.length, 0);
    const toAdd = valid.filter((u) => !images.includes(u)).slice(0, room);
    if (valid.length > toAdd.length && toAdd.length === room) {
      problems.push(`A product can have at most ${MAX_PRODUCT_IMAGES} images.`);
    }
    if (toAdd.some((u) => u.startsWith('http://'))) {
      problems.push('Tip: http:// images are blocked by browsers on an https:// store. Prefer https:// links.');
    }

    appendImages(toAdd);
    setMessages(problems);
    setUrlInput('');
  };

  // ---------- Reorder / remove ----------
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragOverZone(true);
          }
        }}
        onDragLeave={() => setDragOverZone(false)}
        onDrop={(e) => {
          if (e.dataTransfer.files.length === 0) return;
          e.preventDefault();
          setDragOverZone(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
          dragOverZone ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-950'
        }`}
      >
        <UploadCloud className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-300">Drag & drop images here, or</p>
        <button
          type="button"
          disabled={slotsLeft <= 0}
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImagePlus className="w-4 h-4" /> Choose from computer
        </button>
        <p className="text-xs text-slate-500 mt-3">
          JPEG, PNG, WebP, GIF or AVIF · up to 10 MB each · converted to WebP · {images.length + pending.length}/{MAX_PRODUCT_IMAGES} images
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = ''; // allow choosing the same file again
          }}
        />
      </div>

      {/* Add by URL */}
      <div>
        <label htmlFor="image-url-input" className="block text-xs font-semibold text-slate-300 uppercase mb-2">
          Or add image URL(s)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="image-url-input"
              type="text"
              inputMode="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the URL instead of submitting the whole product form
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFromUrlInput();
                }
              }}
              placeholder="https://cdn.example.com/product-front.jpg"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={addFromUrlInput}
            disabled={!urlInput.trim() || slotsLeft <= 0}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Paste one or more links separated by spaces, commas or new lines.</p>
      </div>

      {messages.length > 0 && (
        <ul className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
          {messages.map((m, i) => (
            <li key={i} className="flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {m}
            </li>
          ))}
        </ul>
      )}

      {/* Gallery */}
      {(images.length > 0 || pending.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
            Gallery · the first image is the main image · drag to reorder
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {images.map((url, idx) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => {
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (dragIndex !== null) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  move(dragIndex, idx);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`group relative aspect-square rounded-xl bg-slate-950 border overflow-hidden cursor-grab ${
                  idx === 0 ? 'border-indigo-500' : 'border-slate-800'
                } ${dragIndex === idx ? 'opacity-40' : ''}`}
              >
                {broken[url] ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-rose-400 text-xs p-2 text-center gap-1">
                    <AlertTriangle className="w-5 h-5" />
                    Can&apos;t load this image
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={`Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => setBroken((b) => ({ ...b, [url]: true }))}
                  />
                )}

                {idx === 0 && (
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Main
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-slate-950/85 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Move left"
                    aria-label={`Move image ${idx + 1} left`}
                    disabled={idx === 0}
                    onClick={() => move(idx, idx - 1)}
                    className="p-1 rounded-md text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Make main image"
                    aria-label={`Make image ${idx + 1} the main image`}
                    disabled={idx === 0}
                    onClick={() => move(idx, 0)}
                    className="p-1 rounded-md text-amber-300 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    aria-label={`Remove image ${idx + 1}`}
                    onClick={() => remove(idx)}
                    className="p-1 rounded-md text-rose-400 hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move right"
                    aria-label={`Move image ${idx + 1} right`}
                    disabled={idx === images.length - 1}
                    onClick={() => move(idx, idx + 1)}
                    className="p-1 rounded-md text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {pending.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={p.name} className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-200 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {p.progress}%
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all" style={{ width: `${p.progress}%` }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
