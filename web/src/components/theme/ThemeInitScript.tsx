export function ThemeInitScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;d.classList.remove('light','dark');if(t==='light'||t==='dark'){d.classList.add(t);}else{if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){d.classList.add('dark');}else{d.classList.add('light');}}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

