import React from 'react'
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiHtml5,
  SiCss,
  SiSass,
  SiJson,
  SiMarkdown,
  SiPython,
  SiGit,
  SiDocker,
  SiRust,
  SiGo,
  SiSvg,
  SiC,
  SiCplusplus,
  SiOpenjdk
} from 'react-icons/si'
import {
  VscFile,
  VscFileMedia,
  VscLock,
  VscSettings,
  VscFileCode
} from 'react-icons/vsc'

/**
 * Returns the authentic branded icon with extension-accurate colors.
 * 
 * Examples:
 * - JavaScript (.js): Authentic JS Yellow (#F7DF1E)
 * - React JS (.jsx): Authentic React Sky Blue (#61DAFB)
 * - TypeScript (.ts): Authentic TS Blue (#3178C6)
 * - React TS (.tsx): TS React Deep Sky Blue (#2563EB)
 * - HTML (.html): HTML5 Orange (#E34F26)
 * - CSS (.css): CSS3 Blue (#2563EB / #1572B6)
 * - JSON (.json): Warm Amber (#F59E0B)
 * - Markdown (.md): Markdown Sky Blue (#38BDF8)
 * - Python (.py): Python Blue (#3776AB)
 * - Git (.gitignore): Git Orange (#F05032)
 * - Images (.png, .jpg): Emerald (#34D399)
 */
export const getFileIcon = (fileName, className = 'text-xs shrink-0') => {
  if (!fileName) return <VscFile className={`${className} text-slate-400`} />

  const lowerName = fileName.toLowerCase()
  const ext = lowerName.split('.').pop()

  // Exact file name matches
  if (lowerName === '.gitignore' || lowerName === '.gitattributes') {
    return <SiGit className={`${className} text-[#F05032]`} title="Git Config" />
  }
  if (lowerName.startsWith('.env')) {
    return <VscLock className={`${className} text-yellow-400`} title="Environment Variables" />
  }
  if (lowerName === 'dockerfile' || lowerName.includes('docker-compose')) {
    return <SiDocker className={`${className} text-[#2496ED]`} title="Docker" />
  }
  if (lowerName.includes('package.json')) {
    return <SiJson className={`${className} text-[#F59E0B]`} title="Node Package" />
  }
  if (lowerName.includes('package-lock.json') || lowerName.includes('yarn.lock') || lowerName.includes('pnpm-lock')) {
    return <VscLock className={`${className} text-amber-500`} title="Lockfile" />
  }

  // Extension based matches
  switch (ext) {
    // JavaScript - Yellow
    case 'js':
    case 'mjs':
    case 'cjs':
      return <SiJavascript className={`${className} text-[#F7DF1E]`} title="JavaScript" />

    // React JS - React Cyan/Sky Blue
    case 'jsx':
      return <SiReact className={`${className} text-[#61DAFB]`} title="React (JavaScript)" />

    // TypeScript - TypeScript Blue
    case 'ts':
      return <SiTypescript className={`${className} text-[#3178C6]`} title="TypeScript" />

    // React TS - React Atom with TypeScript Deep Blue
    case 'tsx':
      return <SiReact className={`${className} text-[#38BDF8]`} title="React (TypeScript)" />

    // HTML - HTML5 Orange
    case 'html':
    case 'htm':
      return <SiHtml5 className={`${className} text-[#E34F26]`} title="HTML5" />

    // CSS - CSS3 Blue
    case 'css':
      return <SiCss className={`${className} text-[#2563EB]`} title="CSS3" />

    // SASS / SCSS - Pink
    case 'scss':
    case 'sass':
      return <SiSass className={`${className} text-[#CC6699]`} title="Sass" />

    // JSON - Amber
    case 'json':
      return <SiJson className={`${className} text-[#F59E0B]`} title="JSON" />

    // Markdown - Cyan/Sky Blue
    case 'md':
    case 'mdx':
      return <SiMarkdown className={`${className} text-[#38BDF8]`} title="Markdown" />

    // Python - Python Navy Blue
    case 'py':
    case 'pyw':
      return <SiPython className={`${className} text-[#3776AB]`} title="Python" />

    // C - Light Blue
    case 'c':
    case 'h':
      return <SiC className={`${className} text-[#A8B9CC]`} title="C Source" />

    // C++ - Deep Blue
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hxx':
      return <SiCplusplus className={`${className} text-[#00599C]`} title="C++ Source" />

    // Java - Duke Orange
    case 'java':
      return <SiOpenjdk className={`${className} text-[#ED8B00]`} title="Java Source" />

    // Rust - Rust Terracotta / Orange
    case 'rs':
      return <SiRust className={`${className} text-[#DEA584]`} title="Rust" />

    // Go - Go Cyan Blue
    case 'go':
      return <SiGo className={`${className} text-[#00ADD8]`} title="Go" />

    // SVG - Amber Gold
    case 'svg':
      return <SiSvg className={`${className} text-[#FFB13B]`} title="SVG Image" />

    // Images - Emerald
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'ico':
      return <VscFileMedia className={`${className} text-emerald-400`} title="Image" />

    // Config YAML
    case 'yml':
    case 'yaml':
      return <VscSettings className={`${className} text-purple-400`} title="YAML Config" />

    default:
      return <VscFileCode className={`${className} text-slate-400`} title="File" />
  }
}

export default getFileIcon

