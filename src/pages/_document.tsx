import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload game images */}
        <link 
          rel="preload" 
          href="/images/sperm-head-1.png" 
          as="image"
          type="image/png"
        />
        <link 
          rel="preload" 
          href="/images/sperm-head-2.png" 
          as="image"
          type="image/png"
        />
        <link 
          rel="preload" 
          href="/images/sperm-head-3.png" 
          as="image"
          type="image/png"
        />
        <link 
          rel="preload" 
          href="/images/sperm-head-4.png" 
          as="image"
          type="image/png"
        />
        
        {/* Add favicon with low priority to prevent blocking */}
        <link
          rel="icon"
          href="/favicon.ico"
          sizes="any"
          fetchPriority="low"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 