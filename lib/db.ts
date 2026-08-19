import "server-only";
import { getPrismaSingleton } from "./prisma-client";

export const prisma = getPrismaSingleton();