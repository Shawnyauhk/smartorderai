'use client' 
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h1 className="text-4xl font-headline font-bold text-destructive mb-4">哎呀！出現問題。</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        我們遇到了意外問題。請重試，如果問題持續存在，請聯繫支援。
      </p>
      <p className="text-sm text-muted-foreground mb-2">錯誤詳情 (供開發者參考)：</p>
      <pre className="text-xs bg-muted p-3 rounded-md max-w-full overflow-auto mb-8">
        {error.message}
        {error.digest && `\nDigest: ${error.digest}`}
      </pre>
      <Button
        onClick={
          () => reset()
        }
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        再試一次
      </Button>
    </div>
  )
}
