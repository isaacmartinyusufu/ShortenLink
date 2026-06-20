import { useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type QRProps = {
  value: string;
  fg?: string;
  bg?: string;
  level?: "L" | "M" | "Q" | "H";
  size?: number;
};

export function QRDisplay({ value, fg = "#0a0a0a", bg = "#ffffff", level = "M", size = 200 }: QRProps) {
  const canvasWrap = useRef<HTMLDivElement>(null);

  function downloadSVG() {
    const svg = document.getElementById("qr-svg") as SVGSVGElement | null;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    triggerDownload(URL.createObjectURL(blob), "qr.svg");
  }

  function downloadPNG() {
    const canvas = canvasWrap.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.toBlob((b) => b && triggerDownload(URL.createObjectURL(b), "qr.png"));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-xl p-3 border shadow-card"
        style={{ background: bg }}
      >
        <QRCodeSVG id="qr-svg" value={value} fgColor={fg} bgColor={bg} level={level} size={size} />
      </div>
      <div ref={canvasWrap} style={{ display: "none" }}>
        <QRCodeCanvas value={value} fgColor={fg} bgColor={bg} level={level} size={512} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={downloadSVG}>
          <Download className="w-3.5 h-3.5 mr-1" /> SVG
        </Button>
        <Button size="sm" variant="outline" onClick={downloadPNG}>
          <Download className="w-3.5 h-3.5 mr-1" /> PNG
        </Button>
      </div>
    </div>
  );
}

function triggerDownload(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
