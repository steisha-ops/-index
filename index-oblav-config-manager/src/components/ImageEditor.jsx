import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, RotateCw, X as CloseIcon } from 'lucide-react';

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());

  // Загрузка изображения
  useEffect(() => {
    const img = imageRef.current;
    img.src = imageUrl;
    img.onload = () => {
      drawPreview();
    };
  }, [imageUrl]);

  // Перерисовка при изменении параметров
  useEffect(() => {
    drawPreview();
  }, [scale, rotation, offsetX, offsetY]);

  const drawPreview = () => {
    if (!canvasRef.current || !imageRef.current.complete) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const img = imageRef.current;

    // Установим высокое разрешение для качества
    const dpi = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth || 800;
    const height = canvas.offsetHeight || 600;
    
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    ctx.scale(dpi, dpi);

    // Очищаем canvas чёрным фоном
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Улучшаем качество отрисовки
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Сохраняем состояние
    ctx.save();

    // Перемещаемся в центр
    ctx.translate(width / 2, height / 2);

    // Применяем трансформации
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale / 100, scale / 100);
    ctx.translate(offsetX / (scale / 100), offsetY / (scale / 100));

    // Рисуем изображение в центре
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Восстанавливаем состояние
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - offsetX,
      y: e.clientY - rect.top - offsetY,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setOffsetX(e.clientX - rect.left - dragStart.x);
    setOffsetY(e.clientY - rect.top - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = () => {
    setScale(100);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const applyChanges = () => {
    if (!canvasRef.current) return;
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.98);
    onSave(base64);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2">
      <div className="bg-[#0a0a0a] rounded-lg border border-pink-500/30 w-full h-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-[#1a1a1a] border-b border-pink-500/30 flex items-center px-4 justify-between flex-shrink-0">
          <h3 className="text-sm font-bold text-pink-400">✏️ Редактор фото (живой превью)</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-2 p-2 min-h-0">
          {/* Canvas превью - большой слева */}
          <div
            ref={containerRef}
            className="flex-1 bg-black rounded-lg border border-pink-500/20 overflow-hidden cursor-grab active:cursor-grabbing relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ minHeight: 0 }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>

          {/* Управление справа - компактно */}
          <div className="w-64 flex flex-col gap-2 overflow-y-auto rounded-lg bg-[#111] p-3">
            {/* Масштаб */}
            <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400">Масштаб</label>
                <span className="text-xs font-bold text-pink-400">{scale}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer accent-pink-500 text-xs"
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setScale(Math.max(1, scale - 20))}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition"
                  title="Уменьшить"
                >
                  −
                </button>
                <button
                  onClick={() => setScale(100)}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition"
                  title="100%"
                >
                  100%
                </button>
                <button
                  onClick={() => setScale(Math.min(500, scale + 20))}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition"
                  title="Увеличить"
                >
                  +
                </button>
              </div>
            </div>

            {/* Поворот */}
            <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400">Поворот</label>
                <span className="text-xs font-bold text-pink-400">{rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setRotation((rotation - 90 + 360) % 360)}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition text-[10px]"
                >
                  ↺ −90°
                </button>
                <button
                  onClick={() => setRotation(0)}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition text-[10px]"
                >
                  ↻ 0°
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white px-1 py-1 rounded text-xs transition text-[10px]"
                >
                  ↻ +90°
                </button>
              </div>
            </div>

            {/* Смещение */}
            <div className="bg-[#1a1a1a] p-2 rounded border border-[#333] text-[11px] text-gray-500 space-y-0.5">
              <p className="font-bold text-gray-400">Смещение (пиксели):</p>
              <p>X: <span className="text-pink-400 font-mono">{offsetX}</span></p>
              <p>Y: <span className="text-pink-400 font-mono">{offsetY}</span></p>
              <p className="text-[10px] text-gray-600 mt-1">🖱️ Зажми левую кнопку и тащи</p>
            </div>

            {/* Быстрые действия */}
            <div className="flex gap-1">
              <button
                onClick={resetTransform}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white px-2 py-1.5 rounded text-xs font-bold transition"
                title="Сброс"
              >
                ↻ Сброс
              </button>
            </div>

            {/* Кнопки действия */}
            <div className="border-t border-[#333] pt-2 flex gap-1">
              <button
                onClick={onCancel}
                className="flex-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 px-2 py-1.5 rounded text-xs font-bold transition border border-red-600/30"
              >
                ✕ Отмена
              </button>
              <button
                onClick={applyChanges}
                className="flex-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 px-2 py-1.5 rounded text-xs font-bold transition border border-green-600/30"
              >
                ✓ Применить
              </button>
            </div>

            <div className="text-[10px] text-gray-600 p-1.5 bg-[#1a1a1a] rounded border border-[#333]">
              💡 Качество: JPEG 98% • DPI: авто • Частота перерисовки: реальная
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
