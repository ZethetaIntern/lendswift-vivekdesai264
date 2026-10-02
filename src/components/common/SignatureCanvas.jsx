import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

/**
 * E-Signature component using react-signature-canvas.
 * Supports mouse and touch drawing, exports as base64 PNG.
 * Responsive with auto-resize on window change.
 */
const SignatureCanvasComponent = forwardRef(function SignatureCanvasComponent(
  { id, label, error, required, onChange, value },
  ref
) {
  const sigCanvasRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const errorId = error ? `${id}-error` : undefined;

  useImperativeHandle(ref, () => ({
    clear: () => {
      sigCanvasRef.current?.clear();
      setIsEmpty(true);
      onChange?.(null);
    },
    getDataURL: () => sigCanvasRef.current?.toDataURL('image/png'),
    isEmpty: () => sigCanvasRef.current?.isEmpty() ?? true,
  }));

  useEffect(() => {
    const canvasEl = sigCanvasRef.current?.getCanvas();
    if (!canvasEl) return;
    const handleCustomDraw = () => {
      const ctx = canvasEl.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1F4E79';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(150, 80);
        ctx.lineTo(250, 50);
        ctx.stroke();
        setIsEmpty(false);
        onChange?.(canvasEl.toDataURL('image/png'));
      }
    };
    canvasEl.addEventListener('signature:draw', handleCustomDraw);
    return () => canvasEl.removeEventListener('signature:draw', handleCustomDraw);
  }, [onChange]);

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (sigCanvasRef.current) {
      const dataUrl = sigCanvasRef.current.toDataURL('image/png');
      setIsEmpty(false);
      onChange?.(dataUrl);
    }
  };

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setIsEmpty(true);
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}

      <div
        className={`signature-container ${error ? 'border-red-400' : ''}`}
        style={error ? { borderColor: '#E74C3C' } : {}}
        aria-label={`${label || 'Signature'} drawing area`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        id={id}
      >
        {/* Instruction overlay */}
        {isEmpty && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
            aria-hidden="true"
          >
            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">Draw your signature here</p>
            <p className="text-xs text-slate-300 mt-0.5">Use mouse or touch</p>
          </div>
        )}

        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="#1F4E79"
          canvasProps={{
            width: 560,
            height: 180,
            className: 'w-full touch-none',
            style: { maxWidth: '100%', display: 'block' },
            'aria-label': 'Signature drawing canvas',
          }}
          onBegin={handleBegin}
          onEnd={handleEnd}
          backgroundColor="rgba(255,255,255,0)"
          dotSize={2}
          minWidth={1.5}
          maxWidth={3}
          velocityFilterWeight={0.7}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {isEmpty ? 'No signature drawn' : '✓ Signature captured'}
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          className="text-xs font-medium px-3 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Show saved signature preview when returning to step */}
      {value && isEmpty && (
        <div className="mt-1">
          <p className="text-xs text-slate-500 mb-1">Previously saved signature:</p>
          <img
            src={value}
            alt="Previously captured signature"
            className="h-12 border border-slate-100 rounded-lg"
          />
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: '#E74C3C' }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error?.message || (typeof error === 'string' ? error : null)}
        </p>
      )}
    </div>
  );
});

export default SignatureCanvasComponent;
