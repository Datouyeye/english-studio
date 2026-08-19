import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 是原生模块，必须由 Node 在服务端运行时加载，不能打进 bundle。
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;