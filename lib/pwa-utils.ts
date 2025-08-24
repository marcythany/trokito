export class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null
  private isInstalled = false

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  async init(): Promise<void> {
    if (typeof window === "undefined") return

    // Register service worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("[PWA] Service Worker registered:", registration)

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          console.log("[PWA] New service worker available")
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] New content available, please refresh")
                this.showUpdateNotification()
              }
            })
          }
        })
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error)
      }
    }

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("[PWA] Install prompt available")
      e.preventDefault()
      this.deferredPrompt = e
    })

    // Check if already installed
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App installed")
      this.isInstalled = true
      this.deferredPrompt = null
    })

    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      console.log("[PWA] Install prompt result:", outcome)

      if (outcome === "accepted") {
        this.deferredPrompt = null
        return true
      }
      return false
    } catch (error) {
      console.error("[PWA] Install prompt error:", error)
      return false
    }
  }

  isRunningAsPWA(): boolean {
    return this.isInstalled || window.matchMedia("(display-mode: standalone)").matches
  }

  private showUpdateNotification(): void {
    // Implementar notificação de atualização disponível
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Trokito - Atualização Disponível", {
        body: "Uma nova versão está disponível. Recarregue a página para atualizar.",
        icon: "/favicon.ico",
      })
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  // Vibration API support
  vibrate(pattern: number | number[]): boolean {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
      return true
    }
    return false
  }

  // Wake lock API (keep screen on during use)
  private wakeLock: any = null

  async requestWakeLock(): Promise<boolean> {
    if (!("wakeLock" in navigator)) {
      return false
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request("screen")
      console.log("[PWA] Wake lock acquired")
      return true
    } catch (error) {
      console.error("[PWA] Wake lock failed:", error)
      return false
    }
  }

  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release()
      this.wakeLock = null
      console.log("[PWA] Wake lock released")
    }
  }
}

// Initialize PWA manager
export const pwaManager = PWAManager.getInstance()
