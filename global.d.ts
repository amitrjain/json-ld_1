// global.d.ts
export { }; // Ensures this file is treated as a module.

declare global {
  namespace NodeJS {
    interface Global {
      userInfo: { name: string; role: string };
    }
  }
}