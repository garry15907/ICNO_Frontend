import { useEffect, useState } from "react";
import { classifyResolutionType, creatorResolutionLabelOf, type CreatorResolutionType } from "@/data/mockData";

export type DisplayInfo = {
  width: number;
  height: number;
  type: CreatorResolutionType;
  label: string;
};

function read(): DisplayInfo {
  if (typeof window === "undefined" || !window.screen) {
    return { width: 2560, height: 1440, type: "QHD", label: "QHD 2560 × 1440" };
  }
  const width = window.screen.width;
  const height = window.screen.height;
  const type = classifyResolutionType(width, height);
  return { width, height, type, label: creatorResolutionLabelOf(type, width, height) };
}

/** 현재 사용자의 화면 해상도를 감지하고 라벨을 붙여 반환한다. */
export function useCurrentDisplay(): DisplayInfo {
  const [info, setInfo] = useState<DisplayInfo>(() => read());
  useEffect(() => {
    const onResize = () => setInfo(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return info;
}