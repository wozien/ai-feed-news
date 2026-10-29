"use client";

import dynamic from "next/dynamic";

// 生产构建里 NODE_ENV 会被静态替换，整段动态导入会被摇掉，不会进客户端包
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
        { ssr: false },
      )
    : () => null;

export function QueryDevtools() {
  return <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />;
}
