import { useState } from "react";
import type { LabelWithPriority } from "../domain/labels/LabelWithPriority";

/** 深海主題 10 個預設顏色色票 */
const OCEAN_COLORS = [
  "#00B4D8",
  "#48CAE4",
  "#0077B6",
  "#023E8A",
  "#FF8C69",
  "#90E0EF",
  "#ADE8F4",
  "#CAF0F8",
  "#FF6B6B",
  "#51CF66",
];

interface LabelEditorPanelProps {
  /** 建立/更新完成回調 */
  onSave: (name: string, color: string, priority: number) => void;
  onCancel: () => void;
  /** 若為編輯模式，傳入現有標籤 */
  initialLabel?: LabelWithPriority;
}

/**
 * LabelEditorPanel — 標籤建立/編輯 UI
 *
 * 顏色選擇（10 預設 + HEX input）、名稱輸入、1–5 星重要等級。
 */
export const LabelEditorPanel: React.FC<LabelEditorPanelProps> = ({
  onSave,
  onCancel,
  initialLabel,
}) => {
  const [name, setName] = useState(initialLabel?.name ?? "");
  const [color, setColor] = useState(initialLabel?.color ?? OCEAN_COLORS[0]);
  const [hexInput, setHexInput] = useState("");
  const [priority, setPriority] = useState(initialLabel?.priority ?? 1);

  const isEditMode = !!initialLabel;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, color, priority);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    // 驗證 HEX 格式（#RRGGBB 或 #RGB）
    if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
      setColor(value);
    }
  };

  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-xl shadow-lg w-72"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        className="font-semibold text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        {isEditMode ? "編輯標籤" : "建立標籤"}
      </h3>

      {/* 顏色選擇器 */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          顏色
        </label>
        {/* 預設色票 */}
        <div className="flex flex-wrap gap-2">
          {OCEAN_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`選擇顏色 ${c}`}
              onClick={() => {
                setColor(c);
                setHexInput("");
              }}
              className="w-6 h-6 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "var(--text-primary)" : "transparent",
                transform: color === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
        {/* 自訂 HEX */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="#RRGGBB"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            maxLength={7}
            className="flex-1 text-xs px-2 py-1 rounded outline-none"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
            aria-label="自訂 HEX 顏色"
          />
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, border: "1px solid var(--border)" }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 名稱輸入 */}
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
          htmlFor="label-name-input"
        >
          標籤名稱
        </label>
        <input
          id="label-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          maxLength={20}
          placeholder="最多 20 個字元"
          className="text-sm px-2 py-1.5 rounded outline-none"
          style={{
            background: "var(--bg-hover)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          }}
          aria-label="標籤名稱"
        />
        <span className="text-[10px] text-right" style={{ color: "var(--text-muted)" }}>
          {name.length}/20
        </span>
      </div>

      {/* 優先等級 (1–5 星) */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          重要等級
        </label>
        <div className="flex items-center gap-1" role="group" aria-label="重要等級選擇">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              aria-label={`${star} 星`}
              onClick={() => setPriority(star)}
              className="text-xl transition-transform hover:scale-110"
              style={{ color: star <= priority ? "#FFD700" : "var(--border)" }}
            >
              ★
            </button>
          ))}
          <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {priority} / 5
          </span>
        </div>
      </div>

      {/* 標籤預覽 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          預覽
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit"
          style={{
            backgroundColor: color + "22",
            color: color,
            border: `1px solid ${color}55`,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          {name || "標籤名稱"}
          {priority > 0 && <span>{"★".repeat(priority)}</span>}
        </span>
      </div>

      {/* 按鈕列 */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded transition-opacity hover:opacity-70"
          style={{
            background: "var(--bg-hover)",
            color: "var(--text-secondary)",
          }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-sm px-3 py-1.5 rounded transition-opacity disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "var(--accent-text, #0A1628)",
          }}
        >
          {isEditMode ? "更新" : "建立"}
        </button>
      </div>
    </div>
  );
};
