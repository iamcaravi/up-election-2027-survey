"use client";

const KEY = "up2027_device_id";

export function getDeviceFingerprint(): string {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id =
        (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`) +
        `-${navigator.userAgent.length}-${screen.width}x${screen.height}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `fallback-${Date.now()}`;
  }
}
