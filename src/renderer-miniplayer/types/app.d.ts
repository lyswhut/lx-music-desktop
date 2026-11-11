declare global {
  interface Window {
    ELECTRON_DISABLE_SECURITY_WARNINGS?: string

    setTheme: (colors: Record<string, string>) => void
    setLang: (lang?: string) => void
    os: 'windows' | 'linux' | 'mac'
  }

  namespace LX {

  }
}

export {}
